export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateScenarioStream } from '@/lib/ai/generate-scenario'
import { adminCreateScenario } from '@/lib/firebase/firestore-admin'
import type { GenerationParams } from '@/lib/types'

// Streaming POST — keeps connection alive so Vercel's 10s limit doesn't kill it
export async function POST(req: NextRequest) {
  let params: GenerationParams
  try {
    params = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!params.subject || !params.topic || !params.difficulty) {
    return NextResponse.json({ error: 'Missing required fields: subject, topic, difficulty' }, { status: 400 })
  }
  if (!params.answers || Object.keys(params.answers).length < 5) {
    return NextResponse.json({ error: 'Must provide answers to all 5 questions' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        let fullText = ''
        const gen = generateScenarioStream(params)

        for await (const chunk of gen) {
          fullText += chunk
          send({ type: 'chunk', text: chunk })
        }

        // Parse the accumulated JSON
        const { cleanAndParseJson } = await import('@/lib/ai/generate-scenario')
        const scenario = cleanAndParseJson(fullText)
        const tempId = `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` // fallback if Firestore fails
        const finalScenario = { ...scenario, id: tempId }

        // Save to Firestore with Admin SDK
        let scenarioId = tempId
        try {
          scenarioId = await adminCreateScenario({
            ...scenario,
            subjectId: params.subject,
            topicId: params.topic,
            createdBy: params.answers._instructorId ?? 'unknown',
            timesUsed: 0,
            avgScore: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        } catch (err) {
          console.error('[generate-scenario] Firestore save failed:', err)
        }

        send({ type: 'done', scenarioId, scenario: { ...finalScenario, id: scenarioId } })
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Generation failed' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
