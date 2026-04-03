'use client'
import { useState, useRef } from 'react'
import { Foerderstelle, AppSettings, Subkategorie, FrageTemplate } from '@/lib/types'

const FOERDERSTELLEN: Foerderstelle[] = ['FFG', 'AWS', 'SFG', 'WAW']

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
}

const label = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 } as const
const hint = { fontSize: 12, color: 'var(--text3)', marginBottom: 6, lineHeight: 1.5 } as const
const group = { marginBottom: 20 } as const

export default function Einstellungen({ settings, onChange }: Props) {
  const [selectedStelle, setSelectedStelle] = useState<Foerderstelle | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extractError, setExtractError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const currentConfig = selectedStelle ? settings.foerderstellen.find(f => f.stelle === selectedStelle) : null
  const currentSub = currentConfig?.subkategorien.find(s => s.id === selectedSubId) ?? null

  function updateSettings(stelle: Foerderstelle, updatedSub: Subkategorie) {
    onChange({
      ...settings,
      foerderstellen: settings.foerderstellen.map(f =>
        f.stelle === stelle
          ? { ...f, subkategorien: f.subkategorien.map(s => s.id === updatedSub.id ? updatedSub : s) }
          : f
      ),
    })
  }

  function addSubkategorie(stelle: Foerderstelle) {
    const id = 'sub_' + Date.now()
    const newSub: Subkategorie = { id, name: 'Neue Subkategorie', richtlinien: '', dokumente: '', businessplanText: '', fragen: [] }
    onChange({
      ...settings,
      foerderstellen: settings.foerderstellen.map(f =>
        f.stelle === stelle ? { ...f, subkategorien: [...f.subkategorien, newSub] } : f
      ),
    })
    setSelectedStelle(stelle)
    setSelectedSubId(id)
  }

  function deleteSubkategorie(stelle: Foerderstelle, id: string) {
    if (!confirm('Subkategorie wirklich löschen?')) return
    onChange({
      ...settings,
      foerderstellen: settings.foerderstellen.map(f =>
        f.stelle === stelle ? { ...f, subkategorien: f.subkategorien.filter(s => s.id !== id) } : f
      ),
    })
    setSelectedSubId(null)
  }

  function addFrage() {
    if (!currentSub || !selectedStelle) return
    const newFrage: FrageTemplate = { id: 'frage_' + Date.now(), frage: '', prompt: '', schablone: '' }
    updateSettings(selectedStelle, { ...currentSub, fragen: [...currentSub.fragen, newFrage] })
  }

  function updateFrage(frageId: string, field: keyof FrageTemplate, value: string) {
    if (!currentSub || !selectedStelle) return
    updateSettings(selectedStelle, {
      ...currentSub,
      fragen: currentSub.fragen.map(f => f.id === frageId ? { ...f, [field]: value } : f),
    })
  }

  function deleteFrage(frageId: string) {
    if (!currentSub || !selectedStelle) return
    updateSettings(selectedStelle, { ...currentSub, fragen: currentSub.fragen.filter(f => f.id !== frageId) })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentSub || !selectedStelle) return
    setUploading(true)
    setExtractError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      updateSettings(selectedStelle, {
        ...currentSub,
        businessplanText: data.text ?? '',
        businessplanUrl: data.url ?? currentSub.businessplanUrl,
      })
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleExtract() {
    if (!currentSub?.businessplanText || !currentSub || !selectedStelle) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'fragen_extrahieren', text: currentSub.businessplanText }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.text) {
        const extracted = parseExtractedQuestions(data.text)
        const ts = Date.now()
        const newFragen: FrageTemplate[] = extracted
          .filter(frage => frage.trim())
          .map((frage, i) => ({
            id: `frage_${ts}_${i}`,
            frage: frage.trim(),
            prompt: '',
            schablone: '',
          }))
        if (newFragen.length === 0) throw new Error('Keine Fragen gefunden')
        updateSettings(selectedStelle, { ...currentSub, fragen: [...currentSub.fragen, ...newFragen] })
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Fehler beim Extrahieren. Bitte erneut versuchen.')
    } finally {
      setExtracting(false)
    }
  }

  function parseExtractedQuestions(raw: string): string[] {
    const text = raw.trim()

    // 1) Preferred format: FRAGE: ...
    const frageLines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => /^frage\s*:/i.test(line))
      .map(line => line.replace(/^frage\s*:\s*/i, '').trim())
      .filter(Boolean)
    if (frageLines.length > 0) return dedupeQuestions(frageLines)

    // 2) Backward compatibility: JSON output
    try {
      let jsonText = text
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i)
      if (codeBlockMatch) jsonText = codeBlockMatch[1].trim()
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
      if (arrayMatch) jsonText = arrayMatch[0]
      const parsed = JSON.parse(jsonText) as { frage?: string }[]
      const jsonQuestions = parsed.map(e => e.frage?.trim() || '').filter(Boolean)
      if (jsonQuestions.length > 0) return dedupeQuestions(jsonQuestions)
    } catch {
      // continue with heuristic fallback below
    }

    // 3) Heuristic fallback: numbered or bullet lines
    const fallback = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^[-*•]\s+/, ''))
      .map(line => line.replace(/^\d+[.)]\s+/, ''))
      .filter(line => line.length > 10)
    return dedupeQuestions(fallback)
  }

  function dedupeQuestions(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const value of values) {
      const normalized = value.replace(/\s+/g, ' ').trim()
      if (!normalized) continue
      const key = normalized.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      result.push(normalized)
    }
    return result
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <aside style={{ width: 260, minWidth: 260, borderRight: '0.5px solid var(--border)', background: 'var(--bg2)', overflowY: 'auto', padding: 8 }}>
        <div style={{ padding: '10px 8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Förderstellen
        </div>
        {FOERDERSTELLEN.map(stelle => {
          const config = settings.foerderstellen.find(f => f.stelle === stelle)
          if (!config) return null
          return (
            <div key={stelle} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, padding: '4px 8px', color: 'var(--text)' }}>{stelle}</div>
              {config.subkategorien.map(sub => (
                <button key={sub.id}
                  onClick={() => { setSelectedStelle(stelle); setSelectedSubId(sub.id) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px 6px 20px', border: sub.id === selectedSubId ? '0.5px solid var(--border2)' : '0.5px solid transparent', borderRadius: 'var(--radius)', background: sub.id === selectedSubId ? 'var(--bg)' : 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13, marginBottom: 1 }}>
                  {sub.name}
                </button>
              ))}
              <button onClick={() => addSubkategorie(stelle)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 12px 5px 20px', border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>
                + Neue Subkategorie
              </button>
            </div>
          )
        })}
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {currentSub && selectedStelle ? (
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <input
                value={currentSub.name}
                onChange={e => updateSettings(selectedStelle, { ...currentSub, name: e.target.value })}
                style={{ flex: 1, fontSize: 16, fontWeight: 500 }}
              />
              <button className="btn btn-danger" onClick={() => deleteSubkategorie(selectedStelle, currentSub.id)}>
                Löschen
              </button>
            </div>

            <div style={group}>
              <label style={label}>Richtlinien</label>
              <p style={hint}>Füge die offiziellen Förderrichtlinien für dieses Programm ein.</p>
              <textarea rows={5} value={currentSub.richtlinien}
                onChange={e => updateSettings(selectedStelle, { ...currentSub, richtlinien: e.target.value })}
                placeholder="Richtlinientext..." />
            </div>

            <div style={group}>
              <label style={label}>Dokumente / Informationen</label>
              <p style={hint}>Weitere relevante Anforderungen, Kriterien oder Hinweise.</p>
              <textarea rows={5} value={currentSub.dokumente}
                onChange={e => updateSettings(selectedStelle, { ...currentSub, dokumente: e.target.value })}
                placeholder="Zusätzliche Informationen..." />
            </div>

            <div style={group}>
              <label style={label}>Businessplan-Vorlage</label>
              <p style={hint}>Lade eine Textdatei (.txt) hoch oder füge den Inhalt direkt ein. Claude extrahiert daraus automatisch alle Fragen.</p>
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Wird hochgeladen...' : 'Datei hochladen (.txt, .pdf)'}
                </button>
                {currentSub.businessplanUrl && (
                  <a href={currentSub.businessplanUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--text3)' }}>Originaldatei ansehen ↗</a>
                )}
                <button className="btn btn-primary" onClick={handleExtract}
                  disabled={extracting || !currentSub.businessplanText}>
                  {extracting ? 'Extrahiere Fragen...' : 'Fragen extrahieren (KI)'}
                </button>
              </div>
              {extractError && <p style={{ fontSize: 12, color: 'var(--red, #c0392b)', marginBottom: 8 }}>{extractError}</p>}
              <textarea rows={7} value={currentSub.businessplanText}
                onChange={e => updateSettings(selectedStelle, { ...currentSub, businessplanText: e.target.value })}
                placeholder="Oder Text hier direkt einfügen..." />
            </div>

            <div style={group}>
              <label style={label}>Fragen & Prompts</label>
              <p style={hint}>Definiere pro Frage einen spezifischen Prompt und eine Schablone für Claude.</p>
              {currentSub.fragen.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>Noch keine Fragen. Lade einen Businessplan hoch oder füge manuell Fragen hinzu.</p>
              )}
              {currentSub.fragen.map((frage, i) => (
                <div key={frage.id} style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', minWidth: 18 }}>{i + 1}.</span>
                    <input value={frage.frage}
                      onChange={e => updateFrage(frage.id, 'frage', e.target.value)}
                      placeholder="Frage..." style={{ flex: 1 }} />
                    <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => deleteFrage(frage.id)}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Prompt für Claude</div>
                      <textarea rows={3} value={frage.prompt}
                        onChange={e => updateFrage(frage.id, 'prompt', e.target.value)}
                        placeholder="Wie soll Claude diese Frage beantworten?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Schablone / Musterantwort</div>
                      <textarea rows={3} value={frage.schablone}
                        onChange={e => updateFrage(frage.id, 'schablone', e.target.value)}
                        placeholder="Beispielantwort oder Struktur..." />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn" onClick={addFrage}>+ Neue Frage</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 8 }}>Wird automatisch gespeichert</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', textAlign: 'center' }}>
            <p style={{ fontSize: 14 }}>Wähle links eine Subkategorie aus oder erstelle eine neue.</p>
          </div>
        )}
      </main>
    </div>
  )
}
