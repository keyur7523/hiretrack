import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  Zap,
  BarChart3,
  Users,
  FileSearch,
  ArrowRight,
  CheckCircle,
  Sparkles,
  GitBranch,
  Database,
  Lock,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Resume Screening',
    description: 'Every application is analyzed by AI against the job description. Get fit scores, skills breakdowns, and recommendations instantly.',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Three distinct roles with enforced permissions. Applicants, employers, and admins each see exactly what they need.',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Real-Time Pipeline',
    description: 'Applications flow through defined status transitions. Every change is tracked, audited, and logged automatically.',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Admin Dashboard',
    description: 'System health monitoring, request metrics, audit logs with filtering. Full operational visibility.',
    iconBg: 'bg-blue-100 text-blue-600',
  },
];

const TECH_STACK = [
  { icon: Zap, label: 'React 18', sublabel: 'TypeScript' },
  { icon: Database, label: 'FastAPI', sublabel: 'Async Python' },
  { icon: GitBranch, label: 'PostgreSQL', sublabel: 'Neon Serverless' },
  { icon: Lock, label: 'JWT Auth', sublabel: 'RBAC' },
  { icon: Brain, label: 'OpenAI', sublabel: 'GPT-4o-mini' },
  { icon: Sparkles, label: 'Tailwind', sublabel: 'shadcn/ui' },
];

const AI_SCORES = [
  { role: 'Sr. Backend Engineer', company: 'Stripe', score: 85, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { role: 'DevOps Engineer', company: 'Datadog', score: 75, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { role: 'Full Stack Dev', company: 'Shopify', score: 70, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { role: 'ML Engineer', company: 'OpenAI', score: 30, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { role: 'iOS Developer', company: 'Airbnb', score: 20, color: 'text-red-600 bg-red-50 border-red-200' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground landing-page">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="HireTrack" className="w-7 h-7" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">HireTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-[13px] font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6">
        {/* Subtle background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] text-muted-foreground tracking-wide">AI-Powered Hiring Platform</span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.1] tracking-[-0.035em] text-foreground mb-5"
          >
            Hire smarter.{' '}
            <span className="text-primary">Not harder.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-[16px] text-muted-foreground leading-relaxed max-w-xl mx-auto mb-9"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            A full-stack hiring platform with AI resume screening that scores every applicant
            against your job description. Three roles, real-time pipelines, complete audit trails.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 bg-primary text-primary-foreground font-medium text-[14px] px-6 py-2.5 rounded-md hover:bg-primary-hover transition-all"
            >
              Try the Live Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="https://github.com/keyur7523/hiretrack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-[14px] px-6 py-2.5 rounded-md border border-border hover:border-border-strong transition-all"
            >
              <GitBranch className="w-4 h-4" />
              View Source
            </a>
          </motion.div>
        </div>
      </section>

      {/* AI Screening Showcase */}
      <section className="relative px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="rounded-xl border border-border shadow-lg bg-background overflow-hidden"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-[11px] text-muted-foreground bg-surface-2 rounded px-3 py-0.5">
                  hiretrack-puce.vercel.app
                </div>
              </div>
            </div>

            {/* AI Screening preview */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">AI Resume Screening</h3>
                  <p className="text-[12px] text-muted-foreground">Applicant: Alice Chen &middot; Senior Software Engineer</p>
                </div>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {AI_SCORES.map((item) => (
                  <div
                    key={item.role}
                    className={`rounded-lg border p-3 ${item.color}`}
                  >
                    <div className="text-2xl font-bold tracking-tight">
                      {item.score}
                    </div>
                    <div className="text-[11px] mt-1 leading-tight opacity-80">{item.role}</div>
                    <div className="text-[10px] opacity-60">{item.company}</div>
                  </div>
                ))}
              </div>

              {/* Skills breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mb-2">
                    <CheckCircle className="w-3 h-3" /> Matched Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'].map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="text-[11px] font-medium text-red-700 flex items-center gap-1 mb-2">
                    <span className="w-3 h-3 flex items-center justify-center text-[10px] font-bold">&times;</span> Missing Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Go', 'Kafka'].map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <div className="text-[11px] font-medium text-blue-700 flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3" /> Bonus Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['TypeScript', 'React', 'CI/CD'].map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20 bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground mb-3">
              Built for the full hiring lifecycle
            </h2>
            <p className="text-muted-foreground text-[15px] max-w-lg mx-auto" style={{ textWrap: 'balance' } as React.CSSProperties}>
              From job posting to AI-powered screening to offer — every step is tracked,
              secured, and auditable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-border bg-background p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground mb-2">
              Modern stack, production-grade
            </h2>
            <p className="text-muted-foreground text-[14px]">
              Not a tutorial project. Real architecture decisions, real trade-offs.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TECH_STACK.map((tech, i) => (
              <motion.div
                key={tech.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-lg border border-border bg-background p-4 flex items-center gap-3 hover:border-border-strong transition-colors"
              >
                <tech.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-[13px] font-medium text-foreground">{tech.label}</div>
                  <div className="text-[11px] text-muted-foreground">{tech.sublabel}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Roles */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground mb-2">
              Three roles, one platform
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                role: 'Applicant',
                badge: 'bg-blue-100 text-blue-700',
                items: ['Browse & search 50+ jobs', 'Apply with resume text', 'Track application status', 'View AI screening score'],
              },
              {
                role: 'Employer',
                badge: 'bg-violet-100 text-violet-700',
                items: ['Post & manage job listings', 'Review applications', 'AI screening with skills breakdown', 'Sort & filter by AI score'],
              },
              {
                role: 'Admin',
                badge: 'bg-amber-100 text-amber-700',
                items: ['System health monitoring', 'Request & error metrics', 'Full audit log trail', 'Database & queue status'],
              },
            ].map((card, i) => (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-border bg-background p-6"
              >
                <span className={`inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${card.badge} mb-4`}>
                  {card.role}
                </span>
                <ul className="space-y-2.5">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary/40 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Credentials CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border bg-surface p-8 sm:p-10 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground mb-2">
              Try it now
            </h2>
            <p className="text-muted-foreground text-[14px] mb-8 max-w-md mx-auto">
              The demo is live with 50 seeded jobs and AI-screened applications.
              Use these credentials to explore each role.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
              {[
                { role: 'Employer', email: 'employer@hiretrack.demo', bg: 'bg-violet-50 border-violet-200' },
                { role: 'Applicant', email: 'alice.chen@hiretrack.demo', bg: 'bg-blue-50 border-blue-200' },
                { role: 'Applicant', email: 'bob.martinez@hiretrack.demo', bg: 'bg-cyan-50 border-cyan-200' },
              ].map((cred) => (
                <div key={cred.email} className={`rounded-lg border ${cred.bg} p-3`}>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{cred.role}</div>
                  <div className="text-[12px] text-foreground font-mono break-all">{cred.email}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mb-6">
              Password for all: <code className="text-foreground bg-surface-2 px-1.5 py-0.5 rounded text-[11px] font-mono">DemoPass123!</code>
            </p>

            <Link
              to="/login"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium text-[14px] px-7 py-2.5 rounded-md hover:bg-primary-hover transition-all"
            >
              Open Live Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="HireTrack" className="w-5 h-5 opacity-50" />
            <span className="text-[13px] text-muted-foreground">
              Built by{' '}
              <a
                href="https://x.com/AnotherPers0n7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                Keyur
              </a>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/keyur7523/hiretrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://x.com/AnotherPers0n7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
