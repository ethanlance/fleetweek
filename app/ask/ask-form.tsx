"use client";

import { useState } from "react";

export function AskForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "Something went wrong.");
    } catch {
      setAnswer("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about Ethan's work…"
          className="flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-[14px] placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>
      {answer && (
        <div className="prose-powarz rounded-lg border border-border-subtle bg-surface p-6 text-[14px]">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
