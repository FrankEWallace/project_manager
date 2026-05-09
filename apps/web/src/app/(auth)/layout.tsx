import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const features = [
  "Full project lifecycle — phases, milestones, tasks",
  "Financial tracking per project and portfolio",
  "Team invites with role-based access",
  "Analytics dashboard with real-time KPIs",
  "Timeline roadmap and calendar view",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0a0a0a] p-12 relative overflow-hidden">
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image src="/logo.jpg" alt="Logo" width={36} height={36} className="rounded-lg" />
          <span className="text-white font-semibold text-sm tracking-tight">Project Manager</span>
        </div>

        {/* Centre copy */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Operational platform</p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Run your projects.<br />Know your numbers.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              A personal operating system for solo developers and growing teams — from first commit to final invoice.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <div className="relative">
          <p className="text-zinc-600 text-xs italic">
            "The best project manager is the one you actually use."
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.jpg" alt="Logo" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-sm">Project Manager</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
