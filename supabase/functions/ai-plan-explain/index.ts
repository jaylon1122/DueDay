import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const OPENAI_MODEL = "gpt-4o-mini";

interface RankedPayload {
  id: string;
  title: string;
  priority: string;
  reason: string;
  daysUntilDue: number;
  isOverdue: boolean;
  effectiveHours: number;
  urgencyScore: number;
}

interface DayPlanPayload {
  dateKey: string;
  totalHours: number;
  tier: string;
  items: { title: string; hours: number }[];
}

interface RequestBody {
  rankedAssignments: RankedPayload[];
  dailyPlan: DayPlanPayload[];
  capacity: number;
}

interface ExplainResponse {
  summary: string;
  focusToday: string | null;
}

function buildPrompt(
  ranked: RankedPayload[],
  dailyPlan: DayPlanPayload[],
  capacity: number,
): string {
  const top = ranked.slice(0, 8).map((a, i) =>
    `${i + 1}. "${a.title}" (${a.priority}, ${a.effectiveHours}h, score ${Math.round(a.urgencyScore)}) — ${a.reason}`
  ).join("\n");

  const schedule = dailyPlan.slice(0, 10).map((d) => {
    const items = d.items.map((i) => `${i.title} (${i.hours.toFixed(1)}h)`).join(", ");
    return `${d.dateKey}: ${d.tier}, ${d.totalHours.toFixed(1)}h total — ${items || "rest day"}`;
  }).join("\n");

  return `Student study plan (algorithm-generated). Daily capacity: ${capacity}h.

Top priorities:
${top || "No pending assignments."}

Suggested schedule:
${schedule || "No workload scheduled."}

Write a brief, encouraging explanation. "summary" = 2–3 sentences on the overall plan and why the order makes sense. "focusToday" = one concrete sentence for what to tackle first today, or null if nothing is pending.`;
}

export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!ctx.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "AI service not configured" }, { status: 503 });
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { rankedAssignments, dailyPlan, capacity } = body;
    if (!Array.isArray(rankedAssignments) || !Array.isArray(dailyPlan)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a friendly study coach. Explain algorithm-generated study plans in plain, encouraging language. Respond with JSON only: {"summary":"string","focusToday":"string or null"}.',
          },
          {
            role: "user",
            content: buildPrompt(rankedAssignments, dailyPlan, capacity ?? 5),
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      console.error("OpenAI error:", openaiRes.status, await openaiRes.text());
      return Response.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    try {
      const parsed = JSON.parse(content) as ExplainResponse;
      return Response.json({
        summary: parsed.summary ?? "",
        focusToday: parsed.focusToday ?? null,
      });
    } catch {
      return Response.json({ error: "Invalid AI response" }, { status: 502 });
    }
  }),
};
