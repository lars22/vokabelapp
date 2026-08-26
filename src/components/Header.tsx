import React from 'react';

interface HeaderProps {
  learnedCount: number;
  totalCount: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ learnedCount, totalCount, onOpenSettings }) => {
  return (
    <header className="flex justify-between items-center pt-4 pb-5">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-white">Vokabeln</h1>
        <div className="text-[13px] text-[#94A3B8] font-medium mt-0.5">
          {learnedCount}/{totalCount} gelernt
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="w-[42px] h-[42px] rounded-full bg-[#1E293B] border border-white/5 text-[#94A3B8] text-base cursor-pointer flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Menü öffnen"
      >
        <i className="fa-solid fa-bars"></i>
      </button>
    </header>
  );
};


