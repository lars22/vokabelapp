// Italienischer Wortschatz — noch leer, wird befüllt.
//
// Format: exakt wie in vocab-es.js, ein Array von Objekten mit diesen Feldern:
//   id           eindeutige Zahl INNERHALB dieser Datei (darf sich mit IDs aus
//                vocab-es.js/vocab-fr.js überschneiden, die Sprache wird separat
//                gespeichert)
//   type         Wortart, z.B. "Verb", "Substantiv", "Adjektiv", "Pronomen",
//                "Präposition", "Adverb", "Konjunktion", "Ausruf", "Phrasen"
//   category     Gruppierung/Lektion, z.B. "Einheit 1" (frei wählbar)
//   word         das italienische Wort/die Phrase
//   translation  die deutsche Übersetzung
//   grammarNotes optional, z.B. "irr." für unregelmäßige Verben
//   importance   Zahl (1 = zuerst gelernt), steuert die Priorität neuer Karten
//   parked       false = aktiv im Lernstoff, true = ausgeblendet
//   examples     Array von Beispielsätzen: [{ "es": "<ital. Satz>", "de": "<deutsche Übersetzung>" }]
//                Der Schlüssel heißt historisch "es" (ursprünglich Spanisch),
//                bezeichnet hier aber ganz allgemein "Satz in der Zielsprache" —
//                bei Italienisch also den italienischen Satz eintragen.
//
// Beispiel:
// { "id": 1, "type": "Verb", "category": "Einheit 1", "word": "essere", "translation": "sein",
//   "grammarNotes": "irr.", "importance": 1, "parked": false,
//   "examples": [{ "es": "sono contento", "de": "ich bin zufrieden" }] }

const VOCAB_IT = [];
