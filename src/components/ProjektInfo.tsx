'use client'
import { Projekt, Foerderstelle, AppSettings } from '@/lib/types'

const FOERDERSTELLEN: Foerderstelle[] = ['FFG', 'AWS', 'SFG', 'WAW']

interface Props {
  projekt: Projekt
  settings: AppSettings
  onChange: (p: Projekt) => void
  onDelete: () => void
}

const label = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 } as const
const hint = { fontSize: 12, color: 'var(--text3)', marginBottom: 6, lineHeight: 1.5 } as const
const group = { marginBottom: 20 } as const

export default function ProjektInfo({ projekt, settings, onChange, onDelete }: Props) {
  function update(field: keyof Projekt, value: unknown) {
    onChange({ ...projekt, [field]: value, updatedAt: new Date().toISOString() })
  }

  function getSubsForStelle(stelle: Foerderstelle) {
    return settings.foerderstellen.find(f => f.stelle === stelle)?.subkategorien ?? []
  }

  function toggleFoerder(f: Foerderstelle) {
    const isSelected = projekt.foerderstellen.includes(f)
    const nextStellen = isSelected
      ? projekt.foerderstellen.filter(x => x !== f)
      : [...projekt.foerderstellen, f]
    const nextSub = { ...(projekt.foerderstellenSubkategorien ?? {}) }
    if (isSelected) delete nextSub[f]
    onChange({ ...projekt, foerderstellen: nextStellen, foerderstellenSubkategorien: nextSub, updatedAt: new Date().toISOString() })
  }

  function toggleSubkategorie(stelle: Foerderstelle, id: string) {
    const current = (projekt.foerderstellenSubkategorien ?? {})[stelle] ?? []
    const next = current.includes(id) ? current.filter(s => s !== id) : [...current, id]
    update('foerderstellenSubkategorien', { ...(projekt.foerderstellenSubkategorien ?? {}), [stelle]: next })
  }

  return (
    <div style={{ maxWidth: 740 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={group}>
          <label style={label}>Projektname</label>
          <input type="text" value={projekt.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div style={group}>
          <label style={label}>Unternehmen</label>
          <input type="text" value={projekt.company} onChange={e => update('company', e.target.value)} />
        </div>
      </div>
      <div style={group}>
        <label style={label}>Branche / Technologiebereich</label>
        <input type="text" value={projekt.branche} onChange={e => update('branche', e.target.value)} placeholder="z.B. Medizintechnik, IKT" />
      </div>
      <div style={group}>
        <label style={label}>Foerderstellen</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {FOERDERSTELLEN.map(f => {
            const subs = getSubsForStelle(f)
            return (
              <div key={f}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={projekt.foerderstellen.includes(f)} onChange={() => toggleFoerder(f)} />
                  {f}
                </label>
                {projekt.foerderstellen.includes(f) && subs.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, marginLeft: 22 }}>
                    {subs.map(sub => (
                      <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
                        <input
                          type="checkbox"
                          checked={((projekt.foerderstellenSubkategorien ?? {})[f] ?? []).includes(sub.id)}
                          onChange={() => toggleSubkategorie(f, sub.id)}
                        />
                        {sub.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '8px 0 24px' }} />
      <div style={group}>
        <label style={label}>Projektbeschreibung / Rohe Notizen</label>
        <p style={hint}>Beschreibe das Projekt, die Technologie, das Problem. Stichworte sind OK.</p>
        <textarea rows={6} value={projekt.notizen} onChange={e => update('notizen', e.target.value)} placeholder="Was wird entwickelt? Welches Problem wird geloest?" />
      </div>
      <div style={group}>
        <label style={label}>Innovationsgehalt</label>
        <p style={hint}>Was ist neu gegenueber dem Stand der Technik?</p>
        <textarea rows={4} value={projekt.innovation} onChange={e => update('innovation', e.target.value)} placeholder="Worin besteht die wissenschaftlich-technische Neuheit?" />
      </div>
      <div style={group}>
        <label style={label}>Zielmarkt / Zielgruppe</label>
        <textarea rows={3} value={projekt.zielmarkt} onChange={e => update('zielmarkt', e.target.value)} placeholder="Wer sind die Kunden? Wie gross ist der Markt?" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '0.5px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Wird automatisch gespeichert</span>
        <button className="btn btn-danger" onClick={onDelete}>Projekt loeschen</button>
      </div>
    </div>
  )
}
