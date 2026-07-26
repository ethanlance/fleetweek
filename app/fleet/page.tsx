import type { Metadata } from "next";
import { getFleet, getTelemetry } from "@/lib/content";
import { StatusDot } from "@/components/status";

export const metadata: Metadata = {
  title: "Fleet — Powarz",
  description:
    "The agents that maintain powarz.com: charters, cadences, run history, and cost.",
};

export default function FleetPage() {
  const fleet = getFleet();
  const telemetry = getTelemetry();

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">The fleet</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Four agents run this site as scheduled Goose jobs. Content changes
          arrive as pull requests — drafted by one agent, reviewed by another —
          so every word here has an inspectable git trail. Nothing on this page
          is hand-updated.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        {fleet.map((agent) => (
          <div
            key={agent.id}
            className="rounded-lg border border-border-subtle bg-surface p-6"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">{agent.name}</h2>
              <StatusDot status={agent.status} />
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-faint">
              {agent.role} · {agent.cadence} · {agent.runtime}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {agent.charter}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Recent runs
          </h2>
          <span className="font-mono text-[11px] text-faint">
            monthly cost:{" "}
            {telemetry.monthlyCostUsd === null
              ? "measuring…"
              : `$${telemetry.monthlyCostUsd.toFixed(2)}`}
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full bg-surface font-mono text-[12px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-faint">
                <th className="px-4 py-2 font-normal">job</th>
                <th className="px-4 py-2 font-normal">started</th>
                <th className="px-4 py-2 font-normal">status</th>
                <th className="px-4 py-2 font-normal">note</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.runs.map((run, i) => (
                <tr key={i} className="border-b border-border-subtle/50">
                  <td className="px-4 py-2 text-foreground">{run.job}</td>
                  <td className="px-4 py-2 text-muted">{run.startedAt}</td>
                  <td className="px-4 py-2">
                    <StatusDot status={run.status} />
                  </td>
                  <td className="px-4 py-2 text-faint">{run.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
