const SYSTEM_PROMPT = `You are a tech marketing writer who turns GitHub pull requests into short, 
punchy LinkedIn video scripts. You translate developer language into user-facing benefits.
Rules:
- Never invent features not in the PR
- Never use words like "revolutionize", "game-changing", "leverage", "synergy"  
- Each slide headline must make sense without context
- Keep body text under 25 words per slide
- Confidence 0–1: how worth promoting is this PR? (hotfixes/docs/chores score low)
- Return ONLY valid JSON, no markdown, no explanation`

function buildUserPrompt(prData) {
  return `Turn this GitHub PR into a video script.

Repo: ${prData.repo}
PR #${prData.number}: ${prData.title}
Author: @${prData.author}
Updated: ${new Date(prData.updated_at).toLocaleDateString()}
Description:
${prData.body}

Return this exact JSON shape:
{
  "hook": "one punchy opening line under 120 chars",
  "slides": [
    {
      "id": "s1",
      "tag": "2-3 word label",
      "headline": "slide headline max 8 words",
      "body": "supporting copy max 25 words"
    }
  ],
  "caption": "LinkedIn caption 100-180 chars",
  "hashtags": ["tag1", "tag2", "tag3", "tag4"],
  "tone": "celebratory | informational | technical | minimal",
  "confidence": 0.0,
  "skip_reason": null
}

Generate 3-5 slides. If confidence is below 0.4, still generate the script but set skip_reason to explain why this PR may not be worth promoting.`
}

function parseScriptJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(clean)
  }
}

export async function generateScript(prData) {
  const key = import.meta.env.VITE_GROQ_KEY
  if (!key) throw new Error('Missing VITE_GROQ_KEY — get a free key at console.groq.com')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(prData) },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Groq API error: ${res.status} ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  const text = data.choices[0].message.content.trim()
  return parseScriptJson(text)
}
