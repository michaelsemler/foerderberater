import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei angegeben' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    // Extract text based on file type
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else {
      // txt, md, and other text-based files
      extractedText = buffer.toString('utf-8')
    }

    // Upload original file to Vercel Blob if token is configured
    let blobUrl: string | null = null
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, buffer, { access: 'public' })
      blobUrl = blob.url
    }

    return NextResponse.json({ text: extractedText, url: blobUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
