import React from 'react';

/**
 * Highlights the target word (or root word/conjugation/inflection) in an example sentence
 * with a high-visibility purple badge and underline.
 */
export function highlightWordInSentence(sentence: string, targetWord: string): React.ReactNode {
  if (!sentence || !targetWord) return sentence;

  // Clean raw word: e.g. "pequeño/a" -> "pequeño", "bueno/a" -> "bueno"
  const rawClean = targetWord.split('/')[0].trim();

  // Extract root word without article: "la comida" -> "comida", "el coche" -> "coche"
  const rootWord = rawClean.replace(/^(el|la|los|las|un|una)\s+/i, '').trim().toLowerCase();

  if (!rootWord) return sentence;

  // Build candidate search terms
  const candidates: string[] = [rawClean.toLowerCase(), rootWord];

  // Adjective & Noun gender/plural variations (e.g. frío -> fría, pequeño -> pequeña, amigo -> amigos)
  if (rootWord.length >= 3 && /[oa](s)?$/i.test(rootWord)) {
    const stem = rootWord.replace(/[oa](s)?$/i, '');
    candidates.push(`${stem}[oas](s)?`);
  } else if (rootWord.length >= 3) {
    // Plural forms ending in -s or -es (e.g. ciudad -> ciudades, flor -> flores)
    candidates.push(`${rootWord}(s|es)?`);
  }

  // Verb stem variations (e.g. hablar -> habl-, comer -> com-, vivir -> viv-)
  if (rootWord.length >= 4 && /(ar|er|ir)$/i.test(rootWord)) {
    const stem = rootWord.replace(/(ar|er|ir)$/i, '');
    if (stem.length >= 2) {
      candidates.push(`${stem}[a-záéíóúñ]*`);
    }
  }

  // Irregular verb forms mapping
  const irregulars: Record<string, string[]> = {
    ser: ['soy', 'eres', 'es', 'somos', 'sois', 'son', 'era'],
    estar: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen', 'tuvo'],
    ir: ['voy', 'vas', 'va', 'vamos', 'vais', 'van', 'fui', 'fue'],
    hacer: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen', 'hizo'],
    poder: ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden', 'pudo'],
    decir: ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen', 'dime', 'dio'],
    querer: ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'],
    saber: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
    dar: ['doy', 'das', 'da', 'damos', 'dais', 'dan', 'dio', 'dame'],
    ver: ['veo', 'ves', 've', 'vemos', 'veis', 'ven', 'vio'],
    dormir: ['duermo', 'duermes', 'duerme', 'dormimos', 'duermen'],
    llegar: ['llegué', 'llega', 'llegamos', 'llegaron', 'llegué'],
  };

  if (irregulars[rootWord]) {
    candidates.push(...irregulars[rootWord]);
  }

  // Build combined regex pattern
  const regexPatterns = candidates.map((c) => {
    if (c.includes('[') || c.includes('*') || c.includes('(')) return c;
    return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const fullPattern = `\\b(${regexPatterns.join('|')})\\b`;

  try {
    const regex = new RegExp(fullPattern, 'gi');
    const parts = sentence.split(regex);

    if (parts.length === 1) {
      // Fallback: simple case-insensitive match
      const simpleEsc = rootWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const simpleRegex = new RegExp(`(${simpleEsc})`, 'gi');
      const simpleParts = sentence.split(simpleRegex);
      if (simpleParts.length === 1) return sentence;

      return simpleParts.map((part, index) =>
        simpleRegex.test(part) ? (
          <span
            key={index}
            className="text-[#818CF8] font-extrabold underline decoration-[#6366F1] decoration-2 underline-offset-4 bg-[#6366F1]/20 px-1.5 py-0.5 rounded-md inline-block my-0.5"
          >
            {part}
          </span>
        ) : (
          part
        )
      );
    }

    return parts.map((part, index) => {
      const isMatch = regex.test(part);
      regex.lastIndex = 0; // Reset state for test()

      return isMatch ? (
        <span
          key={index}
          className="text-[#818CF8] font-extrabold underline decoration-[#6366F1] decoration-2 underline-offset-4 bg-[#6366F1]/20 px-1.5 py-0.5 rounded-md inline-block my-0.5"
        >
          {part}
        </span>
      ) : (
        part
      );
    });
  } catch {
    return sentence;
  }
}

const GERMAN_INDICATORS = new Set([
  'der', 'die', 'das', 'dem', 'den', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
  'und', 'oder', 'aber', 'denn', 'doch', 'nicht', 'kein', 'keine', 'keinen', 'ist', 'sind', 'war',
  'wird', 'werden', 'wurde', 'hat', 'haben', 'hatte', 'mit', 'von', 'aus', 'bei', 'nach', 'zu',
  'zum', 'zur', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen', 'durch', 'für', 'gegen',
  'ohne', 'um', 'wörtl', 'wörtlich', 'bedeutet', 'bedeutung', 'heißt', 'sprichwort', 'redewendung',
  'achtung', 'beachte', 'unterscheide', 'vorsicht', 'hinweis', 'tipp', 'anm', 'mem', 'engl',
  'funktion', 'verwendung', 'konstruktion', 'beispiel', 'beispiele', 'siehe', 'etwa', 'also',
  'auch', 'schon', 'sehr', 'viel', 'viele', 'etwas', 'nichts', 'jemand', 'niemand', 'wenn', 'dass',
  'weil', 'obwohl', 'damit', 'falls', 'wie', 'als', 'so', 'dann', 'da', 'hier', 'dort', 'immer',
  'nie', 'oft', 'manchmal', 'selten', 'bereits', 'noch', 'wieder', 'nur', 'ganz', 'gar', 'selbst',
  'man', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich', 'uns', 'euch',
  'klar', 'berühmt', 'haus', 'stunden', 'essensstunden', 'stunde', 'wichtig', 'später', 'früher'
]);

/**
 * Validates that a string is a genuine Spanish sentence and not a German note or spoiler translation.
 */
export function isValidSpanishSentence(sentence?: string): boolean {
  if (!sentence) return false;
  const lower = sentence.toLowerCase().trim();
  if (lower.length < 5) return false;

  // German hint prefixes
  if (
    lower.startsWith('wörtl') ||
    lower.startsWith('mem') ||
    lower.startsWith('anm') ||
    lower.startsWith('tipp') ||
    lower.startsWith('oder:') ||
    lower.startsWith('auch:') ||
    lower.startsWith('beachte') ||
    lower.startsWith('achtung') ||
    lower.startsWith('hinweis') ||
    lower.startsWith('siehe') ||
    lower.startsWith('refrain') ||
    lower.startsWith('bissig') ||
    lower.startsWith('unter verwendung') ||
    lower.startsWith('si-satz')
  ) {
    return false;
  }

  const words = lower.split(/[^a-zäöüß]+/).filter((w) => w.length > 1);
  let germanWordCount = 0;
  for (const w of words) {
    if (GERMAN_INDICATORS.has(w)) {
      germanWordCount++;
    }
  }

  if (germanWordCount >= 2) return false;
  if (words.length > 0 && germanWordCount / words.length > 0.12) return false;

  return true;
}


