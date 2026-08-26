/**
 * Speaks text in Spanish (or German) using the native Web Speech API (window.speechSynthesis).
 * Completely free, works offline, and supported natively across iOS (Safari/Siri), Android, and desktop.
 */
export function speakText(text: string, lang: 'es-ES' | 'de-DE' = 'es-ES', rate: number = 0.9): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported in this browser.');
    return;
  }

  try {
    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Clean raw text (strip HTML tags, slashes like "pequeño/a" -> "pequeño")
    let cleanText = text.replace(/<[^>]*>/g, '').split('/')[0].trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = rate; // Slightly relaxed rate for clear learning

    const playVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const targetLang = lang.split('-')[0];
      const targetVoice = voices.find(
        (v) => v.lang.startsWith(targetLang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Monica') || v.name.includes('Jorge') || v.name.includes('Paulina') || v.name.includes('Diego'))
      ) || voices.find((v) => v.lang.startsWith(targetLang));

      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      playVoice();
    } else {
      // Voices might load asynchronously on iOS Safari / Chrome
      window.speechSynthesis.onvoiceschanged = () => {
        playVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
      // Fallback immediate speak if event doesn't trigger
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.error('Error playing speech:', err);
  }
}
