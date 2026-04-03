'use client'
import { Projekt, Foerderstelle } from '@/lib/types'

const FOERDERSTELLEN: Foerderstelle[] = ['FFG', 'AWS', 'SFG', 'WAW']
const FOERDERARTEN = ['', 'Einzelprojekt', 'Kooperationsprojekt', 'Innovationsscheck', 'Leitprojekt', 'Feasibility Study']

interface Props {
  projekt: Projekt
  onChange: (p: Projekt) => void
  onDelete: () => void
}

const label = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 } as const
const hint = { fontSize: 12, color: 'var(--text3)', marginBottom: 6, lineHeight: 1.5 } as const
const group = { marginBottom: 20 } as const

export default function ProjektInfo({ projekt, onChange, onDelete }: Props) {
  function update(field: keyof Projekt, value: unknown) {
    onChange({ ...projekt, [field]: value, updatedAt: new Date().toISOString() })
  }
  function toggleFoerder(f: Foerderstelle) {
    const next = projekt.foerderstellen.includes(f)
      ? projekt.foerderstellen.filter(x => x !== f)
      : [...projekt.foerderstellen, f]
    update('foerderstellen', next)
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={group}>
          <label style={label}>Branche / Technologiebereich</label>
          <input type="text" value={projekt.branche} onChange={e => update('branche', e.target.value)} placeholder="z.B. Medizintechnik, IKT" />
        </div>
        <div style={group}>
          <label style={label}>Foerderart</label>
          <select value={projekt.foerderart} onChange={e => update('foerderart', e.target.value)}>
            {FOERDERARTEN.map(f => <option key={f} value={f}>{f || '— bitte waehlen —'}</option>)}
          </select>
        </div>
      </div>
      <div style={group}>
        <label style={label}>Foerderstellen</label>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
          {FOERDERSTELLEN.map(f => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={projekt.foerderstellen.includes(f)} onChange={() => toggleFoerder(f)} />
              {f}
            </label>
          ))}
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
