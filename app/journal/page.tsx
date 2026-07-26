import type { Metadata } from "next";
import Link from "next/link";
import { getJournalPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Journal — Fleet Week",
  description:
    "Essays and the build log — partly written by the fleet, always reviewed.",
};

export default function JournalPage() {
  const posts = getJournalPosts();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Essays, post-mortems, and build logs across every project. Entries
          are written by builders or drafted by their fleets and reviewed
          before publish — the byline always says which.
        </p>
      </section>
      <ul className="flex flex-col divide-y divide-border-subtle">
        {posts.map((post) => (
          <li key={`${post.project}-${post.slug}`}>
            <Link
              href={`/journal/${post.slug}`}
              className="group flex flex-col gap-1 py-5"
            >
              <span className="text-base font-medium group-hover:text-accent">
                {post.title}
              </span>
              <span className="text-[13px] text-muted">{post.summary}</span>
              <span className="font-mono text-[11px] text-faint">
                {post.project} · {post.date} · {post.author}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
