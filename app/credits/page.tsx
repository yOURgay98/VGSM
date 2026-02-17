import { MarketingShell } from "@/components/marketing/marketing-shell";

const PEOPLE = [
  { name: "Vice", role: "Lead Developer" },
  { name: "Jack", role: "Co-Founder" },
] as const;

const OSS = [
  { name: "Next.js", desc: "App framework" },
  { name: "Prisma", desc: "Database ORM" },
  { name: "PostgreSQL", desc: "Primary database" },
  { name: "Auth.js / NextAuth", desc: "Authentication" },
  { name: "Tailwind CSS", desc: "Styling system" },
  { name: "Radix UI + shadcn/ui", desc: "Accessible UI primitives" },
  { name: "Framer Motion", desc: "Motion system (used sparingly)" },
  { name: "Lucide", desc: "Icon set" },
] as const;

export default function CreditsPage() {
  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Credits
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Built with care, powered by open tooling.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Vanguard Security &amp; Management is designed to be a calm, security-first operations
            console. We credit the open-source projects that make the developer experience possible.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Team
            </p>
            <div className="mt-4 grid gap-2">
              {PEOPLE.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/20 px-4 py-3"
                >
                  <p className="text-[13px] font-semibold text-white">{p.name}</p>
                  <p className="text-[13px] text-white/65">{p.role}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Open source
            </p>
            <div className="mt-4 grid gap-2">
              {OSS.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3"
                >
                  <p className="text-[13px] font-semibold text-white">{item.name}</p>
                  <p className="text-[13px] text-white/65">{item.desc}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

      </section>
    </MarketingShell>
  );
}
