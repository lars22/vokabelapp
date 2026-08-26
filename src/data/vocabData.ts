import { VocabItem } from "../types";
import rawData from "./spanishVocabDb.json";

export const INITIAL_VOCAB: VocabItem[] = rawData as VocabItem[];

export function generate3000VocabDatabase(): VocabItem[] {
  return INITIAL_VOCAB;
}
