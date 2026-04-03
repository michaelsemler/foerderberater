import { Projekt } from './types'

const KEY = 'foerderberater_projekte'

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
    foerderart: '',
    foerderstellen: [],
    notizen: '',
    innovation: '',
    zielmarkt: '',
    tasks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}
