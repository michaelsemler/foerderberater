import { Projekt, AppSettings, Foerderstelle } from './types'

const KEY = 'foerderberater_projekte'
const SETTINGS_KEY = 'foerderberater_settings'

// IDs match previous subcategory names for backward compatibility
const DEFAULT_SETTINGS: AppSettings = {
  foerderstellen: [
    {
      stelle: 'FFG',
      subkategorien: [
        { id: 'Kleinprojekt', name: 'Kleinprojekt', richtlinien: '', dokumente: '', businessplanText: '', fragen: [] },
        { id: 'Basisprogramm', name: 'Basisprogramm', richtlinien: '', dokumente: '', businessplanText: '', fragen: [] },
      ],
    },
    {
      stelle: 'AWS',
      subkategorien: [
        { id: 'Pre-Seed', name: 'Pre-Seed', richtlinien: '', dokumente: '', businessplanText: '', fragen: [] },
        { id: 'Seed', name: 'Seed', richtlinien: '', dokumente: '', businessplanText: '', fragen: [] },
      ],
    },
    { stelle: 'SFG', subkategorien: [] },
    { stelle: 'WAW', subkategorien: [] },
  ],
}

export function loadProjekte(): Projekt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveProjekte(projekte: Projekt[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(projekte))
}

export function saveProjekt(projekt: Projekt) {
  const all = loadProjekte()
  const idx = all.findIndex(p => p.id === projekt.id)
  if (idx >= 0) all[idx] = projekt
  else all.push(projekt)
  saveProjekte(all)
}

export function deleteProjekt(id: string) {
  const all = loadProjekte().filter(p => p.id !== id)
  saveProjekte(all)
}

export function newProjekt(partial: Partial<Projekt>): Projekt {
  return {
    id: 'proj_' + Date.now(),
    name: '',
    company: '',
    branche: '',
    foerderstellen: [],
    foerderstellenSubkategorien: {},
    notizen: '',
    innovation: '',
    zielmarkt: '',
    tasks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as AppSettings
    const stellen: Foerderstelle[] = ['FFG', 'AWS', 'SFG', 'WAW']
    for (const stelle of stellen) {
      if (!parsed.foerderstellen.find(f => f.stelle === stelle)) {
        const def = DEFAULT_SETTINGS.foerderstellen.find(f => f.stelle === stelle)!
        parsed.foerderstellen.push(def)
      }
    }
    return parsed
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
