export type Foerderstelle = 'FFG' | 'AWS' | 'SFG' | 'WAW'

export interface FrageTemplate {
  id: string
  frage: string
  prompt: string
  schablone: string
}

export interface Subkategorie {
  id: string
  name: string
  richtlinien: string
  dokumente: string
  businessplanText: string
  businessplanUrl?: string
  fragen: FrageTemplate[]
}

export interface FoerderstelleConfig {
  stelle: Foerderstelle
  subkategorien: Subkategorie[]
}

export interface AppSettings {
  foerderstellen: FoerderstelleConfig[]
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
