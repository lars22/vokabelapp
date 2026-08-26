export function getCategoryIconName(category: string, type: string): string {
  const catLower = (category || '').toLowerCase();
  const typeLower = (type || '').toLowerCase();

  if (catLower.includes('zeit') || catLower.includes('kalender') || catLower.includes('uhr')) return 'fa-clock';
  if (catLower.includes('familie') || catLower.includes('mensch') || catLower.includes('person')) return 'fa-users';
  if (catLower.includes('ort') || catLower.includes('stadt') || catLower.includes('land') || catLower.includes('reise')) return 'fa-location-dot';
  if (catLower.includes('arbeit') || catLower.includes('beruf') || catLower.includes('schule') || catLower.includes('büro')) return 'fa-briefcase';
  if (catLower.includes('essen') || catLower.includes('trinken') || catLower.includes('küche') || catLower.includes('gastronomie')) return 'fa-utensils';
  if (catLower.includes('gesundheit') || catLower.includes('körper') || catLower.includes('medizin') || catLower.includes('gefühle')) return 'fa-heart';
  if (catLower.includes('natur') || catLower.includes('wetter') || catLower.includes('tiere') || catLower.includes('pflanzen')) return 'fa-tree';
  if (catLower.includes('haus') || catLower.includes('wohnen') || catLower.includes('gegenstand')) return 'fa-house';
  if (catLower.includes('kommunikation') || catLower.includes('sprache') || catLower.includes('dialog')) return 'fa-comments';
  if (catLower.includes('zahl') || catLower.includes('menge') || catLower.includes('geld')) return 'fa-hashtag';

  if (typeLower === 'verb') return 'fa-bolt';
  if (typeLower === 'substantiv') return 'fa-box';
  if (typeLower === 'adjektiv') return 'fa-star';
  if (typeLower === 'adverb') return 'fa-compass';
  if (typeLower === 'pronomen' || typeLower === 'präposition' || typeLower === 'konjunktion') return 'fa-layer-group';

  return 'fa-tag';
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'Verb':
      return '#6CB8E6'; // --verb-color
    case 'Substantiv':
      return '#F0A25D'; // --noun-color
    case 'Adjektiv':
      return '#7BC896'; // --adj-color
    case 'Adverb':
      return '#A855F7';
    case 'Pronomen':
      return '#EC4899';
    case 'Präposition':
      return '#14B8A6';
    case 'Konjunktion':
      return '#F43F5E';
    default:
      return '#6366F1';
  }
}
