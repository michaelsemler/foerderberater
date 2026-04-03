'use client'
import { useState, useEffect } from 'react'
import { Projekt, Foerderstelle, FOERDERSTELLEN_SUBKATEGORIEN } from '@/lib/types'
import { loadProjekte, saveProjekt, deleteProjekt, newProjekt } from '@/lib/storage'
import ProjektInfo from './ProjektInfo'
import KITasks from './KITasks'
import Validator from './Validator'

const FOERDERSTELLEN: Foerderstelle[] = ['FFG', 'AWS', 'SFG', 'WAW']

const BADGE: Record<Foerderstelle, string> = {
  FFG: 'badge-blue', AWS: 'badge-green', SFG: 'badge-amber', WAW: 'badge-purple'
}

export default function FoerderberaterApp() {
  const [projekte, setProjekte] = useState<Projekt[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tab, setTab] = useState<'info' | 'tasks' | 'validator'>('info')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newFoerder, setNewFoerder] = useState<Foerderstelle[]>([])
  const [newSubkategorien, setNewSubkategorien] = useState<Partial<Record<Foerderstelle, string[]>>>({})

  useEffect(() => {
    const data = loadProjekte()
    setProjekte(data)
    if (data.length > 0) setActiveId(data[0].id)
  }, [])

  const aktiv = projekte.find(p => p.id === activeId) ?? null

  function updateProjekt(updated: Projekt) {
    setProjekte(prev => prev.map(p => p.id === updated.id ? updated : p))
    saveProjekt(updated)
  }

  function handleCreate() {
    if (!newName.trim()) return
    const p = newProjekt({ name: newName.trim(), company: newCompany.trim(), foerderstellen: newFoerder, foerderstellenSubkategorien: newSubkategorien })
    setProjekte(prev => [...prev, p])
    saveProjekt(p)
    setActiveId(p.id)
    setTab('info')
    setShowModal(false)
    setNewName('')
    setNewCompany('')
    setNewFoerder([])
    setNewSubkategorien({})
  }

  function handleDelete(id: string) {
    if (!confirm('Projekt wirklich loeschen?')) return
    deleteProjekt(id)
    setProjekte(prev => {
      const next = prev.filter(p => p.id !== id)
      setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  function toggleFoerder(f: Foerderstelle) {
    setNewFoerder(prev => {
      const isSelected = prev.includes(f)
      if (isSelected) {
        setNewSubkategorien(s => { const next = { ...s }; delete next[f]; return next })
      }
      return isSelected ? prev.filter(x => x !== f) : [...prev, f]
    })
  }

  function toggleModalSubkategorie(stelle: Foerderstelle, sub: string) {
    setNewSubkategorien(prev => {
      const current = prev[stelle] ?? []
      const next = current.includes(sub) ? current.filter(s => s !== sub) : [...current, sub]
      return { ...prev, [stelle]: next }
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', borderRight: '0.5px solid var(--border)', background: 'var(--bg2)' }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>Foerderberater Portal</span>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {projekte.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '24px 8px' }}>Noch keine Projekte</p>}
          {projekte.map(p => (
            <button key={p.id} onClick={() => { setActiveId(p.id); setTab('info') }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--radius)', border: p.id === activeId ? '0.5px solid var(--border2)' : '0.5px solid transparent', background: p.id === activeId ? 'var(--bg)' : 'transparent', color: 'var(--text)', cursor: 'pointer', marginBottom: 2 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {p.company || '—'} · {p.foerderstellen.map(f => {
                  const subs = p.foerderstellenSubkategorien?.[f] ?? []
                  return subs.length > 0 ? `${f} (${subs.join(', ')})` : f
                }).join(', ') || 'keine'}
              </span>
            </button>
          ))}
        </nav>
        <button onClick={() => setShowModal(true)}
          style={{ margin: 8, padding: '10px 12px', border: '0.5px dashed var(--border2)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
          + Neues Projekt
        </button>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!aktiv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', textAlign: 'center', padding: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Willkommen im Foerderberater Portal</h2>
            <p style={{ fontSize: 14, marginBottom: 16 }}>Erstelle ein neues Projekt oder waehle eines aus der Liste.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Erstes Projekt anlegen</button>
          </div>
        ) : (
          <>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '0.5px solid var(--border)', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 17, fontWeight: 500 }}>{aktiv.name}</h1>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {aktiv.foerderstellen.map(f => {
                    const subs = aktiv.foerderstellenSubkategorien?.[f] ?? []
                    return (
                      <span key={f} className={'badge ' + BADGE[f]}>
                        {f}{subs.length > 0 ? ` · ${subs.join(', ')}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', padding: 3, borderRadius: 'var(--radius)', border: '0.5px solid var(--border)' }}>
                {(['info', 'tasks', 'validator'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: tab === t ? '0.5px solid var(--border)' : 'none', background: tab === t ? 'var(--bg)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text2)', fontWeight: tab === t ? 500 : 400, fontSize: 13, cursor: 'pointer' }}>
                    {t === 'info' ? 'Projektinfo' : t === 'tasks' ? 'KI-Tasks' : 'Validator'}
                  </button>
                ))}
              </div>
            </header>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {tab === 'info' && <ProjektInfo projekt={aktiv} onChange={updateProjekt} onDelete={() => handleDelete(aktiv.id)} />}
              {tab === 'tasks' && <KITasks projekt={aktiv} onChange={updateProjekt} />}
              {tab === 'validator' && <Validator projekt={aktiv} onChange={updateProjekt} />}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 24, width: 460, maxWidth: '95vw' }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Neues Projekt anlegen</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Projektname *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="z.B. KI-gestuetztes Diagnosesystem" autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Unternehmen</label>
              <input type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Firmenname GmbH" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Foerderstellen</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FOERDERSTELLEN.map(f => (
                  <div key={f}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newFoerder.includes(f)} onChange={() => toggleFoerder(f)} />
                      {f}
                    </label>
                    {newFoerder.includes(f) && FOERDERSTELLEN_SUBKATEGORIEN[f] && (
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 5, marginLeft: 22 }}>
                        {FOERDERSTELLEN_SUBKATEGORIEN[f]!.map(sub => (
                          <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
                            <input
                              type="checkbox"
                              checked={(newSubkategorien[f] ?? []).includes(sub)}
                              onChange={() => toggleModalSubkategorie(f, sub)}
                            />
                            {sub}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Anlegen</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
        .badge-blue { background: var(--blue-bg); color: var(--blue-text); }
        .badge-green { background: var(--green-bg); color: var(--green-text); }
        .badge-amber { background: var(--amber-bg); color: var(--amber-text); }
        .badge-purple { background: var(--purple-bg); color: var(--purple-text); }
      `}</style>
    </div>
  )
}
