export type Foerderstelle = 'FFG' | 'AWS' | 'SFG' | 'WAW'

export const FOERDERSTELLEN_SUBKATEGORIEN: Partial<Record<Foerderstelle, string[]>> = {
  FFG: ['Kleinprojekt', 'Basisprogramm'],
  AWS: ['Pre-Seed', 'Seed'],
}

export interface TaskResult {
  status: 'idle' | 'running' | 'done' | 'error'
  output?: string
  updatedAt?: string
}

export interface ValidatorResult {
  score: number
  feedback: { type: 'pos' | 'neg' | 'neu'; text: string }[]
  updatedAt?: string
}

export interface Projekt {
  id: string
  name: string
  company: string
  branche: string
  foerderart: string
  foerderstellen: Foerderstelle[]
  foerderstellenSubkategorien: Partial<Record<Foerderstelle, string[]>>
  notizen: string
  innovation: string
  zielmarkt: string
  tasks: {
    beschreibung?: TaskResult
    technik?: TaskResult
    markt?: TaskResult
  }
  validator?: ValidatorResult
  createdAt: string
  updatedAt: string
}
