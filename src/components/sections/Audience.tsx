import { Users, Rocket, User } from "lucide-react";
import { Container } from "@/components/ui/container";

const CARDS = [
  {
    icon: Users,
    title: "Managing multiple client accounts",
    description:
      "Keep every client organized in their own workspace. Manage content, analytics, and approvals — then export white-label PDF reports to share with them.",
    bg: "bg-emerald-50/50",
    iconBg: "bg-emerald-100/60",
    border: "border-emerald-200/60",
  },
  {
    icon: Rocket,
    title: "Working with a team",
    description:
      "Shared calendars, approval workflows, and role-based access. Add your whole team — no per-seat fees.",
    bg: "bg-blue-50/50",
    iconBg: "bg-blue-100/60",
    border: "border-blue-200/60",
  },
  {
    icon: User,
    title: "Running it solo",
    description:
      "Schedule across 10 platforms, track analytics, and manage comments. One inbox, one calendar, no complexity.",
    bg: "bg-violet-50/50",
    iconBg: "bg-violet-100/60",
    border: "border-violet-200/60",
  },
];

export function Audience() {
  return (
    <section className="py-14">
      <Container>
        <div className="text-center mb-10">
          <h2 className="text-[36px] font-bold leading-[40px] tracking-normal">
            Who is PostPlanify for?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border ${card.border} ${card.bg} p-6 flex flex-col items-start gap-3`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className="size-5 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{card.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}