
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Header from './components/Header';
import SignDisplay from './components/SignDisplay';
import Subtitles from './components/Subtitles';
import LibraryModal from './components/LibraryModal';
import { IWindow } from './types';
import { getAllSigns, saveSignToDB, deleteSignFromDB } from './utils/db';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [displayWord, setDisplayWord] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTargetWord, setLibraryTargetWord] = useState('');
  const [isReviewingMissing, setIsReviewingMissing] = useState(false);
  const [missingWords, setMissingWords] = useState<string[]>([]);
  
  // PiP State
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isFakePip, setIsFakePip] = useState(false); // Fallback for iframes
  
  // Fake PiP Drag State
  const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const pipRef = useRef<HTMLDivElement>(null);
  
  // Local Sign Library State
  const [userSigns, setUserSigns] = useState<Record<string, string>>({});
  
  // Logic Refs
  const userSignsRef = useRef<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  
  // Queue & Sequencing Refs
  const wordQueue = useRef<string[]>([]);
  const missingWordsRef = useRef<string[]>([]); 
  const isProcessingQueue = useRef(false);
  
  // Promise resolver to control queue timing from the child component
  const signResolver = useRef<(() => void) | null>(null);

  // Load signs from IndexedDB
  useEffect(() => {
    isComponentMounted.current = true;
    
    const loadSigns = async () => {
      try {
        const signs = await getAllSigns();
        if (isComponentMounted.current) {
          setUserSigns(signs);
          userSignsRef.current = signs;
        }
      } catch (err) {
        console.error("Failed to load signs from DB", err);
      }
    };
    loadSigns();
    
    // Set initial PiP position to bottom right
    setPipPosition({ 
      x: window.innerWidth - 420, 
      y: window.innerHeight - 450 
    });

    return () => { isComponentMounted.current = false; };
  }, []);

  const handleSaveSign = async (word: string, imageData: string) => {
    const cleanWord = word.toLowerCase().trim();
    // Update State immediately for UI responsiveness
    const newSigns = { ...userSigns, [cleanWord]: imageData };
    setUserSigns(newSigns);
    userSignsRef.current = newSigns;
    
    // Save to DB
    try {
      await saveSignToDB(cleanWord, imageData);
    } catch (e) {
      console.error("Failed to save to DB", e);
      alert("Failed to save sign to database. Storage might be full.");
    }
  };

  const handleDeleteSign = async (word: string) => {
    const newSigns = { ...userSigns };
    delete newSigns[word];
    setUserSigns(newSigns);
    userSignsRef.current = newSigns;
    
    try {
      await deleteSignFromDB(word);
    } catch (e) {
      console.error("Failed to delete from DB", e);
    }
  };

  // Opens library specifically to record a missing word
  const handleRecordMissing = (word: string) => {
    setLibraryTargetWord(word);
    setShowLibrary(true);
  };

  // Clear all missing words
  const handleSkipReview = () => {
    setMissingWords([]);
    missingWordsRef.current = [];
    setIsReviewingMissing(false);
    processQueue();
  };

  // Callback passed to SignDisplay to signal when video ends or timer finishes
  const handleSignComplete = useCallback(() => {
    if (signResolver.current) {
      signResolver.current();
      signResolver.current = null;
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current) return;
    
    isProcessingQueue.current = true;

    // 1. Play all queued words
    if (wordQueue.current.length > 0) {
      // Ensure review mode is off while playing signs
      if (isReviewingMissing) setIsReviewingMissing(false);

      while (wordQueue.current.length > 0) {
        const nextWord = wordQueue.current.shift();
        if (nextWord) {
          setDisplayWord(nextWord);
          
          // Wait for the SignDisplay component to resolve this promise
          // This allows videos to play for full duration, and images to use fixed timer
          await new Promise<void>(resolve => {
            signResolver.current = resolve;
          });
        }
      }
    }

    // 2. Queue is empty, check if we need to show review screen
    setDisplayWord('');
    
    if (missingWordsRef.current.length > 0) {
      setIsReviewingMissing(true);
    } else {
      setIsReviewingMissing(false);
    }
    
    isProcessingQueue.current = false;
  }, [isReviewingMissing]);

  const queueCleanedWords = useCallback((cleanedText: string) => {
    const words = cleanedText.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const library = userSignsRef.current;
    const maxWindow = 3;
    let i = 0;
    
    // Hide review screen immediately if user starts talking again
    if (isReviewingMissing) {
       setIsReviewingMissing(false);
    }

    const newMissing: string[] = [];

    while (i < words.length) {
      let matched = false;
      // Try phrases
      for (let windowSize = Math.min(maxWindow, words.length - i); windowSize >= 2; windowSize--) {
        const phrase = words.slice(i, i + windowSize).join(' ');
        if (library[phrase]) {
          wordQueue.current.push(phrase);
          i += windowSize;
          matched = true;
          break;
        }
      }
      // Single word
      if (!matched) {
        const word = words[i];
        wordQueue.current.push(word);
        
        // If it's missing, add to list
        if (!library[word]) {
          newMissing.push(word);
        }
        
        i++;
      }
    }

    // Update missing words state/ref
    if (newMissing.length > 0) {
      const updated = [...missingWordsRef.current];
      newMissing.forEach(w => {
        if (!updated.includes(w)) updated.push(w);
      });
      missingWordsRef.current = updated;
      setMissingWords(updated);
    }

    processQueue();
  }, [processQueue, isReviewingMissing]);

  // Speech Recognition Controller
  useEffect(() => {
    const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }

    let recognition: any = null;
    let restartTimeout: any = null;

    if (isListening) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          alert("Microphone access denied. Please allow microphone access to use this app.");
        }
      };

      recognition.onresult = async (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            const rawFinal = result[0].transcript.trim();
            setInterimTranscript(''); 
            
            setTranscript(prev => (prev + ' ' + rawFinal).trim());
            queueCleanedWords(rawFinal);
          } else {
            currentInterim += result[0].transcript;
          }
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onend = () => {
        if (isListening && isComponentMounted.current) {
          restartTimeout = setTimeout(() => {
            try { 
              if (recognition && recognition === recognitionRef.current) {
                recognition.start(); 
              }
            } catch(e) {}
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      try { recognition.start(); } catch(e) {}
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      
      setInterimTranscript('');
      wordQueue.current = [];
      missingWordsRef.current = [];
      setMissingWords([]);
      setDisplayWord('');
      setIsReviewingMissing(false);
      // Force release any pending promises if stop is clicked
      if (signResolver.current) {
         signResolver.current();
         signResolver.current = null;
      }
    }

    return () => {
      if (restartTimeout) clearTimeout(restartTimeout);
      if (recognition) {
        recognition.onend = null;
        try { recognition.stop(); } catch (e) {}
      }
    };
  }, [isListening, queueCleanedWords]);

  const startListening = () => setIsListening(true);
  const stopListening = () => {
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    setDisplayWord('');
    setIsReviewingMissing(false);
  };

  // PiP Handlers
  const startPiP = useCallback(async () => {
    if (isFakePip) {
      setIsFakePip(false);
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      // Browser doesn't support it at all (e.g., Firefox), use Fake PiP
      setIsFakePip(true);
      return;
    }

    try {
      // Attempt actual API
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 600,
        height: 600,
      });

      // Copy styles
      Array.from(document.head.children).forEach((child) => {
        if (child.tagName === 'STYLE' || child.tagName === 'LINK') {
           pip.document.head.appendChild(child.cloneNode(true));
        }
        if (child.tagName === 'SCRIPT') {
           const oldScript = child as HTMLScriptElement;
           const newScript = document.createElement('script');
           newScript.src = oldScript.src;
           newScript.textContent = oldScript.textContent;
           if (oldScript.crossOrigin) newScript.crossOrigin = oldScript.crossOrigin;
           pip.document.head.appendChild(newScript);
        }
      });
      
      pip.document.body.style.margin = '0';
      pip.document.body.style.backgroundColor = '#f4f4f4';
      pip.document.body.className = document.body.className;

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err: any) {
      console.warn("Real PiP failed, falling back to in-app PiP:", err);
      // If failed (e.g. iframe restrictions), fallback to in-app simulation
      setIsFakePip(true);
      // Reset position to visible area if needed
      setPipPosition({ 
        x: window.innerWidth - 420, 
        y: window.innerHeight - 450 
      });
    }
  }, [isFakePip]);

  // Dragging Logic
  const handleDragStart = (e: React.MouseEvent) => {
    if (!pipRef.current) return;
    setIsDragging(true);
    const rect = pipRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging || !pipRef.current) return;
      e.preventDefault();
      
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      
      // Direct DOM manipulation for smooth performance
      pipRef.current.style.left = `${x}px`;
      pipRef.current.style.top = `${y}px`;
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        // Sync final position with state
        if (pipRef.current) {
          const rect = pipRef.current.getBoundingClientRect();
          setPipPosition({ x: rect.left, y: rect.top });
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);


  // Handle closing library
  const handleCloseLibrary = () => {
    setShowLibrary(false);
    if (libraryTargetWord) {
       if (userSignsRef.current[libraryTargetWord.toLowerCase()]) {
         const updated = missingWordsRef.current.filter(w => w !== libraryTargetWord);
         missingWordsRef.current = updated;
         setMissingWords(updated);
       }
       setLibraryTargetWord('');
       if (missingWordsRef.current.length === 0) {
         setIsReviewingMissing(false);
       } else {
         setIsReviewingMissing(true);
       }
    }
  };

  const isAnyPiP = !!pipWindow || isFakePip;

  return (
    <div className="flex flex-col h-screen transition-colors duration-500 bg-[#f4f4f4] overflow-hidden">
      <Header 
        onOpenLibrary={() => setShowLibrary(true)} 
        onPiP={startPiP}
        isPiPActive={isAnyPiP}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f4f4f4] border-r border-[#808080]">
          {isAnyPiP ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f4f4f4]">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="14" height="14" rx="2" ry="2" /><path d="M16 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" /><polyline points="15 15 21 9 21 15 15 9" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-[#252525]">Popped Out</h2>
              <p className="text-gray-500 mt-2">
                {pipWindow ? "Displaying in external window." : "Displaying in floating overlay."}
              </p>
              <button 
                onClick={() => {
                  if (pipWindow) pipWindow.close();
                  setIsFakePip(false);
                }}
                className="mt-6 px-6 py-2 bg-[#252525] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform"
              >
                Restore Display
              </button>
            </div>
          ) : (
            <SignDisplay 
              word={displayWord} 
              userSigns={userSigns} 
              onRecordMissing={handleRecordMissing}
              isReviewing={isReviewingMissing}
              missingWords={missingWords}
              onSkipReview={handleSkipReview}
              onDisplayComplete={handleSignComplete}
            />
          )}
        </main>

        <aside className="w-[25%] min-w-[280px] max-w-lg bg-[#f4f4f4] border-l border-[#808080] shadow-xl relative z-20">
          <Subtitles 
            transcript={transcript} 
            interim={interimTranscript} 
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        </aside>
      </div>

      {/* Render Real PiP using Portal */}
      {pipWindow && createPortal(
        <div className="h-full flex flex-col bg-[#f4f4f4] overflow-hidden">
           <SignDisplay 
              word={displayWord} 
              userSigns={userSigns} 
              onRecordMissing={(word) => {
                window.focus();
                handleRecordMissing(word);
              }}
              isReviewing={isReviewingMissing}
              missingWords={missingWords}
              onSkipReview={handleSkipReview}
              onDisplayComplete={handleSignComplete}
            />
        </div>,
        pipWindow.document.body
      )}

      {/* Render Fake PiP (Fallback) */}
      {isFakePip && (
        <div 
          ref={pipRef}
          className="fixed w-96 h-96 bg-white rounded-3xl shadow-2xl border-4 border-[#252525] z-50 overflow-hidden flex flex-col"
          style={{ 
            left: pipPosition.x, 
            top: pipPosition.y 
          }}
        >
           <div 
             onMouseDown={handleDragStart}
             className={`bg-[#252525] p-2 flex justify-between items-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} active:cursor-grabbing`}
           >
             <span className="text-white text-[10px] font-bold uppercase tracking-widest px-2 pointer-events-none select-none">Papaya Float</span>
             <button onClick={() => setIsFakePip(false)} className="text-white hover:bg-white/20 rounded p-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
             </button>
           </div>
           <div className="flex-1 relative">
             <SignDisplay 
                word={displayWord} 
                userSigns={userSigns} 
                onRecordMissing={handleRecordMissing}
                isReviewing={isReviewingMissing}
                missingWords={missingWords}
                onSkipReview={handleSkipReview}
                onDisplayComplete={handleSignComplete}
             />
           </div>
        </div>
      )}

      {showLibrary && (
        <LibraryModal 
          onClose={handleCloseLibrary}
          userSigns={userSigns}
          onSaveSign={handleSaveSign}
          onDeleteSign={handleDeleteSign}
          initialWord={libraryTargetWord}
        />
      )}

      {/* Background Decor */}
      <div className="fixed -bottom-32 -left-32 w-64 h-64 bg-gray-200/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -top-32 -right-32 w-64 h-64 bg-gray-100/50 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default App;
