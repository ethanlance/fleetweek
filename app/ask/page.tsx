import type { Metadata } from "next";
import { AskForm } from "./ask-form";

export const metadata: Metadata = {
  title: "Ask — Powarz",
  description:
    "Interrogate the Docent about Ethan Lance's work. Grounded in the site corpus, cites its sources.",
};

export default function AskPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ask the Docent
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          The Docent answers questions about Ethan&apos;s work — grounded
          strictly in what&apos;s published on this site, with citations. Try
          &quot;How did he decide to kill the battle platform?&quot; or
          &quot;How does he run AI adoption on a team?&quot;
        </p>
      </section>
      <AskForm />
    </div>
  );
}
