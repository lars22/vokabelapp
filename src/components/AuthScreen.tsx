import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface AuthScreenProps {
  onAuthenticated: (userId: string) => void;
  onSkip: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onSkip }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!supabase) return;
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setMessage({ text: 'Bitte E-Mail und Passwort eingeben.', isError: true });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: 'Passwort muss mind. 6 Zeichen lang sein.', isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage({ text: 'Registrierung fehlgeschlagen: ' + error.message, isError: true });
        } else if (data.user && data.session === null) {
          setMessage({
            text: 'Bitte bestätige deine E-Mail (oder deaktiviere "Confirm email" im Supabase-Dashboard).',
            isError: false,
          });
        } else if (data.user) {
          onAuthenticated(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ text: 'Anmeldung fehlgeschlagen: ' + error.message, isError: true });
        } else if (data.user) {
          onAuthenticated(data.user.id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col justify-center min-h-[80dvh] gap-5 px-1">
      <h1 className="text-center text-[28px] font-bold text-white mb-1">Vokabeln</h1>

      <div className="bg-[#1E293B] rounded-2xl p-6 flex flex-col gap-4 border border-white/5">
        <h2 className="text-[20px] font-bold text-white text-center mb-1">
          {isRegisterMode ? 'Registrieren' : 'Anmelden'}
        </h2>

        {message && (
          <div
            className={`text-[13px] p-3 rounded-xl text-center leading-relaxed ${
              message.isError
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#64748B] tracking-wide">E-MAIL</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            className="p-3.5 bg-[#0F172A] border border-white/5 rounded-xl text-white text-[15px] outline-none focus:border-[#6366F1]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#64748B] tracking-wide">PASSWORT</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mind. 6 Zeichen"
            className="p-3.5 bg-[#0F172A] border border-white/5 rounded-xl text-white text-[15px] outline-none focus:border-[#6366F1]"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 mt-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-[15px] cursor-pointer disabled:opacity-60 transition-opacity"
        >
          {isSubmitting ? 'Bitte warten…' : isRegisterMode ? 'Konto erstellen' : 'Anmelden'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(!isRegisterMode);
            setMessage(null);
          }}
          className="text-[13px] text-[#818CF8] font-semibold text-center cursor-pointer"
        >
          {isRegisterMode ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] text-[#64748B] text-center cursor-pointer mt-1"
        >
          Ohne Konto weiter (nur lokal, kein Sync)
        </button>
      </div>
    </div>
  );
};
