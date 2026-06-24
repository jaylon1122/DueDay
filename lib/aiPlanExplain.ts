import type { DayPlan, RankedAssignment } from './aiScheduler'

export interface AiPlanExplanation {
  summary: string
  focusToday?: string
}

export async function fetchAiPlanExplanation(
  ranked: RankedAssignment[],
  dailyPlan: DayPlan[],
  dailyCapacity: number
): Promise<AiPlanExplanation | null> {
  if (ranked.length === 0) return null

  try {
    const topItems = ranked
      .slice(0, 5)
      .map((a, i) => `${i + 1}. "${a.title}" — ${a.priority} priority, due in ${a.daysUntilDue} day${a.daysUntilDue === 1 ? '' : 's'}, ~${a.effectiveHours}h needed`)
      .join('\n')

    const todayPlan = dailyPlan.find(d => d.items.length > 0)
    const todaySummary = todayPlan
      ? `Today's suggested workload: ${todayPlan.items.map(i => `${i.title} (${i.hours.toFixed(1)}h)`).join(', ')} — total ${todayPlan.totalHours.toFixed(1)}h of ${dailyCapacity}h capacity.`
      : 'No work is scheduled for today specifically.'

    const prompt = `You're a friendly, encouraging study coach for a student. Here is their current ranked workload (most urgent first):

${topItems}

${todaySummary}

Respond ONLY with a valid JSON object, no explanation, no markdown, in this exact format:
{
  "summary": "string (3-4 warm, encouraging sentences about what to focus on this week and why, no markdown)",
  "focusToday": "string (one short, specific sentence on the single most important thing to start with today)"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    )

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) throw new Error('No response from AI')

    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!parsed.summary) throw new Error('AI response missing summary field')

    return {
      summary: parsed.summary,
      focusToday: parsed.focusToday,
    }
  } catch (err) {
    console.log('AI plan explanation error:', err)
    return null // ai.tsx already handles null gracefully — falls back to algorithm-only UI
  }
}