
import React from 'react';

interface HeaderProps {
  onTop: boolean;
  toggleOnTop: () => void;
  onOpenLibrary: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onTop, 
  toggleOnTop, 
  onOpenLibrary
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-[#f4f4f4]/50 border-b border-[#808080] backdrop-blur-md z-30">
      <div className="flex items-center gap-3">
        <img 
          src="https://lh3.googleusercontent.com/rd-gg-dl/ABS2GSnG1aJ2i3ARS2YQvr_RwolmCSpaTRyG2RthLqeSCyhOeYvR2Sc1IuDzOGF8GeFQukb5FC1TvDLJsXvWivldYlbRlo0SmvJx2mpO6ilGGNKX8plAXhWhEwbJzQa5la5CzGxrdOROLIB7MQ5-c_v0zTYHZCI-WasXiodJtjDEneX5I5XLE361qvyCXwOlFZCRuoaTL90xkhlwPTJB1MrD6kolux9opQuI2q4K6m4Nw_96cRjD5VmF1eW3olkYR88RK1T3Yy0llDLVSiDHYyyMbkMpiynV-LndQx2KLz2HsjVDERg-ArKaLUkcvbnnv6GhPJWS-yNmCcMgBhHp0jgSOt10KIEmLNDdMgwJisWkjfINZi60W8CkjgvzIGbLTz3JuQJzxTkhXrqgx9Ru41NbnXYwY66DNlivPOqKmiTjwYZQlLgYYZ-0LANAHjjN6NesGePSIdjsK2I5TAJ3sMCRN1FFCQ4TjWhhaby9F6Yg_xN-jqSVyj-55Zqs8G2uDe-32I9UO4ydIyMWmRpFO_1I3euBJi9ogWd_lJLCKyByuxj5Q2T3Xfvh2p6LUWwYzv7dEB008p4w0cQOJY0-SBzgGGgflVlntytAO6EcvbbJzJ6mEeSxhgmCas5mgKP0AO3qQbIGj7dWuOM3FIarRF7CA7fPAVCz75MZOzv_xRfR_6zmPHlQgJ2OWFEUbdXycerWVWW5mia49IA4uWi6KB6-70dOMC2wEG5jTyfp794IpEE9_oCzTqcfSNfl43dUvxM0J7FYDv1AKKIbFsP5hLtfUJxcWUjwgv3V0BsqiMlqqimLNcVD6kwfndXGW5xQCldpbhwPNkNksqvL-7zPlEP0SuAA36aZS9k2Dlf76_sKDBJmcrrNLrEf-iE1NHL4oHBKox22trXwMmERK9nW-rPC1UPTwwnzJq4V9W3emkzhi8I10XwCrGcBmIXk3nyNTUcWUWOFlxQPBWmlltawDJZbqDdisW7wqx0XbTy39LtFD-HtQ_uFvqn9H6P5WMfvur6JW8KUwoDlY5aonWlEjK9RrpRrig0AuOhwK0-nD7zC2t2atbJ7jlOIFvl8osaB-PcMWKbViGedXY0wnKlRgABDTUMxa9gEE60DX9lBLU-XgojBWsGOS8r7iZb330wkhIMfIcqV7M9xJLL1WjcL3izG7OlCiwcSa2r-qHDbU8nUFYoTPJKVhyIQw4lMKn1jJ_nriaCgZoezd_9hUuN51brhaZGvYQ=s1024-rj" 
          alt="Papaya Logo" 
          className="w-9 h-9 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-[#252525] font-semibold text-lg tracking-tight">Papaya</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenLibrary}
          className="px-4 py-1.5 bg-[#252525] hover:bg-neutral-800 text-white text-xs font-medium rounded-full border border-transparent transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M6 2v18"/><path d="M12 11h4"/><path d="M12 7h4"/><path d="M12 15h4"/></svg>
          Manage Signs
        </button>

        <div className="w-px h-4 bg-[#808080] mx-1" />

        <button 
          onClick={toggleOnTop}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
            onTop 
            ? 'bg-[#252525] text-white border-[#808080] shadow-lg shadow-black/10' 
            : 'bg-white text-black border-[#808080] hover:bg-gray-100'
          }`}
        >
          {onTop ? 'ON TOP' : 'ON TOP: OFF'}
        </button>
      </div>
    </div>
  );
};

export default Header;
