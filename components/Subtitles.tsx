
import React, { useEffect, useRef } from 'react';

interface SubtitlesProps {
  transcript: string[];
  interim?: string;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const Subtitles: React.FC<SubtitlesProps> = ({ 
  transcript, 
  interim,
  isListening,
  onStartListening,
  onStopListening
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, interim]);

  return (
    <div className="h-full flex flex-col bg-[#f4f4f4]/80 backdrop-blur-md">
      <div className="p-4 border-b border-[#808080] bg-[#f4f4f4] shadow-sm z-10 shrink-0">
         <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#EA580C] animate-pulse' : 'bg-black'}`} />
            Live Transcript
         </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 scroll-smooth bg-[#f4f4f4]">
        {transcript.length > 0 || interim ? (
           <div className="space-y-4">
             {transcript.map((line, index) => (
               <p 
                 key={index} 
                 className="text-[#252525] text-base leading-relaxed font-medium font-sans animate-in fade-in slide-in-from-bottom-2 duration-300"
               >
                 {line}
               </p>
             ))}
             {interim && (
               <p className="text-[#252525] text-base leading-relaxed font-medium font-sans">
                  <span className="text-black opacity-90 transition-opacity">
                    {interim}
                  </span>
                  <span className="w-1.5 h-4 bg-[#EA580C] inline-block ml-1 align-middle animate-pulse rounded-full" />
               </p>
             )}
           </div>
        ) : (
           <div className="h-full flex flex-col items-center justify-center text-black gap-3 mt-[-20px]">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <span className="text-sm font-medium italic opacity-60">Waiting for speech...</span>
           </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <div className="p-4 border-t border-[#808080] bg-[#f4f4f4] shrink-0">
        {!isListening ? (
          <button 
            onClick={onStartListening}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-[#EA580C]/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            START LISTENING
          </button>
        ) : (
          <button 
            onClick={onStopListening}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-[#EA580C] border-2 border-[#EA580C] font-bold rounded-xl transition-all transform active:scale-95 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#EA580C]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            STOP LISTENING
          </button>
        )}
      </div>
    </div>
  );
};

export default Subtitles;
