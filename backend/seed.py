"""
Seed script for HireTrack — creates realistic demo data.
Run: python seed.py <API_BASE_URL>
Example: python seed.py https://hiretrack-onls.onrender.com
"""
import sys
import time
import httpx
import uuid

API_BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'https://hiretrack-onls.onrender.com'

# --- Accounts ---
EMPLOYER = {'email': 'employer@hiretrack.demo', 'password': 'DemoPass123!', 'role': 'employer'}
APPLICANTS = [
    {'email': 'alice.chen@hiretrack.demo', 'password': 'DemoPass123!', 'role': 'applicant'},
    {'email': 'bob.martinez@hiretrack.demo', 'password': 'DemoPass123!', 'role': 'applicant'},
    {'email': 'carol.johnson@hiretrack.demo', 'password': 'DemoPass123!', 'role': 'applicant'},
]

# --- 50 Realistic Jobs ---
JOBS = [
    # Software Engineering
    {"title": "Senior Backend Engineer", "company": "Stripe", "location": "San Francisco, CA", "description": "We're looking for a Senior Backend Engineer to build and scale our payment processing infrastructure. You'll work on high-throughput distributed systems handling millions of transactions daily.\n\nRequirements:\n- 5+ years of backend development experience\n- Proficiency in Python, Go, or Ruby\n- Experience with distributed systems and microservices\n- Strong understanding of database design (PostgreSQL, Redis)\n- Experience with message queues (Kafka, RabbitMQ)\n- BS/MS in Computer Science or equivalent\n\nNice to have:\n- Experience with payment systems or fintech\n- Kubernetes and Docker experience\n- Contributions to open source projects", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Frontend Engineer", "company": "Vercel", "location": "Remote", "description": "Join Vercel to build the future of web development tools. You'll work on our dashboard, deployment platform, and developer experience.\n\nRequirements:\n- 3+ years of experience with React and TypeScript\n- Strong understanding of modern CSS (Tailwind, CSS-in-JS)\n- Experience with Next.js or similar frameworks\n- Understanding of web performance optimization\n- Experience with design systems and component libraries\n\nNice to have:\n- Experience with WebAssembly or edge computing\n- Open source contributions\n- Experience with Figma-to-code workflows", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Full Stack Developer", "company": "Shopify", "location": "Toronto, Canada", "description": "Build commerce solutions that power millions of businesses worldwide. You'll work across our Ruby on Rails backend and React frontend.\n\nRequirements:\n- 3+ years full-stack development experience\n- Proficiency in Ruby on Rails or similar backend frameworks\n- Strong React/TypeScript skills\n- Experience with GraphQL APIs\n- Understanding of e-commerce domain\n- PostgreSQL or MySQL experience\n\nBenefits:\n- Competitive salary + equity\n- Health and dental coverage\n- $5,000 annual learning budget\n- Flexible work arrangements", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "DevOps Engineer", "company": "Datadog", "location": "New York, NY", "description": "Help us build and maintain the infrastructure that monitors the world's applications. You'll work on CI/CD pipelines, container orchestration, and cloud infrastructure.\n\nRequirements:\n- 4+ years of DevOps/SRE experience\n- Expert knowledge of AWS or GCP\n- Kubernetes and Docker expertise\n- Terraform or Pulumi for IaC\n- Strong scripting skills (Python, Bash)\n- Experience with monitoring and observability tools\n\nNice to have:\n- Experience with multi-region deployments\n- Knowledge of service mesh (Istio, Linkerd)\n- Go programming experience", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Machine Learning Engineer", "company": "OpenAI", "location": "San Francisco, CA", "description": "Work on cutting-edge AI systems that push the boundaries of what's possible. You'll develop and deploy ML models at scale.\n\nRequirements:\n- MS/PhD in Computer Science, ML, or related field\n- 3+ years of ML engineering experience\n- Strong Python skills with PyTorch or JAX\n- Experience training large-scale models\n- Understanding of transformer architectures\n- Experience with distributed training\n\nNice to have:\n- Published research in top conferences\n- Experience with RLHF or alignment\n- Contributions to ML open source projects", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "iOS Developer", "company": "Airbnb", "location": "San Francisco, CA", "description": "Build world-class mobile experiences for millions of travelers and hosts. You'll work on our iOS app using Swift and SwiftUI.\n\nRequirements:\n- 4+ years of iOS development\n- Expert in Swift and SwiftUI\n- Experience with UIKit and Combine\n- Understanding of MVVM architecture patterns\n- App Store publishing experience\n- Strong UI/UX sensibility\n\nNice to have:\n- Experience with GraphQL on mobile\n- AR/VR development experience\n- Experience with accessibility features", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Android Developer", "company": "Spotify", "location": "Stockholm, Sweden", "description": "Help us create the best music streaming experience on Android. You'll work with Kotlin, Jetpack Compose, and our custom media playback engine.\n\nRequirements:\n- 3+ years of Android development\n- Expert in Kotlin and Jetpack Compose\n- Experience with media playback on Android\n- Understanding of offline-first architecture\n- Experience with Gradle build system\n- Strong testing practices (JUnit, Espresso)\n\nBenefits:\n- Premium Spotify subscription\n- Relocation support\n- 6 months parental leave\n- Annual hack week", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Platform Engineer", "company": "Cloudflare", "location": "Austin, TX", "description": "Build the platform that powers a faster, more secure internet. You'll work on our edge computing infrastructure serving 20% of web traffic.\n\nRequirements:\n- 5+ years of systems programming experience\n- Proficiency in Rust, Go, or C++\n- Deep understanding of networking (TCP/IP, HTTP, DNS)\n- Experience with performance optimization\n- Linux systems expertise\n- Experience with distributed systems\n\nNice to have:\n- Experience with WebAssembly runtime\n- Knowledge of CDN architecture\n- Open source contributions", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Security Engineer", "company": "1Password", "location": "Remote", "description": "Protect millions of users' most sensitive data. You'll work on cryptographic implementations, security auditing, and threat modeling.\n\nRequirements:\n- 4+ years of security engineering experience\n- Strong understanding of cryptography\n- Experience with penetration testing\n- Knowledge of OWASP Top 10 and common vulnerabilities\n- Experience with secure SDLC practices\n- Python or Go programming skills\n\nNice to have:\n- Bug bounty experience\n- Security certifications (OSCP, CEH)\n- Experience with zero-trust architecture", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Data Engineer", "company": "Snowflake", "location": "San Mateo, CA", "description": "Build and optimize data pipelines that process petabytes of data daily. You'll work on our cloud data warehouse platform.\n\nRequirements:\n- 4+ years of data engineering experience\n- Expert SQL skills\n- Experience with Spark, Airflow, or dbt\n- Cloud platform experience (AWS, GCP, Azure)\n- Python programming proficiency\n- Understanding of data modeling and warehousing\n\nNice to have:\n- Experience with real-time streaming (Kafka, Flink)\n- Knowledge of data governance and quality\n- Experience with ML feature stores", "employmentType": "full_time", "remote": False, "status": "active"},

    # Product & Design
    {"title": "Senior Product Manager", "company": "Figma", "location": "San Francisco, CA", "description": "Lead product strategy for our collaboration features used by millions of designers and developers. You'll define the roadmap and drive execution.\n\nRequirements:\n- 5+ years of product management experience\n- Experience with developer tools or design tools\n- Strong analytical skills and data-driven mindset\n- Excellent communication and stakeholder management\n- Experience with agile methodologies\n- Technical background preferred\n\nNice to have:\n- Design background\n- Experience with real-time collaboration products\n- Previously founded or worked at a startup", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "UX Designer", "company": "Notion", "location": "New York, NY", "description": "Design intuitive experiences for the all-in-one workspace used by teams worldwide. You'll own end-to-end design for core product features.\n\nRequirements:\n- 3+ years of UX/product design experience\n- Strong portfolio demonstrating problem-solving\n- Proficiency in Figma\n- Experience with design systems\n- User research and usability testing experience\n- Strong information architecture skills\n\nNice to have:\n- Experience designing for productivity tools\n- Motion design skills\n- Front-end development knowledge", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Product Designer", "company": "Linear", "location": "Remote", "description": "Help us build the best project management tool for software teams. You'll work on everything from user research to pixel-perfect interfaces.\n\nRequirements:\n- 4+ years of product design experience\n- Portfolio showing B2B SaaS product work\n- Expert Figma skills\n- Strong understanding of design systems\n- Experience with user research methodologies\n- Excellent visual design skills\n\nWhat we offer:\n- Competitive salary + equity\n- Remote-first culture\n- Annual team retreats\n- Latest equipment of your choice", "employmentType": "full_time", "remote": True, "status": "active"},

    # Finance & Fintech
    {"title": "Quantitative Analyst", "company": "Citadel", "location": "Chicago, IL", "description": "Develop quantitative trading strategies and risk models for one of the world's leading hedge funds.\n\nRequirements:\n- MS/PhD in Mathematics, Physics, Statistics, or CS\n- Strong programming skills in Python and C++\n- Experience with statistical modeling and time series analysis\n- Knowledge of financial markets and derivatives\n- Excellent problem-solving skills\n- Experience with large datasets\n\nCompensation:\n- Base salary: $200K-$400K\n- Performance bonus\n- Comprehensive benefits", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Blockchain Developer", "company": "Coinbase", "location": "Remote", "description": "Build the infrastructure for the future of digital finance. You'll work on our core trading platform and blockchain integrations.\n\nRequirements:\n- 3+ years of software engineering experience\n- Experience with blockchain protocols (Ethereum, Bitcoin)\n- Proficiency in Go, Rust, or Solidity\n- Understanding of cryptographic primitives\n- Experience with high-availability systems\n- Strong security awareness\n\nNice to have:\n- DeFi protocol experience\n- Smart contract auditing experience\n- Contributions to blockchain open source", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Financial Analyst", "company": "Goldman Sachs", "location": "New York, NY", "description": "Join our Investment Banking Division to analyze market trends, build financial models, and support deal execution.\n\nRequirements:\n- Bachelor's in Finance, Economics, or related field\n- 2+ years of financial analysis experience\n- Advanced Excel and financial modeling skills\n- Experience with Bloomberg Terminal\n- Strong presentation and communication skills\n- CFA Level 1 or progress toward CFA\n\nNice to have:\n- MBA from top program\n- M&A or IPO experience\n- Python or R for data analysis", "employmentType": "full_time", "remote": False, "status": "active"},

    # Healthcare
    {"title": "Health Informatics Engineer", "company": "Epic Systems", "location": "Verona, WI", "description": "Build software that manages healthcare for 250+ million patients. You'll work on electronic health record systems used by top hospitals.\n\nRequirements:\n- BS in Computer Science or related field\n- Experience with healthcare data standards (HL7, FHIR)\n- Strong programming skills in C# or Java\n- Database design and SQL skills\n- Understanding of HIPAA compliance\n- Excellent communication skills\n\nBenefits:\n- Comprehensive health insurance\n- On-campus amenities\n- Sabbatical program after 5 years", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Clinical Data Scientist", "company": "Tempus", "location": "Chicago, IL", "description": "Apply AI and data science to precision medicine. You'll analyze genomic data and clinical records to improve cancer treatment.\n\nRequirements:\n- PhD in Biostatistics, Bioinformatics, or related field\n- Experience with clinical trial data analysis\n- Proficiency in R and Python\n- Knowledge of genomics and molecular biology\n- Experience with ML for healthcare\n- Understanding of FDA regulatory requirements\n\nNice to have:\n- Experience with NGS data analysis\n- Published research in oncology\n- Experience with real-world evidence studies", "employmentType": "full_time", "remote": False, "status": "active"},

    # Marketing & Growth
    {"title": "Growth Marketing Manager", "company": "HubSpot", "location": "Boston, MA", "description": "Drive user acquisition and activation for our CRM platform. You'll own the growth funnel from awareness to conversion.\n\nRequirements:\n- 4+ years of growth/performance marketing experience\n- Experience with paid acquisition (Google, Facebook, LinkedIn)\n- Strong analytical skills and A/B testing experience\n- Proficiency with marketing automation tools\n- Understanding of SaaS metrics (CAC, LTV, MRR)\n- Content marketing experience\n\nNice to have:\n- SEO expertise\n- Experience with product-led growth\n- SQL skills for data analysis", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Content Strategist", "company": "Atlassian", "location": "Remote", "description": "Shape the content strategy for products used by millions of teams. You'll create content that educates, engages, and drives adoption.\n\nRequirements:\n- 3+ years of content strategy experience\n- Strong writing and editing skills\n- Experience with B2B SaaS content\n- SEO knowledge and keyword research\n- Analytics skills (Google Analytics, Mixpanel)\n- Project management experience\n\nWhat we offer:\n- Team Anywhere policy\n- Annual learning budget\n- Volunteer days\n- Equity refreshers", "employmentType": "full_time", "remote": True, "status": "active"},

    # Operations & Management
    {"title": "Technical Program Manager", "company": "Google", "location": "Mountain View, CA", "description": "Drive complex technical programs across multiple engineering teams. You'll coordinate cross-functional initiatives for Google Cloud.\n\nRequirements:\n- 5+ years of technical program management\n- Strong technical background (CS degree or equivalent)\n- Experience managing large-scale software projects\n- Excellent stakeholder communication\n- PMP or Agile certifications preferred\n- Experience with cloud infrastructure\n\nCompensation:\n- Competitive base salary\n- RSUs with annual refreshers\n- 15% annual bonus target\n- Comprehensive benefits", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Engineering Manager", "company": "Meta", "location": "Menlo Park, CA", "description": "Lead a team of 8-12 engineers building next-generation social features. You'll drive technical strategy while developing your team's careers.\n\nRequirements:\n- 7+ years of software engineering experience\n- 2+ years of engineering management\n- Experience with large-scale distributed systems\n- Strong hiring and people development skills\n- Technical depth in mobile or web development\n- Experience with agile/scrum methodologies\n\nNice to have:\n- Experience with ML/AI products\n- Experience scaling teams from 5 to 15+\n- Background in social or messaging products", "employmentType": "full_time", "remote": False, "status": "active"},

    # Startup / Early Stage
    {"title": "Founding Engineer", "company": "Stealth AI Startup", "location": "San Francisco, CA", "description": "Join as the first engineering hire at a well-funded AI startup. You'll build the core product from scratch and shape the technical direction.\n\nRequirements:\n- 5+ years of software engineering experience\n- Full-stack development skills (Python + React/TypeScript)\n- Experience building products from 0 to 1\n- Comfort with ambiguity and fast iteration\n- Experience with LLMs and AI/ML tools\n- Strong system design skills\n\nWhat we offer:\n- Significant equity (1-3%)\n- Competitive base salary\n- Direct impact on product direction\n- Small, elite team", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Product Engineer", "company": "Resend", "location": "Remote", "description": "Build beautiful developer tools for email. You'll work on APIs, SDKs, and our dashboard used by thousands of developers.\n\nRequirements:\n- 3+ years of full-stack development\n- TypeScript and React expertise\n- Experience building APIs and SDKs\n- Eye for design and developer experience\n- Experience with email protocols (SMTP, DKIM) is a plus\n- Open source contribution is valued\n\nCulture:\n- Fully remote, async-first\n- Open source focused\n- Small team, big impact\n- Ship fast, iterate faster", "employmentType": "full_time", "remote": True, "status": "active"},

    # Contract / Part-time
    {"title": "Technical Writer (Contract)", "company": "Twilio", "location": "Remote", "description": "Create world-class API documentation and developer guides for Twilio's communication APIs.\n\nRequirements:\n- 3+ years of technical writing experience\n- Experience documenting REST APIs\n- Familiarity with developer tools and SDKs\n- Strong writing in clear, concise English\n- Experience with docs-as-code workflows (Markdown, Git)\n- Ability to read and understand code samples\n\nContract details:\n- 6-month contract, potential to extend\n- 30-40 hours per week\n- Competitive hourly rate", "employmentType": "contract", "remote": True, "status": "active"},

    {"title": "QA Engineer (Part-time)", "company": "Zapier", "location": "Remote", "description": "Help ensure quality for our automation platform. You'll create test plans, perform manual and automated testing.\n\nRequirements:\n- 2+ years of QA experience\n- Experience with test automation (Cypress, Playwright)\n- Understanding of CI/CD pipelines\n- API testing experience (Postman, REST)\n- Strong attention to detail\n- Excellent bug reporting skills\n\nSchedule:\n- 20 hours per week\n- Flexible hours\n- Fully remote", "employmentType": "part_time", "remote": True, "status": "active"},

    {"title": "Freelance UI Developer", "company": "Toptal", "location": "Remote", "description": "Work with top clients on exciting UI projects. Build responsive, accessible web interfaces for enterprise applications.\n\nRequirements:\n- 4+ years of frontend development\n- Expert in React, Vue, or Angular\n- Strong CSS/Tailwind skills\n- Accessibility (WCAG) knowledge\n- Responsive design expertise\n- Portfolio of production work\n\nContract:\n- Project-based or hourly\n- $80-$150/hour depending on experience\n- Choose your projects and schedule", "employmentType": "contract", "remote": True, "status": "active"},

    # More Software Engineering
    {"title": "Staff Software Engineer", "company": "Netflix", "location": "Los Gatos, CA", "description": "Architect and build systems that deliver entertainment to 250M+ subscribers worldwide. You'll work on our content delivery and recommendation systems.\n\nRequirements:\n- 8+ years of software engineering experience\n- Expert in Java, Python, or Go\n- Experience with microservices at massive scale\n- Strong system design and architecture skills\n- Experience with A/B testing frameworks\n- Deep understanding of distributed caching\n\nCompensation:\n- Top-of-market salary (no bonus, no equity — all cash)\n- Unlimited PTO\n- Premium health benefits", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Rust Systems Engineer", "company": "Discord", "location": "San Francisco, CA", "description": "Build high-performance real-time communication infrastructure in Rust. Our systems handle millions of concurrent voice and text connections.\n\nRequirements:\n- 3+ years of systems programming experience\n- Strong Rust proficiency\n- Experience with real-time systems\n- Understanding of WebSocket and WebRTC\n- Performance profiling and optimization experience\n- Linux systems knowledge\n\nNice to have:\n- Experience with audio/video processing\n- Knowledge of networking at scale\n- Gaming or social platform experience", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Site Reliability Engineer", "company": "PagerDuty", "location": "Atlanta, GA", "description": "Build and operate the infrastructure that keeps businesses running. You'll ensure 99.99% uptime for our incident management platform.\n\nRequirements:\n- 4+ years of SRE or DevOps experience\n- Expert in Kubernetes and cloud platforms\n- Strong programming skills (Python, Go)\n- Experience with observability tools\n- Incident management experience\n- On-call rotation participation\n\nBenefits:\n- Generous on-call compensation\n- Mental health days\n- Home office setup budget\n- Stock options", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "React Native Developer", "company": "Expo", "location": "Remote", "description": "Build tools that help developers create cross-platform mobile apps. You'll work on the Expo framework and its ecosystem.\n\nRequirements:\n- 3+ years of React Native experience\n- Strong JavaScript/TypeScript skills\n- Understanding of iOS and Android platforms\n- Experience with native modules\n- Open source contribution experience\n- Strong debugging skills\n\nWhat we offer:\n- Remote-first company\n- Open source impact\n- Conference sponsorship\n- Equipment budget", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Backend Engineer (Python)", "company": "Notion", "location": "San Francisco, CA", "description": "Scale our backend to support the world's connected workspace. You'll work on data storage, sync engine, and API performance.\n\nRequirements:\n- 4+ years of backend engineering\n- Strong Python experience\n- PostgreSQL expertise\n- Experience with distributed systems\n- API design experience\n- Performance optimization skills\n\nNice to have:\n- Experience with real-time sync (CRDTs, OT)\n- Rust or C++ experience\n- Experience with document databases", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Embedded Software Engineer", "company": "Tesla", "location": "Palo Alto, CA", "description": "Develop firmware for Tesla's next-generation vehicles. You'll work on embedded systems controlling vehicle dynamics and energy management.\n\nRequirements:\n- 3+ years of embedded systems experience\n- Expert in C and C++\n- Experience with RTOS (FreeRTOS, QNX)\n- Hardware-software integration experience\n- Experience with CAN bus and automotive protocols\n- Strong debugging with oscilloscopes and logic analyzers\n\nNice to have:\n- Automotive industry experience\n- Experience with functional safety (ISO 26262)\n- Python for test automation", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "AI/ML Research Engineer", "company": "Anthropic", "location": "San Francisco, CA", "description": "Research and develop safe, beneficial AI systems. You'll work on alignment research and build training infrastructure.\n\nRequirements:\n- PhD or equivalent experience in ML/AI\n- Published research at top venues (NeurIPS, ICML, ICLR)\n- Strong PyTorch experience\n- Experience with large language models\n- Excellent mathematical foundations\n- Strong Python programming skills\n\nMission:\n- Work on AI safety research\n- Publish and share findings\n- Shape the future of AI development", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Database Engineer", "company": "CockroachDB", "location": "New York, NY", "description": "Build the distributed SQL database that survives anything. You'll work on query optimization, storage engine, and replication.\n\nRequirements:\n- 5+ years of database or distributed systems experience\n- Expert in Go, C++, or Rust\n- Deep knowledge of database internals\n- Experience with consensus algorithms (Raft, Paxos)\n- Strong understanding of SQL and query planning\n- Experience with performance benchmarking\n\nNice to have:\n- Contributions to database open source projects\n- Experience with PostgreSQL internals\n- Published papers on database systems", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Infrastructure Engineer", "company": "Terraform (HashiCorp)", "location": "Remote", "description": "Build the tools that define modern cloud infrastructure. You'll work on Terraform's core engine and provider ecosystem.\n\nRequirements:\n- 4+ years of infrastructure or platform engineering\n- Strong Go programming skills\n- Deep understanding of cloud providers (AWS, GCP, Azure)\n- Experience with infrastructure as code\n- Open source collaboration experience\n- Strong testing and CI/CD practices\n\nPerks:\n- Fully remote\n- Home office stipend\n- Flexible PTO\n- Learning and development budget", "employmentType": "full_time", "remote": True, "status": "active"},

    # Data & Analytics
    {"title": "Senior Data Analyst", "company": "Uber", "location": "Chicago, IL", "description": "Drive data-informed decisions for Uber's marketplace. You'll analyze rider and driver behavior to optimize pricing and matching.\n\nRequirements:\n- 4+ years of data analysis experience\n- Expert SQL skills\n- Proficiency in Python (pandas, numpy)\n- Experience with data visualization (Tableau, Looker)\n- Strong statistical analysis skills\n- Experience with A/B testing\n\nNice to have:\n- Experience with marketplace economics\n- Knowledge of geospatial analysis\n- Machine learning fundamentals", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Analytics Engineer", "company": "dbt Labs", "location": "Remote", "description": "Help define the analytics engineering discipline. You'll build data models, develop best practices, and shape our product.\n\nRequirements:\n- 3+ years of analytics or data engineering\n- Expert SQL and dbt skills\n- Experience with modern data stack (Snowflake, BigQuery)\n- Understanding of data modeling techniques\n- Version control with Git\n- Strong documentation skills\n\nWhat we offer:\n- Remote-first culture\n- Conference speaking opportunities\n- Impact on the data community\n- Stock options", "employmentType": "full_time", "remote": True, "status": "active"},

    # Design
    {"title": "Design Systems Engineer", "company": "GitHub", "location": "Remote", "description": "Build and maintain Primer — GitHub's design system used by millions of developers. You'll bridge design and engineering.\n\nRequirements:\n- 3+ years of frontend development\n- Experience building design systems or component libraries\n- React and TypeScript expertise\n- Strong CSS knowledge\n- Accessibility (a11y) expertise\n- Experience with Storybook or similar tools\n\nNice to have:\n- Experience with Figma plugins\n- Published design system work\n- Experience with web components", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Brand Designer", "company": "Canva", "location": "Sydney, Australia", "description": "Shape the visual identity of the world's most popular design platform. You'll create brand assets, campaigns, and design guidelines.\n\nRequirements:\n- 4+ years of brand/graphic design experience\n- Strong portfolio showing brand work\n- Expert in Adobe Creative Suite and Figma\n- Typography and color theory expertise\n- Motion graphics skills\n- Experience with brand guidelines\n\nPerks:\n- Relocation support to Sydney\n- Equity in a growing company\n- Creative culture\n- Vibe & Thrive allowance", "employmentType": "full_time", "remote": False, "status": "active"},

    # Sales & Business
    {"title": "Solutions Architect", "company": "AWS", "location": "Seattle, WA", "description": "Help enterprise customers design and build cloud architectures. You'll be the technical bridge between AWS and our largest clients.\n\nRequirements:\n- 5+ years of technical pre-sales or architecture experience\n- AWS certifications (Solutions Architect Professional)\n- Experience with enterprise infrastructure\n- Strong presentation and communication skills\n- Hands-on coding ability\n- Experience with migration planning\n\nTravel:\n- 25-40% travel expected\n- Work with Fortune 500 companies", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Developer Advocate", "company": "Supabase", "location": "Remote", "description": "Champion the open source Firebase alternative. You'll create content, speak at conferences, and build community.\n\nRequirements:\n- 3+ years of software development experience\n- Experience creating technical content (blogs, videos, tutorials)\n- Public speaking experience\n- Strong social media presence in tech\n- Experience with databases and backend development\n- Open source community involvement\n\nWhat we offer:\n- Fully remote\n- Conference budget\n- Content creation tools\n- Community impact", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Sales Engineer", "company": "Palantir", "location": "Washington, DC", "description": "Demonstrate how data platforms solve critical problems for government and enterprise clients. You'll build custom demos and proof-of-concepts.\n\nRequirements:\n- 3+ years of software engineering or sales engineering\n- Strong Python and SQL skills\n- Experience with data analysis and visualization\n- Excellent presentation skills\n- Security clearance eligibility\n- Client-facing experience\n\nCompensation:\n- Competitive base + commission\n- Equity grants\n- Comprehensive benefits", "employmentType": "full_time", "remote": False, "status": "active"},

    # More diverse roles
    {"title": "Accessibility Engineer", "company": "Apple", "location": "Cupertino, CA", "description": "Make technology accessible to everyone. You'll work on VoiceOver, Switch Control, and other assistive technologies across Apple platforms.\n\nRequirements:\n- 3+ years of software engineering experience\n- Deep knowledge of WCAG and ARIA standards\n- Experience with screen readers and assistive technology\n- Swift or Objective-C proficiency\n- Understanding of accessibility testing methodologies\n- Passion for inclusive design\n\nImpact:\n- Your work touches billions of users\n- Direct impact on people's lives\n- Work with the best accessibility team in tech", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Compiler Engineer", "company": "Modular (Mojo)", "location": "Remote", "description": "Build the next-generation programming language for AI. You'll work on Mojo's compiler, type system, and MLIR integration.\n\nRequirements:\n- 5+ years of compiler or language implementation experience\n- Expert in C++ or Rust\n- Experience with LLVM or MLIR\n- Strong understanding of type theory\n- Performance optimization expertise\n- Systems programming skills\n\nNice to have:\n- Experience with ML frameworks\n- Published work on language design\n- Experience with GPU programming", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Game Engine Developer", "company": "Unity", "location": "Copenhagen, Denmark", "description": "Build the rendering and physics systems that power millions of games. You'll optimize performance across PC, mobile, and console.\n\nRequirements:\n- 5+ years of game engine or graphics programming\n- Expert in C++ and C#\n- Deep knowledge of rendering pipelines (Vulkan, DirectX, Metal)\n- Physics engine experience\n- Performance profiling and optimization\n- Math skills (linear algebra, calculus)\n\nBenefits:\n- Work on technology used by 2M+ developers\n- Relocation support\n- Game industry events\n- Creative sabbaticals", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "Technical Support Engineer", "company": "Zendesk", "location": "Remote", "description": "Help enterprise customers resolve complex technical issues with our customer service platform. You'll debug integrations and optimize workflows.\n\nRequirements:\n- 2+ years of technical support experience\n- Understanding of REST APIs and webhooks\n- Basic scripting skills (JavaScript, Python)\n- SQL query knowledge\n- Excellent written communication\n- Experience with ticketing systems\n\nSchedule:\n- Flexible shifts available\n- Remote work from anywhere\n- Training and certification provided", "employmentType": "full_time", "remote": True, "status": "active"},

    {"title": "Cloud Solutions Engineer (Contract)", "company": "Accenture", "location": "New York, NY", "description": "Design and implement cloud migration strategies for Fortune 500 clients. You'll work on hybrid cloud architectures.\n\nRequirements:\n- 4+ years of cloud architecture experience\n- Multi-cloud experience (AWS + Azure or GCP)\n- Terraform and Ansible proficiency\n- Containerization expertise (Docker, Kubernetes)\n- Strong documentation skills\n- Client communication experience\n\nContract:\n- 12-month engagement\n- Competitive daily rate\n- Potential for extension", "employmentType": "contract", "remote": False, "status": "active"},

    {"title": "Junior Full Stack Developer", "company": "Codecademy", "location": "New York, NY", "description": "Help build the platform that teaches millions to code. Great opportunity for early-career developers who are passionate about education.\n\nRequirements:\n- 1+ years of web development experience\n- Proficiency in JavaScript/TypeScript\n- Experience with React\n- Basic backend knowledge (Node.js or Python)\n- Understanding of Git workflows\n- Passion for education technology\n\nGrowth:\n- Mentorship from senior engineers\n- Learning time built into schedule\n- Conference attendance support\n- Clear career progression", "employmentType": "full_time", "remote": False, "status": "active"},

    {"title": "VP of Engineering", "company": "Scale AI", "location": "San Francisco, CA", "description": "Lead engineering for the data infrastructure powering the AI revolution. You'll manage 50+ engineers across multiple teams.\n\nRequirements:\n- 10+ years of software engineering experience\n- 5+ years of engineering leadership\n- Experience scaling engineering orgs (20 to 100+)\n- Track record of delivering complex technical products\n- Experience with AI/ML infrastructure\n- Strong hiring and culture-building skills\n\nCompensation:\n- $300K-$500K base\n- Significant equity package\n- Executive benefits", "employmentType": "full_time", "remote": False, "status": "active"},
]

# --- Resumes for applicants ---
RESUMES = [
    """Alice Chen — Software Engineer
San Francisco, CA | alice.chen@email.com

EXPERIENCE
Senior Software Engineer, Acme Corp (2021-Present)
- Built microservices handling 50K requests/second using Python and FastAPI
- Designed and implemented PostgreSQL schema serving 2M+ users
- Led migration from monolith to microservices, reducing deploy time by 80%
- Mentored 3 junior engineers

Software Engineer, TechStart Inc (2019-2021)
- Developed RESTful APIs using Django and Flask
- Built React dashboards for internal analytics tools
- Implemented CI/CD pipelines with GitHub Actions
- Reduced API response time by 40% through Redis caching

EDUCATION
BS Computer Science, UC Berkeley (2019)

SKILLS
Python, TypeScript, React, FastAPI, Django, PostgreSQL, Redis, Docker, Kubernetes, AWS, Git
""",
    """Bob Martinez — Full Stack Developer
Austin, TX | bob.martinez@email.com

EXPERIENCE
Full Stack Developer, DataViz Inc (2022-Present)
- Built interactive data visualization platform using React and D3.js
- Developed GraphQL APIs with Node.js and TypeScript
- Implemented real-time collaboration features using WebSockets
- Managed AWS infrastructure (ECS, RDS, ElastiCache)

Frontend Developer, WebAgency (2020-2022)
- Created responsive web applications for 15+ clients
- Built component libraries using React and Tailwind CSS
- Implemented accessibility features (WCAG 2.1 AA compliance)
- Led frontend code reviews and established coding standards

Intern, Google (Summer 2019)
- Contributed to internal developer tools team
- Built Chrome extension for code review workflow

EDUCATION
MS Computer Science, UT Austin (2020)
BS Computer Science, Texas A&M (2018)

SKILLS
JavaScript, TypeScript, React, Node.js, GraphQL, Python, AWS, Docker, Tailwind CSS, PostgreSQL
""",
    """Carol Johnson — Data Analyst & Junior Developer
Chicago, IL | carol.johnson@email.com

EXPERIENCE
Data Analyst, HealthMetrics (2023-Present)
- Analyzed patient outcome data using Python and SQL
- Built Tableau dashboards for hospital administrators
- Wrote Python scripts to automate ETL pipelines

Marketing Coordinator, RetailCo (2021-2023)
- Managed email campaigns and tracked conversion metrics
- Created reports using Excel and basic SQL queries
- Assisted with website updates using WordPress

EDUCATION
BS Business Administration, University of Illinois (2021)
Data Science Bootcamp, General Assembly (2023)

SKILLS
Python (pandas, numpy), SQL, Tableau, Excel, basic HTML/CSS, Git
""",
]


def register(client: httpx.Client, user: dict) -> str | None:
    """Register a user (if needed) and login, return access token."""
    # Try to register first
    r = client.post(f'{API_BASE}/auth/register', json=user)
    if r.status_code not in (201, 409):
        print(f"  Register failed for {user['email']}: {r.status_code} {r.text[:100]}")
        return None

    # Now login to get the token
    r = client.post(f'{API_BASE}/auth/login', json={'email': user['email'], 'password': user['password']})
    if r.status_code == 200:
        return r.json()['accessToken']
    print(f"  Login failed for {user['email']}: {r.status_code} {r.text[:100]}")
    return None


def create_job(client: httpx.Client, token: str, job: dict) -> str | None:
    """Create a job, return job ID."""
    r = client.post(
        f'{API_BASE}/jobs',
        json=job,
        headers={'Authorization': f'Bearer {token}'},
    )
    if r.status_code == 201:
        return r.json()['id']
    print(f"  Job creation failed: {r.status_code} {r.text[:100]}")
    return None


def apply_to_job(client: httpx.Client, token: str, job_id: str, resume: str) -> str | None:
    """Apply to a job, return application ID."""
    r = client.post(
        f'{API_BASE}/applications',
        json={
            'jobId': job_id,
            'resumeText': resume,
            'coverLetter': f'I am very interested in this position and believe my skills are a great fit. I have relevant experience and am excited about the opportunity to contribute to the team.',
        },
        headers={
            'Authorization': f'Bearer {token}',
            'Idempotency-Key': str(uuid.uuid4()),
        },
    )
    if r.status_code == 201:
        return r.json()['id']
    elif r.status_code == 409:
        print(f"  Already applied to job {job_id}")
        return None
    print(f"  Application failed: {r.status_code} {r.text[:100]}")
    return None


def main():
    print(f"Seeding HireTrack at {API_BASE}\n")
    client = httpx.Client(timeout=30.0)

    # 1. Register employer
    print("1. Setting up employer account...")
    employer_token = register(client, EMPLOYER)
    if not employer_token:
        print("FATAL: Could not create employer account")
        return
    print(f"   Employer ready: {EMPLOYER['email']}\n")

    # 2. Create 50 jobs
    print(f"2. Creating {len(JOBS)} jobs...")
    job_ids = []
    for i, job in enumerate(JOBS):
        job_id = create_job(client, employer_token, job)
        if job_id:
            job_ids.append(job_id)
            print(f"   [{i+1}/{len(JOBS)}] {job['title']} at {job['company']}")
        time.sleep(0.3)  # Rate limiting
    print(f"   Created {len(job_ids)} jobs\n")

    # 3. Register applicants and apply to some jobs
    print("3. Setting up applicant accounts and submitting applications...")
    # Each applicant applies to a different set of jobs
    apply_plan = [
        (0, list(range(0, 8))),    # Alice applies to 8 engineering jobs
        (1, list(range(1, 6))),    # Bob applies to 5 jobs
        (2, [17, 18, 35, 36, 47]), # Carol applies to analyst/junior roles
    ]

    for applicant_idx, job_indices in apply_plan:
        applicant = APPLICANTS[applicant_idx]
        token = register(client, applicant)
        if not token:
            print(f"   Failed to set up {applicant['email']}")
            continue

        print(f"   {applicant['email']}:")
        for ji in job_indices:
            if ji < len(job_ids):
                app_id = apply_to_job(client, token, job_ids[ji], RESUMES[applicant_idx])
                if app_id:
                    print(f"     Applied to: {JOBS[ji]['title']} at {JOBS[ji]['company']}")
                time.sleep(0.5)  # Give time for AI screening to be enqueued

    print(f"\n--- Seeding complete! ---")
    print(f"Employer login: {EMPLOYER['email']} / {EMPLOYER['password']}")
    print(f"Applicant logins:")
    for a in APPLICANTS:
        print(f"  {a['email']} / {a['password']}")
    print(f"\nTotal jobs: {len(job_ids)}")
    print(f"AI screening will process in the background via the worker queue.")


if __name__ == '__main__':
    main()
