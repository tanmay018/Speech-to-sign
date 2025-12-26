
import React from 'react';

interface HeaderProps {
  onOpenLibrary: () => void;
  onPiP?: () => void;
  isPiPActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenLibrary,
  onPiP,
  isPiPActive
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-[#f4f4f4]/50 border-b border-[#808080] backdrop-blur-md z-30">
      <div className="flex items-center gap-3">
        <img 
          src="https://github.com/tanmay018/Speech-to-sign/blob/main/logo.png?raw=true" 
          alt="Papaya Logo" 
          className="w-9 h-9 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-[#252525] font-semibold text-lg tracking-tight">Papaya</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {onPiP && (
          <button
            onClick={onPiP}
            disabled={isPiPActive}
            title="Pop Out Window"
            className={`p-2 rounded-full border transition-all duration-300 ${
              isPiPActive 
                ? 'bg-[#EA580C] text-white border-[#EA580C]' 
                : 'bg-white text-black border-[#808080] hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="14" height="14" rx="2" ry="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
              <polyline points="15 15 21 9 21 15 15 9" />
            </svg>
          </button>
        )}

        <button 
          onClick={onOpenLibrary}
          className="px-4 py-1.5 bg-[#252525] hover:bg-neutral-800 text-white text-xs font-medium rounded-full border border-transparent transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M6 2v18"/><path d="M12 11h4"/><path d="M12 7h4"/><path d="M12 15h4"/></svg>
          Manage Signs
        </button>
      </div>
    </div>
  );
};

export default Header;
