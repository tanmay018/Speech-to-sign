
import React from 'react';

interface ControlsProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isListening, onStart, onStop }) => {
  return (
    <div className="z-20 flex gap-4 bg-slate-800/80 backdrop-blur-xl p-3 rounded-2xl border border-slate-700 shadow-2xl w-fit transition-all duration-300">
      {!isListening ? (
        <button 
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-4 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-black transition-all transform active:scale-95 shadow-lg shadow-[#EA580C]/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          START LISTENING
        </button>
      ) : (
        <button 
          onClick={onStop}
          className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-[#EA580C] border-2 border-[#EA580C] rounded-xl font-black transition-all transform active:scale-95 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#EA580C]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          STOP LISTENING
        </button>
      )}
    </div>
  );
};

export default Controls;
