import Link from "next/link";
import { getDigests, getFleet, getJournalPosts } from "@/lib/content";
import { StatusDot } from "@/components/status";

export default function OpsRoom() {
  const digests = getDigests();
  const fleet = getFleet();
  const posts = getJournalPosts().slice(0, 3);
  const latest = digests[0];

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          This site has no webmaster.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          powarz.com is maintained by{" "}
          <a
            href="https://github.com/ethanlance/goose"
            className="text-accent underline decoration-accent-dim underline-offset-3 hover:decoration-accent"
          >
            Goose
          </a>
          , a fleet of AI agents directed by{" "}
          <Link
            href="/about"
            className="text-foreground underline decoration-border-subtle underline-offset-3 hover:decoration-accent"
          >
            Ethan Lance
          </Link>
          . The agents write the digests, review each other&apos;s work via
          pull requests, and watch the site&apos;s health. The maintenance is
          the demo.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Fleet status
          </h2>
          <Link
            href="/fleet"
            className="text-[13px] text-muted hover:text-foreground"
          >
            Meet the fleet →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle sm:grid-cols-4">
          {fleet.map((agent) => (
            <div key={agent.id} className="bg-surface p-4">
              <div className="text-sm font-medium">{agent.name}</div>
              <div className="mt-0.5 text-[12px] text-faint">{agent.role}</div>
              <div className="mt-2">
                <StatusDot status={agent.status} />
              </div>
            </div>
          ))}
        </div>
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

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Journal
          </h2>
          <Link
            href="/journal"
            className="text-[13px] text-muted hover:text-foreground"
          >
            All entries →
          </Link>
        </div>
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
                  {post.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
