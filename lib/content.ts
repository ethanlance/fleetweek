import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface Digest {
  slug: string;
  date: string;
  author: string;
  reviewedBy: string | null;
  html: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  html: string;
}

export interface FleetAgent {
  id: string;
  name: string;
  role: string;
  charter: string;
  cadence: string;
  status: "active" | "standing-up" | "paused";
  runtime: string;
}

export interface JobRun {
  job: string;
  startedAt: string;
  status: "ok" | "error" | "skipped";
  note?: string;
}

export interface Telemetry {
  updatedAt: string;
  monthlyCostUsd: number | null;
  runs: JobRun[];
}

function readMarkdownDir(dir: string) {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), "utf8");
      return { slug: f.replace(/\.md$/, ""), ...matter(raw) };
    });
}

function md(content: string): string {
  return marked.parse(content, { async: false }) as string;
}

export function getDigests(): Digest[] {
  return readMarkdownDir("digests")
    .map((f) => ({
      slug: f.slug,
      date: String(f.data.date ?? f.slug),
      author: String(f.data.author ?? "chronicler"),
      reviewedBy: f.data.reviewed_by ? String(f.data.reviewed_by) : null,
      html: md(f.content),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getJournalPosts(): JournalPost[] {
  return readMarkdownDir("journal")
    .map((f) => ({
      slug: f.slug,
      title: String(f.data.title ?? f.slug),
      date: String(f.data.date ?? ""),
      author: String(f.data.author ?? "ethan"),
      summary: String(f.data.summary ?? ""),
      html: md(f.content),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getJournalPost(slug: string): JournalPost | null {
  return getJournalPosts().find((p) => p.slug === slug) ?? null;
}

export function getFleet(): FleetAgent[] {
  const file = path.join(CONTENT_DIR, "fleet.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as FleetAgent[];
}

export function getTelemetry(): Telemetry {
  const file = path.join(CONTENT_DIR, "telemetry", "jobs.json");
  if (!fs.existsSync(file)) {
    return { updatedAt: "", monthlyCostUsd: null, runs: [] };
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as Telemetry;
}
