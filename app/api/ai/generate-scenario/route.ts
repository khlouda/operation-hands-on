export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateScenario } from '@/lib/ai/generate-scenario'
import { createScenario } from '@/lib/firebase/firestore'
import type { GenerationParams } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const params: GenerationParams = await req.json()

    // Basic validation
    if (!params.subject || !params.topic || !params.difficulty) {
      return NextResponse.json({ error: 'Missing required fields: subject, topic, difficulty' }, { status: 400 })
    }
    if (!params.answers || Object.keys(params.answers).length < 5) {
      return NextResponse.json({ error: 'Must provide answers to all 5 questions' }, { status: 400 })
    }

    // Generate via Claude
    const result = await generateScenario(params)

    // Save to Firestore
    const scenarioId = await createScenario({
      ...result.scenario,
      subjectId: params.subject,
      topicId: params.topic,
      createdBy: params.answers._instructorId ?? 'unknown',
      timesUsed: 0,
      avgScore: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Stamp the scenario ID into nested objects
    return NextResponse.json({ scenarioId, scenario: { ...result.scenario, id: scenarioId } })
  } catch (err) {
    console.error('[generate-scenario]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

// Streaming endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paramsStr = searchParams.get('params')
  if (!paramsStr) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const params: GenerationParams = JSON.parse(paramsStr)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { generateScenarioStream } = await import('@/lib/ai/generate-scenario')
        const gen = generateScenarioStream(params)
        for await (const chunk of gen) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        )
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
