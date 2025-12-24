
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SignDisplay from './components/SignDisplay';
import Subtitles from './components/Subtitles';
import LibraryModal from './components/LibraryModal';
import { IWindow } from './types';

const STORAGE_KEY = 'papaya_user_signs';
const SIGN_DISPLAY_DURATION = 1500; 

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [displayWord, setDisplayWord] = useState('');
  const [onTop, setOnTop] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTargetWord, setLibraryTargetWord] = useState('');
  const [isReviewingMissing, setIsReviewingMissing] = useState(false);
  const [missingWords, setMissingWords] = useState<string[]>([]);
  
  // Local Sign Library State
  const [userSigns, setUserSigns] = useState<Record<string, string>>({});
  
  // Logic Refs
  const userSignsRef = useRef<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  
  // Queue & Sequencing Refs
  const wordQueue = useRef<string[]>([]);
  const missingWordsRef = useRef<string[]>([]); // Ref to keep track of missing words synchronously
  const isProcessingQueue = useRef(false);

  // Load signs
  useEffect(() => {
    isComponentMounted.current = true;
    const saved = localStorage.getItem(STORAGE_KEY);
    const initialSigns: Record<string, string> = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(initialSigns, parsed);
      } catch (e) {
        console.error("Failed to parse saved signs", e);
      }
    }
    setUserSigns(initialSigns);
    userSignsRef.current = initialSigns;
    return () => { isComponentMounted.current = false; };
  }, []);

  const saveToStorage = (newSigns: Record<string, string>) => {
    setUserSigns(newSigns);
    userSignsRef.current = newSigns;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSigns));
  };

  const handleSaveSign = (word: string, imageData: string) => {
    const newSigns = { ...userSigns, [word.toLowerCase().trim()]: imageData };
    saveToStorage(newSigns);
  };

  const handleDeleteSign = (word: string) => {
    const newSigns = { ...userSigns };
    delete newSigns[word];
    saveToStorage(newSigns);
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
          await new Promise(resolve => setTimeout(resolve, SIGN_DISPLAY_DURATION));
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
        // 'no-speech' is common and harmless in continuous mode. 
        // 'aborted' happens during manual stop.
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
  const toggleOnTop = () => setOnTop(!onTop);

  // Handle closing library
  const handleCloseLibrary = () => {
    setShowLibrary(false);
    
    // If we were targeting a specific word (Missing Record flow)
    if (libraryTargetWord) {
       // Check if the user successfully saved it
       if (userSignsRef.current[libraryTargetWord.toLowerCase()]) {
         // Remove from missing list
         const updated = missingWordsRef.current.filter(w => w !== libraryTargetWord);
         missingWordsRef.current = updated;
         setMissingWords(updated);
       }
       setLibraryTargetWord('');
       
       // Re-evaluate review state
       if (missingWordsRef.current.length === 0) {
         setIsReviewingMissing(false);
       } else {
         // Ensure we stay in review mode if there are leftovers
         setIsReviewingMissing(true);
       }
    }
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 bg-[#f4f4f4] overflow-hidden ${onTop ? 'border-4 border-[#808080]' : ''}`}>
      <Header 
        onTop={onTop} 
        toggleOnTop={toggleOnTop} 
        onOpenLibrary={() => setShowLibrary(true)} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f4f4f4] border-r border-[#808080]">
          <SignDisplay 
            word={displayWord} 
            userSigns={userSigns} 
            onRecordMissing={handleRecordMissing}
            isReviewing={isReviewingMissing}
            missingWords={missingWords}
            onSkipReview={handleSkipReview}
          />
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
