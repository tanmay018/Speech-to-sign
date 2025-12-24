
import React, { useEffect, useState } from 'react';

interface SignDisplayProps {
  word: string;
  userSigns: Record<string, string>;
  onRecordMissing?: (word: string) => void;
  isReviewing?: boolean;
  missingWords?: string[];
  onSkipReview?: () => void;
}

const SignDisplay: React.FC<SignDisplayProps> = ({ 
  word, 
  userSigns, 
  onRecordMissing, 
  isReviewing = false, 
  missingWords = [],
  onSkipReview 
}) => {
  const [activeWord, setActiveWord] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const cleanWord = word.toLowerCase().trim();
  const userData = userSigns[cleanWord];

  // Logic to handle the "switch" between signs with a subtle fade
  useEffect(() => {
    if (word !== activeWord) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setActiveWord(word);
        setIsTransitioning(false);
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [word, activeWord]);

  const isVideo = (data: string | undefined | null) => typeof data === 'string' && data.startsWith('data:video');

  // RENDER: Review List Mode
  if (isReviewing && missingWords.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[#f4f4f4] relative overflow-hidden group">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] bg-white pointer-events-none" />
         
         <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#EA580C] text-[#EA580C] text-xs font-bold uppercase tracking-widest mb-3">
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
                Missing Signs Found
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#252525]">Record Your Library</h2>
              <p className="text-black mt-2">Select a word below to add its sign immediately.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-h-[50vh] overflow-y-auto p-4 w-full">
              {missingWords.map((missingWord) => (
                <button
                  key={missingWord}
                  onClick={() => onRecordMissing && onRecordMissing(missingWord)}
                  className="group relative flex items-center gap-3 pl-5 pr-4 py-3 bg-[#f4f4f4] hover:bg-white border border-[#808080] hover:border-[#808080] rounded-2xl transition-all hover:scale-105 shadow-sm active:scale-95"
                >
                  <span className="text-lg font-bold text-[#252525] capitalize">{missingWord}</span>
                  <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center transition-colors shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10">
               <button 
                  onClick={onSkipReview}
                  className="px-8 py-3 bg-transparent hover:bg-white text-black hover:text-[#252525] rounded-full text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
               >
                 Dismiss All
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>
         </div>
      </div>
    )
  }

  // RENDER: Normal Sequencer Mode
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-[#f4f4f4] relative overflow-hidden group">
      {/* Decorative Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] bg-white pointer-events-none" />
      
      <div className={`z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {userData ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              {isVideo(userData) ? (
                <video 
                  key={activeWord} // Remount on change
                  src={userData}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-[#808080] bg-white p-1.5 transition-transform duration-300 hover:scale-[1.01]"
                />
              ) : (
                <img 
                  src={userData} 
                  alt={activeWord}
                  className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-[#808080] bg-white p-1.5 transition-transform duration-300 hover:scale-[1.01]"
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-2 pb-2">
              <span className="bg-[#252525] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                {isVideo(userData) ? 'Sign Video' : 'Sign Image'}
              </span>
              <div className="bg-[#f4f4f4]/80 backdrop-blur-md px-6 py-2 rounded-xl border border-[#808080] shadow-xl">
                <span className="text-[#252525] font-black text-lg md:text-xl uppercase tracking-[0.2em]">{activeWord}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center w-full px-4">
            {activeWord ? (
              <div className="flex flex-col items-center gap-8">
                 <div className="text-5xl md:text-7xl font-black text-[#252525] uppercase tracking-tighter drop-shadow-sm animate-pulse">
                  {activeWord}
                </div>
                <div className="flex flex-col gap-4 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-black tracking-widest uppercase text-black">
                      Sequencer Fallback
                    </div>
                    <div className="text-black text-xs italic">
                      Sign not found in library
                    </div>
                  </div>
                  
                  {/* Single Action Button during playback */}
                  {onRecordMissing && (
                    <button 
                      onClick={() => onRecordMissing(activeWord)}
                      className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#252525] hover:bg-black border border-transparent transition-all duration-300 shadow-lg mt-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-white group-hover:bg-gray-200 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wide text-white">
                        Record Now
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-black">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2 bg-white">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-black">Paced Translator</p>
                  <p className="text-sm text-black opacity-60 max-w-xs mx-auto leading-relaxed">Each sign will appear for 1.5 seconds to ensure clear communication.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignDisplay;
