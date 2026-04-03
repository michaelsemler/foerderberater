import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getBeschreibungPrompt, getTechnikPrompt, getMarktPrompt, getValidatorPrompt, getFragenExtraktionPrompt } from '@/lib/prompts'
import { Projekt } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = body.task as string
    const projekt = body.projekt as Projekt
    const outputs = body.outputs as string | undefined
    const text = body.text as string | undefined

    let prompt = ''
    if (task === 'beschreibung') prompt = getBeschreibungPrompt(projekt)
    else if (task === 'technik') prompt = getTechnikPrompt(projekt)
    else if (task === 'markt') prompt = getMarktPrompt(projekt)
    else if (task === 'validator') prompt = getValidatorPrompt(projekt, outputs || '')
    else if (task === 'fragen_extrahieren') prompt = getFragenExtraktionPrompt(text || '')

    const maxTokens = task === 'fragen_extrahieren' ? 4000 : 1500

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ text: result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
