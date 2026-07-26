import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getDigests, getFleet, getJournalPosts, getProjects } from "./content";

export interface CorpusSource {
  slug: string;
  title: string;
  url: string | null;
}

/**
 * Assemble the Docent's ground truth from everything published on the site,
 * plus the corpus/ background files. Returns the prompt text and the source
 * map used to resolve [slug] citations into links.
 */
export function buildCorpus(): { text: string; sources: CorpusSource[] } {
  const sections: string[] = [];
  const sources: CorpusSource[] = [];

  const corpusDir = path.join(process.cwd(), "content", "corpus");
  if (fs.existsSync(corpusDir)) {
    for (const f of fs.readdirSync(corpusDir).filter((f) => f.endsWith(".md"))) {
      const raw = matter(fs.readFileSync(path.join(corpusDir, f), "utf8"));
      const slug = String(raw.data.slug ?? f.replace(/\.md$/, ""));
      const title = String(raw.data.title ?? slug);
      sections.push(`### Source [${slug}] — ${title}\n\n${raw.content.trim()}`);
      sources.push({ slug, title, url: null });
    }
  }

  for (const post of getJournalPosts()) {
    // Strip HTML back to something prompt-friendly
    const text = post.html
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    sections.push(
      `### Source [${post.slug}] — journal: "${post.title}" (${post.date}, project: ${post.project})\n\n${text}`
    );
    sources.push({
      slug: post.slug,
      title: post.title,
      url: `/journal/${post.slug}`,
    });
  }

  const projects = getProjects();
  for (const p of projects) {
    const fleet = getFleet(p.slug);
    const fleetText = fleet
      .map((a) => `${a.name} (${a.cadence}, ${a.status}): ${a.charter}`)
      .join("\n");
    sections.push(
      `### Source [project-${p.slug}] — project page: ${p.name}\n\nStatus: ${p.status}, builder: ${p.builder}, since ${p.started}.\nTagline: ${p.tagline}\n${fleetText ? `Fleet:\n${fleetText}` : ""}`
    );
    sources.push({
      slug: `project-${p.slug}`,
      title: p.name,
      url: `/p/${p.slug}`,
    });
  }

  const recentDigests = getDigests().slice(0, 7);
  if (recentDigests.length > 0) {
    const digestText = recentDigests
      .map(
        (d) =>
          `${d.date} (${d.project}, by ${d.author}${d.reviewedBy ? `, reviewed by ${d.reviewedBy}` : ""}):\n${d.html.replace(/<[^>]+>/g, "").trim()}`
      )
      .join("\n\n");
    sections.push(`### Source [digests] — recent fleet digests\n\n${digestText}`);
    sources.push({ slug: "digests", title: "Recent fleet digests", url: "/" });
  }

  return { text: sections.join("\n\n---\n\n"), sources };
}
