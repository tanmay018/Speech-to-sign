
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LibraryModalProps {
  onClose: () => void;
  userSigns: Record<string, string>;
  onSaveSign: (word: string, data: string) => void;
  onDeleteSign: (word: string) => void;
  initialWord?: string;
}

type CaptureMode = 'photo' | 'video';
type CaptureState = 'idle' | 'counting' | 'recording' | 'reviewing' | 'naming';

const LibraryModal: React.FC<LibraryModalProps> = ({ onClose, userSigns, onSaveSign, onDeleteSign, initialWord }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [wordInput, setWordInput] = useState('');
  const [timerConfig, setTimerConfig] = useState<number>(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [tempData, setTempData] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Memoize startCamera to be used in useEffect
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        // Increased resolution for clearer captures
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: false
      });
      setStream(mediaStream);
      setIsCapturing(true);
      setCaptureState('idle');
    } catch (err: any) {
      setCameraError(err.message || "Camera access denied.");
    }
  }, []);

  // Auto-start flow if initialWord is provided
  useEffect(() => {
    if (initialWord) {
      setWordInput(initialWord);
      startCamera();
    }
  }, [initialWord, startCamera]);

  useEffect(() => {
    if (isCapturing && videoRef.current && stream && (captureState === 'idle' || captureState === 'counting' || captureState === 'recording')) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play().catch(console.error);
    }
  }, [isCapturing, stream, captureState]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setCaptureState('idle');
    setTempData(null);
  };

  const initiateCapture = () => {
    if (timerConfig > 0) {
      setCaptureState('counting');
      setCountdown(timerConfig);
    } else {
      startActualCapture();
    }
  };

  useEffect(() => {
    if (captureState === 'counting' && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startActualCapture();
      }
    }
  }, [captureState, countdown]);

  const startActualCapture = () => {
    if (captureMode === 'photo') {
      executePhotoCapture();
    } else {
      startVideoRecording();
    }
  };

  const executePhotoCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setTempData(dataUrl);
        setCaptureState('reviewing');
        setCountdown(null);
      }
    }
  };

  const startVideoRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempData(reader.result as string);
        setCaptureState('reviewing');
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setCaptureState('recording');
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && captureState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const goToNaming = () => setCaptureState('naming');

  const handleSave = () => {
    if (tempData && wordInput.trim()) {
      onSaveSign(wordInput.trim().toLowerCase(), tempData);
      setWordInput('');
      setTempData(null);
      setCaptureState('idle');
      // If we came here from "Record Missing", we might want to close or reset, 
      // but keeping the camera open is usually better flow for multiple signs.
      // However, if initialWord was set, the user probably just wants to do that one.
      if (initialWord) {
         onClose();
      }
    } else {
      alert("Please enter a name for this sign.");
    }
  };

  const handleRetake = () => {
    setTempData(null);
    setCaptureState('idle');
    // If we retake, we keep the wordInput if it was pre-filled
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const isVideo = (data: any) => typeof data === 'string' && data.startsWith('data:video');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f4f4f4]/95 backdrop-blur-xl">
      <div className="bg-[#f4f4f4] border border-[#808080] w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-[#f4f4f4] border-b border-[#808080]">
          <h2 className="text-2xl font-black text-[#252525] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#252525] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            Sign Studio
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-2xl text-gray-400 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Library List */}
          <div className="w-full md:w-1/3 p-6 border-r border-[#808080] overflow-y-auto bg-[#f4f4f4]/50">
            <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-6">Saved Signs ({Object.keys(userSigns).length})</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(userSigns) as [string, string][]).map(([word, data]) => (
                <div key={word} className="group relative bg-white rounded-2xl overflow-hidden border border-[#808080] aspect-square shadow-sm hover:shadow-md transition-all">
                  {isVideo(data) ? (
                    <video src={data} className="w-full h-full object-cover opacity-90" autoPlay loop muted />
                  ) : (
                    <img src={data} alt={word} className="w-full h-full object-cover opacity-90 transition-all group-hover:opacity-100" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 flex items-center justify-between">
                    <span className="text-white text-[10px] font-black uppercase truncate">{word}</span>
                    <button onClick={() => onDeleteSign(word)} className="p-1 text-white hover:bg-white/20 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capture Area */}
          <div className="flex-1 p-8 bg-[#f4f4f4] flex flex-col gap-6">
            {!isCapturing ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-[#808080] border-dashed text-center p-12">
                <div className="w-20 h-20 bg-[#f4f4f4] rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="text-2xl font-bold text-[#252525] mb-3 text-center">Open Studio</h4>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-center">Record photos or short video clips of signs for your personal library.</p>
                <button onClick={startCamera} className="px-10 py-5 bg-[#252525] hover:bg-black text-white rounded-[2rem] font-black text-xl shadow-xl shadow-black/10 transition-all active:scale-95">Activate Camera</button>
                {cameraError && <p className="mt-4 text-red-500 text-sm">{cameraError}</p>}
              </div>
            ) : (
              <div className="flex-1 relative bg-black rounded-[3rem] overflow-hidden border border-[#808080] shadow-2xl flex flex-col">
                {/* Note: Camera view background stays black for video visibility */}
                
                {/* PREVIEW LAYER (Reviewing OR Naming) */}
                {(captureState === 'reviewing' || captureState === 'naming') && tempData && (
                   <div className="absolute inset-0 z-10">
                     {isVideo(tempData) ? (
                       <video src={tempData} className="w-full h-full object-cover" autoPlay loop muted />
                     ) : (
                       <img src={tempData!} className="w-full h-full object-cover" alt="Captured sign" />
                     )}
                   </div>
                )}
                
                {/* Reviewing Step UI */}
                {captureState === 'reviewing' && (
                    <div className="absolute inset-0 z-20 flex items-end justify-center p-8 pointer-events-none">
                      <div className="bg-[#f4f4f4]/90 backdrop-blur-xl border border-[#808080] p-3 rounded-2xl w-full max-w-sm shadow-2xl flex gap-3 animate-in slide-in-from-bottom-10 duration-300 pointer-events-auto">
                        <button onClick={handleRetake} className="flex-1 py-3 bg-white hover:bg-gray-200 text-[#252525] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">Retake</button>
                        <button onClick={goToNaming} className="flex-1 py-3 bg-[#252525] hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">Save</button>
                      </div>
                    </div>
                )}

                {/* Naming Step UI */}
                {captureState === 'naming' && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 pointer-events-none">
                    <div className="bg-[#f4f4f4] border border-[#808080] p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 pointer-events-auto">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-[#808080] shadow-lg bg-gray-50">
                        {tempData && isVideo(tempData) ? (
                          <video src={tempData} className="w-full h-full object-cover" autoPlay loop muted />
                        ) : (
                          <img src={tempData!} className="w-full h-full object-cover" alt="Thumb" />
                        )}
                      </div>
                      <h4 className="text-2xl font-black text-[#252525] mb-2 text-center">Label This Sign</h4>
                      <p className="text-gray-400 text-sm mb-8 text-center">What word does this represent?</p>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Type word..."
                        value={wordInput}
                        onChange={(e) => setWordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full px-6 py-4 bg-white border border-[#808080] rounded-2xl text-[#252525] font-bold text-center text-xl uppercase tracking-widest mb-6 focus:ring-2 focus:ring-[#252525] outline-none"
                      />
                      <div className="flex gap-3">
                        <button onClick={handleRetake} className="px-6 py-4 bg-white hover:bg-gray-200 text-[#252525] rounded-2xl font-bold transition-all">Cancel</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-[#252525] hover:bg-black text-white rounded-2xl font-black transition-all shadow-lg active:scale-95">Finish</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Step UI */}
                {(captureState === 'idle' || captureState === 'counting' || captureState === 'recording') && (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    
                    {captureState === 'counting' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm z-10 rounded-[3rem]">
                        <div className="text-[12rem] font-black text-white animate-ping drop-shadow-2xl">{countdown}</div>
                      </div>
                    )}

                    <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2 items-start pointer-events-auto">
                           <div className="bg-[#f4f4f4] border border-[#22c55e] text-[#22c55e] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full bg-[#22c55e] ${captureState === 'recording' ? 'animate-ping' : 'animate-pulse'}`} /> 
                             {captureState === 'recording' ? 'Recording Clip' : 'Live Studio'}
                           </div>
                           <div className="bg-[#f4f4f4]/80 backdrop-blur p-1 rounded-xl border border-[#808080] flex shadow-sm">
                              <button 
                                onClick={() => setCaptureMode('photo')} 
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${captureMode === 'photo' ? 'bg-[#EA580C] text-white' : 'text-gray-500 hover:text-[#252525]'}`}
                              >
                                Photo
                              </button>
                              <button 
                                onClick={() => setCaptureMode('video')} 
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${captureMode === 'video' ? 'bg-[#EA580C] text-white' : 'text-gray-500 hover:text-[#252525]'}`}
                              >
                                Video
                              </button>
                           </div>
                        </div>
                        <button onClick={stopCamera} className="pointer-events-auto p-3 bg-[#f4f4f4]/80 backdrop-blur rounded-2xl text-[#252525] hover:bg-white transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>

                      <div className="flex flex-col items-center gap-6 pointer-events-auto">
                        <div className="bg-[#f4f4f4]/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-[#808080] shadow-2xl flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Timer</span>
                            {[0, 3, 5].map(t => (
                              <button 
                                key={t}
                                onClick={() => setTimerConfig(t)}
                                className={`w-8 h-8 rounded-lg font-bold text-[10px] transition-all ${timerConfig === t ? 'bg-[#EA580C] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {t === 0 ? 'OFF' : `${t}s`}
                              </button>
                            ))}
                          </div>
                          <div className="w-px h-6 bg-gray-300" />
                          <button 
                            onClick={captureState === 'recording' ? stopVideoRecording : initiateCapture}
                            disabled={captureState === 'counting'}
                            className={`w-12 h-12 rounded-full flex items-center justify-center group active:scale-90 transition-all disabled:opacity-50 shadow-xl ${captureState === 'recording' ? 'bg-red-500 border-2 border-white' : 'bg-[#EA580C]'}`}
                          >
                            <div className={`rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-95 ${captureState === 'recording' ? 'border-transparent w-4 h-4 bg-white rounded-sm' : 'border-white/20 w-10 h-10'}`}>
                               <div className={`rounded-full transition-all ${captureState === 'recording' ? 'w-full h-full bg-white rounded-sm' : 'w-5 h-5 bg-white'}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
