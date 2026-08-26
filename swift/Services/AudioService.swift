import Foundation
import AVFoundation
#if canImport(UIKit)
import UIKit
#endif

public final class AudioService: NSObject, AVSpeechSynthesizerDelegate {
    public static let shared = AudioService()
    
    private let synthesizer = AVSpeechSynthesizer()
    private var spanishVoice: AVSpeechSynthesisVoice?
    private var germanVoice: AVSpeechSynthesisVoice?
    
    public var speechRate: Float = AVSpeechUtteranceDefaultSpeechRate * 0.95
    public var speechPitch: Float = 1.0
    
    private override init() {
        super.init()
        self.synthesizer.delegate = self
        
        // Suche beste Stimmen für Spanisch (Spanien / Lateinamerika)
        self.spanishVoice = AVSpeechSynthesisVoice(language: "es-ES") 
            ?? AVSpeechSynthesisVoice(language: "es-MX")
            ?? AVSpeechSynthesisVoice(language: "es")
            
        self.germanVoice = AVSpeechSynthesisVoice(language: "de-DE") 
            ?? AVSpeechSynthesisVoice(language: "de")
    }
    
    /// Sprich ein spanisches Wort oder Beispielsatz aus
    public func speakSpanish(_ text: String) {
        speak(text: text, voice: spanishVoice)
    }
    
    /// Sprich deutsche Übersetzung aus
    public func speakGerman(_ text: String) {
        speak(text: text, voice: germanVoice)
    }
    
    private func speak(text: String, voice: AVSpeechSynthesisVoice?) {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice
        utterance.rate = speechRate
        utterance.pitchMultiplier = speechPitch
        utterance.preUtteranceDelay = 0.05
        
        synthesizer.speak(utterance)
    }
    
    /// Haptisches Feedback für Benutzer-Interaktionen
    public func triggerHapticFeedback(type: HapticType) {
        #if canImport(UIKit)
        switch type {
        case .light:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .medium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case .warning:
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case .error:
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
        #endif
    }
    
    public enum HapticType {
        case light
        case medium
        case success
        case warning
        case error
    }
}
