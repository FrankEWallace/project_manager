import Image from "next/image";
import Link from "next/link";
import {
  FolderKanban,
  TrendingUp,
  BarChart3,
  Users,
  CalendarDays,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Projects",
    desc: "Full lifecycle with phases, milestones, and automatic progress rollup.",
  },
  {
    icon: TrendingUp,
    title: "Finances",
    desc: "Income and expense tracking per project — budget vs. actuals at a glance.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Portfolio KPIs and per-project dashboards with month-over-month trends.",
  },
  {
    icon: Users,
    title: "Actors",
    desc: "A unified directory for clients, collaborators, and vendors.",
  },
  {
    icon: CalendarDays,
    title: "Timeline",
    desc: "Roadmap and calendar views across every active project.",
  },
  {
    icon: FileText,
    title: "Invoices",
    desc: "Generate invoices directly from project transactions with custom settings.",
  },
  {
    icon: ShieldCheck,
    title: "Teams",
    desc: "Invite members with role-based access — owner, admin, or member.",
  },
];

const hierarchy = ["Project", "Phase", "Milestone", "Task"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* subtle grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-sm tracking-tight">Project Manager</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="https://github.com/FrankEWallace/project_manager"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-xs text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            GitHub
          </Link>
          <Link
            href="/sign-in"
            className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-xs font-medium bg-white text-black px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-6 pt-20 pb-24 max-w-3xl mx-auto">
        <span className="inline-block text-xs font-medium uppercase tracking-widest text-zinc-500 mb-6">
          Operational platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
          Run your projects.<br />Know your numbers.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          A personal operating system for solo developers and growing teams —
          project lifecycle, financial tracking, and analytics in one workspace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-black font-medium text-sm px-5 py-3 rounded-xl hover:bg-zinc-100 transition-colors w-full sm:w-auto justify-center"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-medium text-sm px-5 py-3 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto justify-center"
          >
            Sign in to your workspace
          </Link>
        </div>
      </section>

      {/* ── Project hierarchy pill row ── */}
      <section className="relative z-10 px-6 pb-20 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {hierarchy.map((item, i) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 px-3 py-1.5 rounded-full">
                {item}
              </span>
              {i < hierarchy.length - 1 && (
                <span className="text-zinc-600 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-600 mt-3">
          Progress rolls up automatically — no manual input
        </p>
      </section>

      {/* ── Feature grid ── */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Everything in one workspace</h2>
          <p className="text-zinc-400 text-sm">No more switching between tools.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 pb-24 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Get up and running in minutes</h2>
          <p className="text-zinc-400 text-sm">No configuration required.</p>
        </div>
        <ol className="space-y-4">
          {[
            { step: "1", title: "Create an account", desc: "Sign up with your email — no credit card needed." },
            { step: "2", title: "Create your first project", desc: "Add a name, set a status and due date, and you're live." },
            { step: "3", title: "Add phases & milestones", desc: "Break your project into stages. Progress computes itself." },
            { step: "4", title: "Log income & expenses", desc: "Track every transaction against a project for instant P&L." },
            { step: "5", title: "Invite your team", desc: "Send workspace invitations and assign owner, admin, or member roles." },
          ].map(({ step, title, desc }) => (
            <li key={step} className="flex items-start gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 flex items-center justify-center mt-0.5">
                {step}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Checklist / why section ── */}
      <section className="relative z-10 px-6 pb-24 max-w-3xl mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center">Why Project Manager?</h2>
          <ul className="space-y-3">
            {[
              "Single source of truth — projects, finances, and people in one place",
              "Solo-first design that grows with your team",
              "Workspace isolation — your data is never shared",
              "Audit log on every mutation, no data loss",
              "Open source — fork it, self-host it, own it",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="relative z-10 px-6 pb-28 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Create your workspace in seconds — free, no card required.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-white text-black font-medium text-sm px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          Create free account <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Logo" width={20} height={20} className="rounded-md opacity-60" />
          <span>Project Manager — built for operators</span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="https://github.com/FrankEWallace/project_manager"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors"
          >
            GitHub
          </Link>
          <Link href="/sign-in" className="hover:text-zinc-400 transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-zinc-400 transition-colors">
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
