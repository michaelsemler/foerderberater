'use client'
import { useState } from 'react'
import { Projekt, TaskResult } from '@/lib/types'

type TaskKey = 'beschreibung' | 'technik' | 'markt'

const TASK_INFO: Record<TaskKey, { title: string; desc: string }> = {
  beschreibung: { title: 'Projektbeschreibung', desc: 'Strukturierte Beschreibung fuer Foerderantraege (Ausgangssituation, Ziel, Methodik, Ergebnisse)' },
  technik: { title: 'Stand der Technik', desc: 'Wissenschaftliche Analyse des aktuellen Stands der Technik und Innovationsvorsprung' },
  markt: { title: 'Marktanalyse', desc: 'Marktgroesse, Wettbewerbsanalyse und Alleinstellungsmerkmale' },
}

interface Props {
  projekt: Projekt
  onChange: (p: Projekt) => void
}

const STATUS_LABEL: Record<string, string> = { idle: 'Bereit', running: 'Laeuft...', done: 'Fertig', error: 'Fehler' }
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  idle: { background: 'var(--bg2)', color: 'var(--text2)' },
  running: { background: 'var(--blue-bg)', color: 'var(--blue-text)' },
  done: { background: 'var(--green-bg)', color: 'var(--green-text)' },
  error: { background: 'var(--red-bg)', color: 'var(--red-text)' },
}

export default function KITasks({ projekt, onChange }: Props) {
  const [running, setRunning] = useState<Record<string, boolean>>({})

  async function runTask(key: TaskKey) {
    if (!projekt.notizen.trim()) {
      alert('Bitte zuerst Projektnotizen unter Projektinfo eintragen.')
      return
    }
    setRunning(r => ({ ...r, [key]: true }))
    const snap = { ...projekt, tasks: { ...projekt.tasks, [key]: { status: 'running' } as TaskResult } }
    onChange(snap)
    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: key, projekt }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onChange({ ...snap, tasks: { ...snap.tasks, [key]: { status: 'done', output: data.text, updatedAt: new Date().toISOString() } as TaskResult } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler'
      onChange({ ...snap, tasks: { ...snap.tasks, [key]: { status: 'error', output: 'Fehler: ' + msg } as TaskResult } })
    } finally {
      setRunning(r => ({ ...r, [key]: false }))
    }
  }

  async function runAll() {
    for (const key of ['beschreibung', 'technik', 'markt'] as TaskKey[]) {
      await runTask(key)
    }
  }

  const anyRunning = Object.values(running).some(Boolean)

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>KI-Tasks generieren Foerderantragstexte auf Basis deiner Projektinformationen.</p>
        <button className="btn btn-primary" onClick={runAll} disabled={anyRunning}>{anyRunning ? 'Laeuft...' : 'Alle Tasks ausfuehren'}</button>
      </div>
      {(['beschreibung', 'technik', 'markt'] as TaskKey[]).map(key => {
        const info = TASK_INFO[key]
        const task = projekt.tasks[key]
        const isRunning = running[key]
        const statusKey = isRunning ? 'running' : (task?.status || 'idle')
        return (
          <div key={key} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{info.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{info.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', ...STATUS_STYLE[statusKey] }}>{STATUS_LABEL[statusKey]}</span>
                <button className="btn" onClick={() => runTask(key)} disabled={isRunning || anyRunning}>{isRunning ? 'Laeuft...' : 'Ausfuehren'}</button>
              </div>
            </div>
            {isRunning && (
              <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginTop: 14 }}>
                <div style={{ height: '100%', width: '40%', background: 'var(--blue)', borderRadius: 2, animation: 'slide 1.4s ease-in-out infinite' }} />
              </div>
            )}
            {task?.output && (
              <div style={{ marginTop: 14, padding: 14, background: task.status === 'error' ? 'var(--red-bg)' : 'var(--bg2)', borderRadius: 'var(--radius)', fontSize: 13, lineHeight: 1.7, color: task.status === 'error' ? 'var(--red-text)' : 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto', border: '0.5px solid var(--border)' }}>
                {task.output}
              </div>
            )}
            {task?.updatedAt && task.status === 'done' && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Generiert: {new Date(task.updatedAt).toLocaleString('de-AT')}</div>
            )}
          </div>
        )
      })}
      <style>{`@keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }`}</style>
    </div>
  )
}
