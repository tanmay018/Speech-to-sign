
export interface SignAsset {
  word: string;
  url: string;
}

export interface SpeechState {
  isListening: boolean;
  transcript: string;
  currentWord: string;
  lastWords: string[];
}

// Global Speech Recognition types (Web Speech API)
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}
