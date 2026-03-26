import Anthropic from '@anthropic-ai/sdk'
import type { GenerationParams, ScenarioGenerationResult, ToolType } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── TOOL MAPPING ─────────────────────────────────────────────────────────────

const SUBJECT_TOOLS: Record<string, ToolType[]> = {
  cybersecurity: ['file-viewer'],
  networking: ['file-viewer', 'network-diagram'],
  linux: ['terminal', 'file-viewer'],
  'cloud-computing': ['file-viewer', 'code-editor'],
  'ai-ml': ['code-editor', 'file-viewer'],
  'software-development': ['code-editor', 'file-viewer'],
  'systems-administration': ['terminal', 'file-viewer'],
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a world-class instructional designer creating realistic, immersive training scenarios for university students in technical fields.

Your scenarios must feel like REAL situations a professional would face on their first job — not textbook exercises.

Rules for every scenario:
- Make the story feel urgent and real. Use a fictional company name, real-sounding people, and a plausible crisis.
- Every task must build on the previous one. Students discover the answer to task 3 by completing task 2.
- Evidence files must look authentic — real Apache log formats, real config file syntax, realistic IP addresses (RFC 5737 ranges: 192.0.2.x, 198.51.100.x, 203.0.113.x).
- Inject events must feel like real escalations — a boss demanding answers, new evidence surfacing, the situation getting worse.
- Vary everything: company names, people names, IP addresses, timestamps. Never produce the same scenario twice.
- Answers/flags must be specific enough to validate but not guessable without doing the work.

Always respond with valid JSON only. No markdown fences. No explanatory text outside the JSON.`
}

// ─── USER PROMPT ─────────────────────────────────────────────────────────────

function buildUserPrompt(params: GenerationParams): string {
  const answersText = Object.entries(params.answers)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n')

  return `Generate a complete training scenario with these parameters:

Subject: ${params.subject}
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Time limit: ${params.timeLimit} minutes
Team size: ${params.teamSize} students per team
Mode: ${params.mode}
Learning objectives: ${params.learningObjectives.join(', ')}

Instructor context:
${answersText}

Return a JSON object with this exact structure:

{
  "title": "Short, dramatic scenario title (e.g. 'Operation Blackout' or 'The Silent Breach')",
  "story": "2-3 paragraph immersive narrative. Sets the scene, introduces the crisis, makes it feel real and urgent.",
  "briefing": "1 paragraph mission brief for students. What they need to do and why it matters.",
  "difficulty": "${params.difficulty}",
  "estimatedTime": ${params.timeLimit},
  "aiGenerated": true,
  "generationParams": ${JSON.stringify(params)},
  "status": "draft",
  "toolsAvailable": ${JSON.stringify(SUBJECT_TOOLS[params.subject] ?? ['file-viewer'])},
  "tasks": [
    {
      "id": "task_1",
      "scenarioId": "",
      "title": "Task title",
      "description": "Detailed task description. What the student needs to find/do. Should reference the story.",
      "type": "flag",
      "points": 150,
      "correctAnswer": "exact_answer_here",
      "hints": [
        { "id": "hint_1_1", "text": "First hint — vague direction", "pointsCost": 25, "orderIndex": 0 },
        { "id": "hint_1_2", "text": "Second hint — more specific", "pointsCost": 50, "orderIndex": 1 }
      ],
      "orderIndex": 0,
      "unlockCondition": null
    }
  ],
  "resources": [
    {
      "id": "resource_1",
      "scenarioId": "",
      "name": "filename.log",
      "type": "log",
      "content": "Full realistic file content here. For logs: use real log format with real-looking timestamps and data.",
      "isDistractor": false,
      "unlockCondition": null
    }
  ],
  "injectEvents": [
    {
      "id": "inject_1",
      "scenarioId": "",
      "title": "Inject event title",
      "content": "The message students see. Should escalate the situation.",
      "triggerType": "time",
      "triggerTime": 20,
      "target": "all",
      "scoreImpact": 0,
      "unlocksResources": [],
      "fired": false
    }
  ]
}

Requirements:
- Generate 3-5 progressive tasks (each task unlocks understanding needed for the next)
- Generate 3-5 evidence files (mix of useful and 1-2 distractors, set isDistractor: true)
- Generate 3 inject events that fire at different times (20, 40, 65 minutes work well for ${params.timeLimit}min sessions)
- Make one inject unlock a new resource
- Task points should total around ${Math.round(params.timeLimit * 5)} points
- For task types: use "flag" for finding a specific value, "text" for analysis/explanation, "command" for terminal tasks
- Correct answers for flag tasks should be specific (e.g. "192.0.2.47", "2024-03-15 03:42:17", "CVE-2024-1234")`
}

// ─── JSON CLEANER ─────────────────────────────────────────────────────────────

function cleanAndParseJson(raw: string): ScenarioGenerationResult['scenario'] {
  // 1. Strip markdown fences if present
  let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  // 2. Extract the outermost JSON object
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1)

  // 3. Try direct parse first
  try { return JSON.parse(text) } catch { /* continue to repair */ }

  // 4. Repair common issues:
  //    a. Remove trailing commas before ] or }
  text = text.replace(/,(\s*[}\]])/g, '$1')
  //    b. Replace literal tab characters inside strings (break JSON)
  text = text.replace(/\t/g, '\\t')
  //    c. Replace unescaped control chars inside strings
  text = text.replace(/[\x00-\x1F\x7F]/g, c => {
    const code = c.charCodeAt(0).toString(16).padStart(4, '0')
    return `\\u${code}`
  })

  // 5. Try again after repair
  try { return JSON.parse(text) } catch { /* continue */ }

  // 6. Last resort: truncate at last complete top-level field and close the object
  //    This handles cases where Claude ran out of tokens mid-string
  const safeEnd = text.lastIndexOf(',"injectEvents"')
  if (safeEnd > 0) {
    const truncated = text.slice(0, safeEnd) + ',"injectEvents":[]}'
    try { return JSON.parse(truncated) } catch { /* continue */ }
  }

  throw new Error(`JSON parse failed. First 200 chars: ${text.slice(0, 200)}`)
}

// ─── MAIN GENERATION FUNCTION ─────────────────────────────────────────────────

export async function generateScenario(
  params: GenerationParams
): Promise<ScenarioGenerationResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(params) }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude API')

  const parsed = cleanAndParseJson(content.text)

  // Stamp scenarioId placeholders — will be filled when saved to Firestore
  if (parsed.tasks) parsed.tasks = parsed.tasks.map(t => ({ ...t, scenarioId: '' }))
  if (parsed.resources) parsed.resources = parsed.resources.map(r => ({ ...r, scenarioId: '' }))
  if (parsed.injectEvents) parsed.injectEvents = parsed.injectEvents.map(e => ({ ...e, scenarioId: '' }))

  return { scenario: parsed }
}

// ─── STREAMING GENERATION (for real-time UI display) ─────────────────────────

export async function* generateScenarioStream(
  params: GenerationParams
): AsyncGenerator<string, ScenarioGenerationResult, unknown> {
  let fullText = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(params) }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      fullText += chunk.delta.text
      yield chunk.delta.text
    }
  }

  const parsed = cleanAndParseJson(fullText)
  return { scenario: parsed }
}
