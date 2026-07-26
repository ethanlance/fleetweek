import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDigests,
  getFleet,
  getJournalPosts,
  getProject,
  getProjects,
  getTelemetry,
} from "@/lib/content";
import { StatusDot } from "@/components/status";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.name} — Powarz`,
    description: project.tagline,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const digests = getDigests(slug);
  const posts = getJournalPosts(slug);
  const fleet = getFleet(slug);
  const telemetry = getTelemetry(slug);
  const latest = digests[0];

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <StatusDot status={project.status} />
        </div>
        <div className="mt-1 font-mono text-[11px] text-faint">
          {project.builder} · since {project.started}
          {Object.entries(project.links).map(([label, href]) => (
            <span key={label}>
              {" · "}
              <a href={href} className="text-muted hover:text-accent">
                {label}
              </a>
            </span>
          ))}
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          {project.tagline}
        </p>
      </section>

      {latest && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Latest digest · {latest.date}
            </h2>
            <span className="font-mono text-[11px] text-faint">
              by {latest.author}
              {latest.reviewedBy ? ` · reviewed by ${latest.reviewedBy}` : ""}
            </span>
          </div>
          <div
            className="prose-powarz rounded-lg border border-border-subtle bg-surface p-6 text-[14px]"
            dangerouslySetInnerHTML={{ __html: latest.html }}
          />
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Build journal
          </h2>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group flex flex-col gap-1 py-4"
                >
                  <span className="text-[15px] font-medium group-hover:text-accent">
                    {post.title}
                  </span>
                  <span className="text-[13px] text-muted">{post.summary}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {post.date} · {post.author}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fleet.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Fleet
          </h2>
          <div className="flex flex-col gap-4">
            {fleet.map((agent) => (
              <div
                key={agent.id}
                className="rounded-lg border border-border-subtle bg-surface p-5"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold">{agent.name}</h3>
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
          </div>
        </section>
      )}

      {telemetry.runs.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Telemetry
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
                {telemetry.runs.slice(0, 10).map((run, i) => (
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
      )}
    </div>
  );
}
