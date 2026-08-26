export interface ForestTier {
  id: string;
  tierNumber: number;
  minWords: number;
  maxWords: number;
  nameEs: string;
  nameDe: string;
  icon: string;
  accentColor: string;
  unlockedVegetation: string[];
  description: string;
  floraHighlights: {
    nameEs: string;
    nameDe: string;
    type: 'tree' | 'flower' | 'bush' | 'special';
    icon: string;
    description: string;
  }[];
}

export interface TreeSpecies {
  id: string;
  nameEs: string;
  nameDe: string;
  icon: string;
  accentColor: string;
  leafColor: number;
  fruitColor?: number;
  modelType: 'pine' | 'apple' | 'orange' | 'birch' | 'olive' | 'jacaranda' | 'cherry' | 'sunflower' | 'secuoya' | 'golden';
  costCoins: number;
  minLearnedWords: number;
  description: string;
  quoteEs: string;
}

export interface FocusTag {
  id: string;
  nameEs: string;
  nameDe: string;
  color: string;
  icon: string;
}

export interface PlantedTreeRecord {
  id: string;
  timestamp: number; // Date.now()
  speciesId: string;
  speciesNameEs: string;
  speciesNameDe: string;
  tagId: string;
  tagNameEs: string;
  tagColor: string;
  durationMinutes: number;
  wordsLearned: number;
  status: 'healthy' | 'withered';
  modelType: string;
  leafColor: number;
  fruitColor?: number;
  notes?: string;
  gridX?: number;
  gridZ?: number;
}

export const FOCUS_TAGS: FocusTag[] = [
  { id: 'vocabulario', nameEs: 'Vocabulario General', nameDe: 'Allgemeiner Wortschatz', color: '#10B981', icon: 'fa-book-bookmark' },
  { id: 'gramatica', nameEs: 'Gramática & Verbos', nameDe: 'Grammatik & Verben', color: '#6366F1', icon: 'fa-spell-check' },
  { id: 'repaso', nameEs: 'Repaso Rápido', nameDe: 'Schnellwiederholung', color: '#F59E0B', icon: 'fa-bolt' },
  { id: 'audio', nameEs: 'Audio & Pronunciación', nameDe: 'Hören & Sprechen', color: '#EC4899', icon: 'fa-microphone' },
  { id: 'reto', nameEs: 'Reto Diario / Sprint', nameDe: 'Tages-Challenge', color: '#38BDF8', icon: 'fa-trophy' },
];

export const TREE_SPECIES_CATALOG: TreeSpecies[] = [
  {
    id: 'pine',
    nameEs: 'Pino Piñonero',
    nameDe: 'Mediterrane Schirmpinie',
    icon: 'fa-tree',
    accentColor: '#10B981',
    leafColor: 0x065f46,
    modelType: 'pine',
    costCoins: 0, // Free Starter Tree
    minLearnedWords: 0,
    description: 'Klassische andalusische Schirmpinie mit tiefen Wurzeln und widerstandsfähigem Nadelkleid.',
    quoteEs: '¡Paso a paso se planta un gran pinar!',
  },
  {
    id: 'apple',
    nameEs: 'Manzano en Fruto',
    nameDe: 'Apfelbaum mit Früchten',
    icon: 'fa-apple-whole',
    accentColor: '#EF4444',
    leafColor: 0x15803d,
    fruitColor: 0xef4444,
    modelType: 'apple',
    costCoins: 50,
    minLearnedWords: 15,
    description: 'Trägt saftige rote Äpfel als süße Belohnung für konzentrierte Vokabel-Fokus-Sessions.',
    quoteEs: 'Cada fruto es una palabra memorizada.',
  },
  {
    id: 'orange',
    nameEs: 'Naranjo de Valencia',
    nameDe: 'Valencianischer Orangenbaum',
    icon: 'fa-lemon',
    accentColor: '#F97316',
    leafColor: 0x166534,
    fruitColor: 0xf97316,
    modelType: 'orange',
    costCoins: 100,
    minLearnedWords: 40,
    description: 'Duftender Orangenbaum aus Valencia mit leuchtend orangen Zitrusfrüchten.',
    quoteEs: 'El dulce aroma del éxito español.',
  },
  {
    id: 'sunflower',
    nameEs: 'Girasol Gigante',
    nameDe: 'Goldene Riesensonnenblume',
    icon: 'fa-sun',
    accentColor: '#FBBF24',
    leafColor: 0x15803d,
    modelType: 'sunflower',
    costCoins: 120,
    minLearnedWords: 60,
    description: 'Strahlt wie die andalusische Sommersonne und folgt dem Licht deines Lernfleißes.',
    quoteEs: 'Gira siempre hacia la luz del conocimiento.',
  },
  {
    id: 'birch',
    nameEs: 'Abedul Plateado',
    nameDe: 'Silberbirke',
    icon: 'fa-tree',
    accentColor: '#84CC16',
    leafColor: 0x84cc16,
    modelType: 'birch',
    costCoins: 150,
    minLearnedWords: 90,
    description: 'Schlanke, helle Rinde mit feinen Mustern und sanft wehenden Frühlingsblättern.',
    quoteEs: 'Elegancia y serenidad en cada minuto de estudio.',
  },
  {
    id: 'olive',
    nameEs: 'Olivo Centenario',
    nameDe: 'Knorriger Olivenbaum',
    icon: 'fa-leaf',
    accentColor: '#65A30D',
    leafColor: 0x4d7c0f,
    modelType: 'olive',
    costCoins: 250,
    minLearnedWords: 150,
    description: 'Symbol für Frieden, Weisheit und langlebige Erinnerung aus den Hügeln von Jaén.',
    quoteEs: 'Las raíces del aprendizaje son profundas e inmortales.',
  },
  {
    id: 'jacaranda',
    nameEs: 'Jacaranda Violeta',
    nameDe: 'Violetter Jacarandabaum',
    icon: 'fa-wand-magic-sparkles',
    accentColor: '#8B5CF6',
    leafColor: 0x8b5cf6,
    modelType: 'jacaranda',
    costCoins: 350,
    minLearnedWords: 250,
    description: 'Traumhaftes violettes Blütenmeer, das Sevilla und Buenos Aires im Frühling verzaubert.',
    quoteEs: 'Un manto violeta de concentración y magia.',
  },
  {
    id: 'cherry',
    nameEs: 'Cerezo del Jerte',
    nameDe: 'Rosa Kirschblütenbaum',
    icon: 'fa-spa',
    accentColor: '#F43F5E',
    leafColor: 0xf43f5e,
    modelType: 'cherry',
    costCoins: 500,
    minLearnedWords: 400,
    description: 'Prachtvolle rosa Blütenblätter aus dem Tal Valle del Jerte in der Extremadura.',
    quoteEs: 'Florece con la paciencia de un maestro.',
  },
  {
    id: 'secuoya',
    nameEs: 'Secuoya Titánica',
    nameDe: 'Mammutbaum-Riese',
    icon: 'fa-tree-city',
    accentColor: '#059669',
    leafColor: 0x047857,
    modelType: 'secuoya',
    costCoins: 800,
    minLearnedWords: 700,
    description: 'Ein monumentaler Gigant mit unzerstörbarem Stamm für unerschütterliche Ausdauer.',
    quoteEs: 'El conocimiento te eleva por encima de las nubes.',
  },
  {
    id: 'golden',
    nameEs: 'El Árbol Dorado de la Vida',
    nameDe: 'Goldener Lebensbaum (Meisterschaft)',
    icon: 'fa-crown',
    accentColor: '#F59E0B',
    leafColor: 0xf59e0b,
    modelType: 'golden',
    costCoins: 1500,
    minLearnedWords: 1000,
    description: 'Der legendäre Lebensbaum mit strahlendem Lichtstrahl und goldenen Blättern.',
    quoteEs: '¡Has alcanzado la sabiduría suprema del español!',
  },
];

export const FOREST_MOTIVATION_PHRASES = [
  '¡Mantén la concentración!',
  '¡No mires tu teléfono!',
  '¡Deja que tu árbol crezca sano y fuerte!',
  'Tu mente es un jardín: cuida cada semilla.',
  '¡Cada palabra aprendida es una hoja verde!',
  'La constancia diaria crea un gran bosque.',
  '¡Sigue adelante, lo estás haciendo genial!',
  'Respira hondo y enfócate en el español.',
  'Unos minutos de foco valen oro.',
];

export const FOREST_TIERS: ForestTier[] = [
  {
    id: 'prado_naciente',
    tierNumber: 1,
    minWords: 0,
    maxWords: 25,
    nameEs: 'El Prado Naciente',
    nameDe: 'Die sprießende Wiese',
    icon: 'fa-seedling',
    accentColor: '#10B981',
    unlockedVegetation: ['Zarte Keimlinge', 'Gänseblümchen', 'Frisches Weizengras'],
    description: 'Mit deinen ersten gelernten Vokabeln erwacht die karge Wiese zum Leben. Erste zarte Keimlinge und weiße Gänseblümchen recken sich der Sonne entgegen.',
    floraHighlights: [
      { nameEs: 'El Brote Verde', nameDe: 'Der grüne Keimling', type: 'special', icon: 'fa-seedling', description: 'Ein Zeichen für deinen ersten Schritt ins Spanische.' },
      { nameEs: 'La Margarita Silvestre', nameDe: 'Das wilde Gänseblümchen', type: 'flower', icon: 'fa-sun', description: 'Kleine weiße Blütenblätter mit goldener Mitte.' },
    ],
  },
  {
    id: 'valle_flores',
    tierNumber: 2,
    minWords: 25,
    maxWords: 75,
    nameEs: 'El Valle de Flores',
    nameDe: 'Das bunte Blumenmeer',
    icon: 'fa-spa',
    accentColor: '#EC4899',
    unlockedVegetation: ['Rote Mohnblumen', 'Spanischer Lavendel', 'Flatternde Schmetterlinge'],
    description: 'Die Wiese explodiert in einem bunten Farbteppich. Rote Mohnblumen und lila Wildblumen wiegen sich sanft im Wind.',
    floraHighlights: [
      { nameEs: 'La Amapola Roja', nameDe: 'Die rote Mohnblume', type: 'flower', icon: 'fa-spa', description: 'Leuchtend rote Blütenblätter auf andalusischen Sommerfeldern.' },
      { nameEs: 'La Lavanda Silvestre', nameDe: 'Der wilde Lavendel', type: 'flower', icon: 'fa-spa', description: 'Duftende lila Blütenähren, die Bienen und Schmetterlinge anlocken.' },
    ],
  },
  {
    id: 'bosquecillo_joven',
    tierNumber: 3,
    minWords: 75,
    maxWords: 200,
    nameEs: 'El Bosquecillo Joven',
    nameDe: 'Das junge Wäldchen & Obstbäume',
    icon: 'fa-tree',
    accentColor: '#F59E0B',
    unlockedVegetation: ['Junge Birken', 'Apfelbäume mit Früchten', 'Waldpilze'],
    description: 'Erste kräftige Holzstämme schlagen Wurzeln! Junge Obstbäume tragen rote Äpfel und Birken umrahmen den Wiesenrand.',
    floraHighlights: [
      { nameEs: 'El Manzano', nameDe: 'Der Apfelbaum', type: 'tree', icon: 'fa-apple-whole', description: 'Trägt saftige rote Früchte als Belohnung für dein Vokabeltraining.' },
      { nameEs: 'El Abedul Plateado', nameDe: 'Die Silberbirke', type: 'tree', icon: 'fa-tree', description: 'Helle weiße Rinde mit leuchtend hellgrünem Blätterdach.' },
    ],
  },
  {
    id: 'huerto_naranjos',
    tierNumber: 4,
    minWords: 200,
    maxWords: 500,
    nameEs: 'El Huerto Mediterráneo',
    nameDe: 'Der mediterrane Orangenhain',
    icon: 'fa-lemon',
    accentColor: '#F97316',
    unlockedVegetation: ['Valencianische Orangenbäume', 'Uralte Olivenbäume', 'Seerosenteich'],
    description: 'Mediterraner Duft von Orangenblüten erfüllt die Luft. Knorrige Olivenbäume schaffen eine andalusische Oase.',
    floraHighlights: [
      { nameEs: 'El Naranjo de Valencia', nameDe: 'Der Orangenbaum', type: 'tree', icon: 'fa-lemon', description: 'Reiche Ernte aus leuchtend orangen Früchten.' },
      { nameEs: 'El Olivo Centenario', nameDe: 'Der Olivenbaum', type: 'tree', icon: 'fa-leaf', description: 'Silbrig glänzende Blätter und knorriger, unvergänglicher Stamm.' },
    ],
  },
  {
    id: 'pinar_montana',
    tierNumber: 5,
    minWords: 500,
    maxWords: 1000,
    nameEs: 'El Pinar de las Cumbres',
    nameDe: 'Der andalusische Pinienwald',
    icon: 'fa-tree-city',
    accentColor: '#059669',
    unlockedVegetation: ['Schirmpinien', 'Waldpilze', 'Seerosenteich'],
    description: 'Majestätische Schirmpinien wachsen in den Himmel. Zwischen den Moospolstern sprießen Waldpilze und ein klarer Seerosenteich spiegelt die Wolken wider.',
    floraHighlights: [
      { nameEs: 'El Pino Piñonero', nameDe: 'Die Schirmpinie', type: 'tree', icon: 'fa-tree', description: 'Ikonische mediterrane Schirmkrone, die weiten Schatten spendet.' },
      { nameEs: 'El Estanque de Nenúfares', nameDe: 'Der Seerosenteich', type: 'special', icon: 'fa-water', description: 'Kristallklares Wasser mit schwimmenden Seerosenblüten.' },
    ],
  },
  {
    id: 'robledal_ancestral',
    tierNumber: 6,
    minWords: 1000,
    maxWords: 1800,
    nameEs: 'El Robledal Ancestral',
    nameDe: 'Der uralte Eichenhain',
    icon: 'fa-shield-halved',
    accentColor: '#0D9488',
    unlockedVegetation: ['Hundertjährige Eichen', 'Farnwälder', 'Moosfelsen'],
    description: 'Dichte, mächtige Eichen mit riesigen Kronen spenden kühlen Schatten.',
    floraHighlights: [
      { nameEs: 'El Roble Centenario', nameDe: 'Die uralte Eiche', type: 'tree', icon: 'fa-tree', description: 'Symbol für Ausdauer und unerschütterliches Sprachwissen.' },
    ],
  },
  {
    id: 'valle_jacarandas',
    tierNumber: 7,
    minWords: 1800,
    maxWords: 3000,
    nameEs: 'El Valle de Jacarandas',
    nameDe: 'Das lila Jacaranda-Paradies',
    icon: 'fa-wand-magic-sparkles',
    accentColor: '#8B5CF6',
    unlockedVegetation: ['Violette Jacarandabäume', 'Glühwürmchen bei Nacht'],
    description: 'Ein magischer Anblick: Strahlend violette Jacaranda-Blütenbäume hüllen den Wald in ein zauberhaftes lila Licht.',
    floraHighlights: [
      { nameEs: 'La Jacaranda Violeta', nameDe: 'Der Jacarandabaum', type: 'tree', icon: 'fa-tree', description: 'Atemberaubende violette Blütenwolken.' },
    ],
  },
  {
    id: 'arbol_vida_dorado',
    tierNumber: 8,
    minWords: 3000,
    maxWords: 7094,
    nameEs: 'El Gran Árbol Dorado de la Vida',
    nameDe: 'Der Goldene Lebensbaum',
    icon: 'fa-trophy',
    accentColor: '#FBBF24',
    unlockedVegetation: ['Goldener Lebensbaum', 'Himmelslichtstrahl', 'Goldene Blätter'],
    description: 'Das ultimative Finale: Der legendäre Goldene Lebensbaum im Zentrum deines Waldes.',
    floraHighlights: [
      { nameEs: 'El Árbol del Conocimiento', nameDe: 'Der Lebensbaum', type: 'special', icon: 'fa-trophy', description: 'Symbol für deine Beherrschung aller Vokabeln!' },
    ],
  },
];

export interface ForestVitality {
  percentage: number;
  statusText: string;
  statusEs: string;
  color: string;
  isWithering: boolean;
  leafHealthColor: number;
  grassColor: number;
  tipMessage: string;
}

export function calculateForestVitality(daysSinceLastStudy: number = 0): ForestVitality {
  if (daysSinceLastStudy <= 0) {
    return {
      percentage: 100,
      statusText: 'In voller Pracht blühend',
      statusEs: 'Floreciendo en su máximo esplendor',
      color: '#10B981',
      isWithering: false,
      leafHealthColor: 0x15803d,
      grassColor: 0x22c55e,
      tipMessage: 'Dein Wald ist heute frisch gegossen und strotzt vor Lebenskraft!',
    };
  } else if (daysSinceLastStudy === 1) {
    return {
      percentage: 80,
      statusText: 'Vital (Gießen empfohlen)',
      statusEs: 'Saludable pero con sed ligera',
      color: '#84CC16',
      isWithering: false,
      leafHealthColor: 0x4ade80,
      grassColor: 0x65a30d,
      tipMessage: 'Gieße deinen Wald heute mit einer Lerneinheit, damit keine Blätter welken.',
    };
  } else if (daysSinceLastStudy === 2) {
    return {
      percentage: 50,
      statusText: 'Leicht trocken (Herbstlich)',
      statusEs: 'Otoñal con hojas secas',
      color: '#F59E0B',
      isWithering: true,
      leafHealthColor: 0xd97706,
      grassColor: 0xa16207,
      tipMessage: 'Die Blätter beginnen sich gelb zu färben. Trainiere jetzt, um ihn wiederzubeleben!',
    };
  } else {
    const p = Math.max(15, 40 - (daysSinceLastStudy - 3) * 10);
    return {
      percentage: p,
      statusText: 'Verdorrend / Schutzlos',
      statusEs: 'Marchito por falta de riego',
      color: '#EF4444',
      isWithering: true,
      leafHealthColor: 0x78350f,
      grassColor: 0x713f12,
      tipMessage: 'Dein Wald braucht dringend Wasser! Starte ein Vokabel-Training, um ihn aufblühen zu lassen!',
    };
  }
}

// ====================================================
// --- LOCAL STORAGE PERSISTENCE (FOREST APP ENGINE) ---
// ====================================================

const STORAGE_PLANTED_KEY = 'forest_planted_history_v2';
const STORAGE_COINS_KEY = 'forest_sunlight_coins_v1';
const STORAGE_UNLOCKED_SPECIES_KEY = 'forest_unlocked_species_v1';
const STORAGE_REAL_TREES_DONATED_KEY = 'forest_real_trees_donated_v1';

export function loadPlantedForestHistory(): PlantedTreeRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_PLANTED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load planted forest history:', e);
  }

  // Initial seed trees based on early start
  const initialHistory: PlantedTreeRecord[] = [
    {
      id: 'init_tree_1',
      timestamp: Date.now() - 86400000 * 2,
      speciesId: 'pine',
      speciesNameEs: 'Pino Piñonero',
      speciesNameDe: 'Mediterrane Schirmpinie',
      tagId: 'vocabulario',
      tagNameEs: 'Vocabulario General',
      tagColor: '#10B981',
      durationMinutes: 15,
      wordsLearned: 10,
      status: 'healthy',
      modelType: 'pine',
      leafColor: 0x065f46,
      gridX: -6,
      gridZ: -4,
    },
    {
      id: 'init_tree_2',
      timestamp: Date.now() - 86400000 * 1,
      speciesId: 'apple',
      speciesNameEs: 'Manzano en Fruto',
      speciesNameDe: 'Apfelbaum mit Früchten',
      tagId: 'repaso',
      tagNameEs: 'Repaso Rápido',
      tagColor: '#F59E0B',
      durationMinutes: 25,
      wordsLearned: 15,
      status: 'healthy',
      modelType: 'apple',
      leafColor: 0x15803d,
      fruitColor: 0xef4444,
      gridX: 6,
      gridZ: 4,
    },
  ];

  savePlantedForestHistory(initialHistory);
  return initialHistory;
}

export function savePlantedForestHistory(history: PlantedTreeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_PLANTED_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save planted forest history:', e);
  }
}

export function addPlantedTree(record: PlantedTreeRecord): PlantedTreeRecord[] {
  const current = loadPlantedForestHistory();
  const updated = [record, ...current];
  savePlantedForestHistory(updated);
  return updated;
}

export function loadForestCoins(): number {
  try {
    const saved = localStorage.getItem(STORAGE_COINS_KEY);
    if (saved) return Math.max(0, parseInt(saved, 10));
  } catch (e) {}
  return 120; // Starting welcome bonus
}

export function addForestCoins(amount: number): number {
  const current = loadForestCoins();
  const next = current + amount;
  try {
    localStorage.setItem(STORAGE_COINS_KEY, next.toString());
  } catch (e) {}
  return next;
}

export function spendForestCoins(amount: number): boolean {
  const current = loadForestCoins();
  if (current < amount) return false;
  const next = current - amount;
  try {
    localStorage.setItem(STORAGE_COINS_KEY, next.toString());
  } catch (e) {}
  return true;
}

export function loadUnlockedSpecies(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_UNLOCKED_SPECIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return ['pine', 'apple']; // Default unlocked starter species
}

export function unlockSpecies(speciesId: string): string[] {
  const current = loadUnlockedSpecies();
  if (!current.includes(speciesId)) {
    const updated = [...current, speciesId];
    try {
      localStorage.setItem(STORAGE_UNLOCKED_SPECIES_KEY, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  }
  return current;
}

export function loadRealTreesDonated(): number {
  try {
    const saved = localStorage.getItem(STORAGE_REAL_TREES_DONATED_KEY);
    if (saved) return parseInt(saved, 10);
  } catch (e) {}
  return 0;
}

export function donateToPlantRealTree(): { success: boolean; totalRealTrees: number; remainingCoins: number } {
  const REAL_TREE_COST = 2500;
  const currentCoins = loadForestCoins();
  if (currentCoins < REAL_TREE_COST) {
    return { success: false, totalRealTrees: loadRealTreesDonated(), remainingCoins: currentCoins };
  }
  spendForestCoins(REAL_TREE_COST);
  const currentDonated = loadRealTreesDonated() + 1;
  try {
    localStorage.setItem(STORAGE_REAL_TREES_DONATED_KEY, currentDonated.toString());
  } catch (e) {}
  return { success: true, totalRealTrees: currentDonated, remainingCoins: loadForestCoins() };
}

// Filter history by timeframe (Hoy / Semana / Mes / Todo)
export function filterForestHistory(
  records: PlantedTreeRecord[],
  timeframe: 'day' | 'week' | 'month' | 'year' | 'all'
): PlantedTreeRecord[] {
  const now = Date.now();
  if (timeframe === 'all' || timeframe === 'year') return records;

  if (timeframe === 'day') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return records.filter((r) => r.timestamp >= startOfToday.getTime());
  }

  if (timeframe === 'week') {
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return records.filter((r) => r.timestamp >= oneWeekAgo);
  }

  if (timeframe === 'month') {
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    return records.filter((r) => r.timestamp >= oneMonthAgo);
  }

  return records;
}
