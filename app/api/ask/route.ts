import { NextResponse } from "next/server";

// Docent stub. The real implementation answers over the site corpus
// (content/corpus/) with citations, and must pass the founder top-10
// question bar before it ships — see docs/GOOSE-INTEGRATION.md.
export async function POST(req: Request) {
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").slice(0, 500);
  } catch {
    // fall through with empty question
  }

  if (!question.trim()) {
    return NextResponse.json(
      { answer: "Ask me something about Ethan's work." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    answer:
      "The Docent is still in training — its corpus (the Powarz v1 post-mortem, the UnitedMasters agentic-transformation story, and the build journal) is being written. Until then, the Journal has the long-form answers, and the fleet page shows who does what around here.",
  });
}
