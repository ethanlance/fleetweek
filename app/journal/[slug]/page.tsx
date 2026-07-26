import { notFound } from "next/navigation";
import { getJournalPost, getJournalPosts } from "@/lib/content";

export function generateStaticParams() {
  return getJournalPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = getJournalPost((await params).slug);
  if (!post) return {};
  return { title: `${post.title} — Fleet Week`, description: post.summary };
}

export default async function JournalEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = getJournalPost((await params).slug);
  if (!post) notFound();

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <div className="mt-2 font-mono text-[11px] text-faint">
          {post.project} · {post.date} · {post.author}
        </div>
      </header>
      <div
        className="prose-powarz text-[15px]"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
