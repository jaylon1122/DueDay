import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assignments } = await req.json()

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY not set')

    const today = new Date().toISOString().split('T')[0]

    const prompt = `You are an AI study scheduler. Analyze these assignments and create an optimized study plan.

Today's date: ${today}

Assignments:
${JSON.stringify(assignments, null, 2)}

Return a JSON object with this exact structure (no markdown, no extra text):
{
  "summary": "Brief 1-2 sentence overview of the workload",
  "workload_level": "low",
  "study_plan": [
    {
      "date": "YYYY-MM-DD",
      "day_label": "Today",
      "sessions": [
        {
          "assignment_title": "string",
          "subject": "string",
          "duration_minutes": 30,
          "task": "string describing what to do"
        }
      ],
      "total_minutes": 30
    }
  ],
  "tips": ["tip1", "tip2", "tip3"],
  "priority_order": ["assignment title 1", "assignment title 2"]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const cleaned = content.replace(/```json|```/g, '').trim()
    const plan = JSON.parse(cleaned)

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})