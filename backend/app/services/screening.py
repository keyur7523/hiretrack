import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import AIScreening, Application, Job, ScreeningRecommendation, ScreeningStatus

logger = logging.getLogger('hiretrack.screening')

SYSTEM_PROMPT = """You are an objective resume screening assistant. Analyze the candidate's resume against the job description.
Return ONLY valid JSON matching the specified schema. Be fair and base assessments solely on demonstrated qualifications.
Do not assume gender, ethnicity, or any protected characteristics. Focus only on skills, experience, and qualifications."""

USER_PROMPT_TEMPLATE = """Job Title: {title}
Company: {company}
Job Description:
{description}

---

Candidate Resume:
{resume_text}

---

Analyze this resume against the job description. Return a JSON object with exactly these fields:
{{
  "score": <integer 0-100, where 100 is perfect match>,
  "recommendation": "<one of: strong_match, good_match, partial_match, weak_match>",
  "skills_match": {{
    "matched": ["skill1", "skill2"],
    "missing": ["skill1", "skill2"],
    "bonus": ["skill1", "skill2"]
  }},
  "experience_assessment": "<brief 1-2 sentence assessment of experience level and relevance>",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"]
}}

Return ONLY the JSON object, no other text."""


async def _call_anthropic(system_prompt: str, user_prompt: str, model: str, api_key: str) -> str:
    """Call Anthropic Claude API and return the text response."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=model,
        max_tokens=1024,
        temperature=0,
        system=system_prompt,
        messages=[{'role': 'user', 'content': user_prompt}],
    )
    return response.content[0].text


async def _call_openai(system_prompt: str, user_prompt: str, model: str, api_key: str) -> str:
    """Call OpenAI API and return the text response."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=model,
        max_tokens=1024,
        temperature=0,
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
    )
    return response.choices[0].message.content


async def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Route to the configured LLM provider."""
    settings = get_settings()
    provider = settings.ai_provider
    model = settings.effective_ai_model
    api_key = settings.ai_api_key

    if not api_key:
        raise ValueError(f'No API key configured for provider: {provider}')

    if provider == 'anthropic':
        return await _call_anthropic(system_prompt, user_prompt, model, api_key)
    elif provider == 'openai':
        return await _call_openai(system_prompt, user_prompt, model, api_key)
    else:
        raise ValueError(f'Unknown AI provider: {provider}')


def _parse_screening_result(raw_text: str) -> dict:
    """Parse LLM response into structured screening result."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        # Remove first and last lines (code fences)
        lines = [l for l in lines if not l.strip().startswith('```')]
        text = '\n'.join(lines)

    result = json.loads(text)

    # Validate required fields
    score = int(result.get('score', 0))
    score = max(0, min(100, score))
    result['score'] = score

    rec = result.get('recommendation', 'weak_match')
    valid_recs = {'strong_match', 'good_match', 'partial_match', 'weak_match'}
    if rec not in valid_recs:
        result['recommendation'] = 'partial_match'

    # Ensure skills_match structure
    skills = result.get('skills_match', {})
    result['skills_match'] = {
        'matched': skills.get('matched', []),
        'missing': skills.get('missing', []),
        'bonus': skills.get('bonus', []),
    }

    result.setdefault('experience_assessment', '')
    result.setdefault('strengths', [])
    result.setdefault('concerns', [])

    return result


async def run_screening(session: AsyncSession, application_id: UUID) -> AIScreening:
    """Run AI screening for an application. Called by the worker."""
    # Load application and job
    application = await session.get(Application, application_id)
    if not application:
        raise ValueError(f'Application not found: {application_id}')

    job = await session.get(Job, application.job_id)
    if not job:
        raise ValueError(f'Job not found for application: {application_id}')

    # Get or create screening record
    stmt = select(AIScreening).where(AIScreening.application_id == application_id)
    screening = (await session.execute(stmt)).scalar_one_or_none()
    if not screening:
        screening = AIScreening(application_id=application_id, status=ScreeningStatus.pending)
        session.add(screening)

    screening.status = ScreeningStatus.processing
    await session.flush()

    try:
        # Build prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            title=job.title,
            company=job.company,
            description=job.description,
            resume_text=application.resume_text,
        )

        # Call LLM
        raw_response = await _call_llm(SYSTEM_PROMPT, user_prompt)
        logger.info({'message': 'screening.llm_response', 'application_id': str(application_id), 'length': len(raw_response)})

        # Parse result
        result = _parse_screening_result(raw_response)

        # Update screening record
        screening.status = ScreeningStatus.completed
        screening.score = result['score']
        screening.recommendation = ScreeningRecommendation(result['recommendation'])
        screening.result = result
        screening.completed_at = datetime.now(timezone.utc)
        screening.error_message = None

        logger.info({
            'message': 'screening.completed',
            'application_id': str(application_id),
            'score': result['score'],
            'recommendation': result['recommendation'],
        })

    except Exception as exc:
        screening.status = ScreeningStatus.failed
        screening.error_message = str(exc)[:500]
        logger.error({'message': 'screening.failed', 'application_id': str(application_id), 'error': str(exc)})
        raise

    return screening


async def get_screening_for_application(session: AsyncSession, application_id: UUID) -> AIScreening | None:
    """Load screening result for an application."""
    stmt = select(AIScreening).where(AIScreening.application_id == application_id)
    return (await session.execute(stmt)).scalar_one_or_none()
