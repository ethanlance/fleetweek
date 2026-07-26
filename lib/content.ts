import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  status: "building" | "live" | "pre-launch" | "sunset";
  started: string;
  builder: string;
  links: Record<string, string>;
}

export interface Digest {
  slug: string;
  project: string;
  date: string;
  author: string;
  reviewedBy: string | null;
  html: string;
}

export interface JournalPost {
  slug: string;
  project: string;
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

function md(content: string): string {
  return marked.parse(content, { async: false }) as string;
}

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readMarkdownDir(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      return { slug: f.replace(/\.md$/, ""), ...matter(raw) };
    });
}

export function getProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((d) =>
      fs.existsSync(path.join(PROJECTS_DIR, d, "project.json"))
    )
    .map((d) => {
      const meta = readJson<Omit<Project, "slug">>(
        path.join(PROJECTS_DIR, d, "project.json")
      )!;
      return { ...meta, links: meta.links ?? {}, slug: d };
    })
    .sort((a, b) => a.started.localeCompare(b.started));
}

export function getProject(slug: string): Project | null {
  return getProjects().find((p) => p.slug === slug) ?? null;
}

export function getDigests(projectSlug?: string): Digest[] {
  const projects = projectSlug ? [projectSlug] : getProjects().map((p) => p.slug);
  return projects
    .flatMap((proj) =>
      readMarkdownDir(path.join(PROJECTS_DIR, proj, "digests")).map((f) => ({
        slug: f.slug,
        project: proj,
        date: String(f.data.date ?? f.slug),
        author: String(f.data.author ?? "chronicler"),
        reviewedBy: f.data.reviewed_by ? String(f.data.reviewed_by) : null,
        html: md(f.content),
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getJournalPosts(projectSlug?: string): JournalPost[] {
  const projects = projectSlug ? [projectSlug] : getProjects().map((p) => p.slug);
  return projects
    .flatMap((proj) =>
      readMarkdownDir(path.join(PROJECTS_DIR, proj, "journal")).map((f) => ({
        slug: f.slug,
        project: proj,
        title: String(f.data.title ?? f.slug),
        date: String(f.data.date ?? ""),
        author: String(f.data.author ?? "ethan"),
        summary: String(f.data.summary ?? ""),
        html: md(f.content),
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getJournalPost(slug: string): JournalPost | null {
  return getJournalPosts().find((p) => p.slug === slug) ?? null;
}

export function getFleet(projectSlug: string): FleetAgent[] {
  return (
    readJson<FleetAgent[]>(path.join(PROJECTS_DIR, projectSlug, "fleet.json")) ??
    []
  );
}

export function getTelemetry(projectSlug: string): Telemetry {
  return (
    readJson<Telemetry>(
      path.join(PROJECTS_DIR, projectSlug, "telemetry", "jobs.json")
    ) ?? { updatedAt: "", monthlyCostUsd: null, runs: [] }
  );
}
