'use client'
import { useState } from 'react'
import { Projekt } from '@/lib/types'

interface Props {
  projekt: Projekt
  onChange: (p: Projekt) => void
}

export default function Validator({ projekt, onChange }: Props) {
  const [running, setRunning] = useState(false)
  const val = projekt.validator

  async function runValidator() {
    const doneOutputs = Object.entries(projekt.tasks)
      .filter(([, v]) => v?.status === 'done' && v.output)
      .map(([k, v]) => {
        const labels: Record<string, string> = { beschreibung: 'PROJEKTBESCHREIBUNG', technik: 'STAND DER TECHNIK', markt: 'MARKTANALYSE' }
        return '### ' + (labels[k] || k.toUpperCase()) + '\n' + v!.output
      })
      .join('\n\n---\n\n')

    if (!doneOutputs) {
      alert('Bitte zuerst mindestens einen KI-Task erfolgreich ausfuehren.')
      return
    }
    setRunning(true)
    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'validator', projekt, outputs: doneOutputs }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const clean = data.text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      onChange({ ...projekt, validator: { score: parsed.score, feedback: parsed.feedback || [], updatedAt: new Date().toISOString() } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler'
      onChange({ ...projekt, validator: { score: 0, feedback: [{ type: 'neg', text: 'Validator-Fehler: ' + msg }] } })
    } finally {
      setRunning(false)
    }
  }

  const scoreColor = val?.score !== undefined
    ? val.score >= 75 ? 'var(--green)' : val.score >= 50 ? 'var(--amber)' : '#A32D2D'
    : 'var(--text)'

  const FEEDBACK_STYLE: Record<string, React.CSSProperties> = {
    pos: { background: 'var(--green-bg)', color: 'var(--green-text)', borderLeft: '3px solid #639922' },
    neg: { background: 'var(--red-bg)', color: 'var(--red-text)', borderLeft: '3px solid #E24B4A' },
    neu: { background: 'var(--blue-bg)', color: 'var(--blue-text)', borderLeft: '3px solid #378ADD' },
  }

  return (
    <div style={{ maxWidth: 740 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>Qualitaetscheck</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Der Validator bewertet deine KI-Task-Outputs auf Foerderreife (FFG, AWS, SFG, WAW).</p>
        </div>
        <button className="btn btn-primary" onClick={runValidator} disabled={running}>{running ? 'Analyse laeuft...' : 'Validator starten'}</button>
      </div>

      {running && (
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>Analyse der generierten Texte laeuft...</div>
          <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', background: 'var(--blue)', borderRadius: 2, animation: 'slide 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {val && !running && (
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 }}>
            <span style={{ fontSize: 36, fontWeight: 600, color: scoreColor }}>{val.score}/100</span>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>
              {val.score >= 75 ? 'Sehr gut — foerderreif' : val.score >= 50 ? 'Akzeptabel — Nacharbeit empfohlen' : 'Ueberarbeitung erforderlich'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {val.feedback.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 13, lineHeight: 1.6, ...FEEDBACK_STYLE[f.type] }}>
                <span style={{ flexShrink: 0, fontWeight: 600, width: 14 }}>{f.type === 'pos' ? '+' : f.type === 'neg' ? '-' : '>'}</span>
                {f.text}
              </div>
            ))}
          </div>
          {val.updatedAt && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14 }}>Geprueft: {new Date(val.updatedAt).toLocaleString('de-AT')}</div>}
        </div>
      )}

      {!val && !running && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14, border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          Fuehre zuerst die KI-Tasks aus, dann starte den Validator zur Qualitaetspruefung.
        </div>
      )}
      <style>{`@keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }`}</style>
    </div>
  )
}
