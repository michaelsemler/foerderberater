import { Projekt } from './types'

export function getBeschreibungPrompt(p: Projekt): string {
  return 'Du bist ein erfahrener oesterreichischer Foerderberater, spezialisiert auf FFG, AWS, SFG und WAW Foerderantraege.\n\nErstelle auf Basis folgender Projektinformationen eine strukturierte, professionelle Projektbeschreibung.\n\nGliedere in:\n1. Ausgangssituation und Problemstellung\n2. Projektziel und angestrebte Innovation\n3. Geplante Vorgehensweise und Methodik\n4. Erwartete Ergebnisse und Verwertungspotenzial\n\nProjekt: ' + p.name + '\nUnternehmen: ' + p.company + '\nBranche: ' + p.branche + '\nFoerderstellen: ' + p.foerderstellen.join(', ') + '\nProjektnotizen: ' + p.notizen + '\nInnovationsgehalt: ' + p.innovation + '\nZielmarkt: ' + p.zielmarkt
}

export function getTechnikPrompt(p: Projekt): string {
  return 'Du bist ein Experte fuer oesterreichische F&E Foerderungen und Technologiebewertung.\n\nErstelle eine wissenschaftlich fundierte Analyse des aktuellen Stands der Technik. Die Analyse soll:\n- Den wissenschaftlich-technischen Hintergrund beschreiben\n- Relevante bestehende Technologien nennen\n- Defizite im Stand der Technik aufzeigen\n- Den Innovationsvorsprung des Projekts herausarbeiten\n\nProjekt: ' + p.name + '\nBeschreibung: ' + p.notizen + '\nInnovation: ' + p.innovation + '\nBranche: ' + p.branche
}

export function getMarktPrompt(p: Projekt): string {
  return 'Du bist ein Foerderberater mit Expertise in Marktanalyse fuer oesterreichische Foerderprogramme.\n\nErstelle eine strukturierte Marktanalyse:\n1. Relevante Maerkte und Marktsegmente\n2. Marktgroesse und -potenzial\n3. Wichtigste Wettbewerber\n4. Alleinstellungsmerkmale des Projekts\n5. Markteintrittsstrategie\n\nProjekt: ' + p.name + '\nProdukt/Loesung: ' + p.notizen + '\nZielmarkt: ' + p.zielmarkt + '\nBranche: ' + p.branche
}

export function getValidatorPrompt(p: Projekt, outputs: string): string {
  return 'Du bist ein erfahrener Gutachter fuer oesterreichische Foerderantraege (FFG, AWS, SFG, WAW).\n\nAnalysiere folgende Texte und gib eine Qualitaetsbewertung.\n\nAntworte NUR als JSON (kein Markdown, kein Text davor oder danach):\n{"score": <0-100>, "feedback": [{"type": "pos", "text": "..."}, {"type": "neg", "text": "..."}, {"type": "neu", "text": "..."}]}\n\nGib mindestens 4-6 konkrete Feedback-Punkte.\n\nProjekt: ' + p.name + '\nFoerderstellen: ' + p.foerderstellen.join(', ') + '\n\n' + outputs
}

export function getFragenExtraktionPrompt(text: string): string {
  return 'Du bist ein Experte fuer oesterreichische Foerderantraege.\n\nAnalysiere folgenden Text und extrahiere alle Fragen oder Abschnitte, die in einem Foerderantrag beantwortet werden muessen.\n\nAntworte NUR als JSON-Array (kein Markdown, kein Text davor oder danach):\n[{"frage": "..."}, {"frage": "..."}, ...]\n\nText:\n' + text
}
