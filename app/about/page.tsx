import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Powarz",
  description:
    "Ethan Lance — 20+ years building internet products across engineering and product leadership.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Ethan Lance</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Builder first. 20+ years of internet products — starting at CNET on
          MP3.com and TV.com, then Whiskey Media&apos;s wiki-powered
          communities (Giant Bomb, Comic Vine, Tested), engineering at Beats
          Music through Apple&apos;s acquisition and the transition to Apple
          Music, product leadership at Dwell, and engineering leadership at
          UnitedMasters — where I led the team&apos;s transformation to
          agentic, AI-driven development.
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          The threads that keep showing up in everything I build: music,
          community, and giving people superpowers with software. This site is
          a working example — it&apos;s maintained by{" "}
          <a
            href="https://github.com/ethanlance/goose"
            className="text-accent underline decoration-accent-dim underline-offset-3 hover:decoration-accent"
          >
            Goose
          </a>
          , an agent platform I built and direct.
        </p>
      </section>
      <section className="flex flex-col gap-2 font-mono text-[13px]">
        <a
          href="https://github.com/ethanlance"
          className="text-muted hover:text-accent"
        >
          github.com/ethanlance
        </a>
        <a
          href="mailto:ethanlance@gmail.com"
          className="text-muted hover:text-accent"
        >
          ethanlance@gmail.com
        </a>
      </section>
    </div>
  );
}
