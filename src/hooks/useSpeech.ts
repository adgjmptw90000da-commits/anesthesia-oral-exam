'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Type declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

interface UseSpeechReturn {
  // Speech Recognition
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;

  // Speech Synthesis
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;

  // Voice Commands
  lastCommand: string | null;

  // Support
  speechRecognitionSupported: boolean;
  speechSynthesisSupported: boolean;
}

const VOICE_COMMANDS = {
  START_ANSWER: ['回答開始', '開始', 'かいとうかいし', 'かいし', 'スタート'],
  STOP_ANSWER: ['回答終了', '終了', 'かいとうしゅうりょう', 'しゅうりょう', 'ストップ'],
  NEXT: ['次へ', 'つぎへ', '次', 'つぎ', 'ネクスト'],
  REPEAT: ['もう一度', 'もういちど', '繰り返し', 'くりかえし', 'リピート'],
  SKIP: ['スキップ', 'パス'],
};

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isListeningRef = useRef(false); // Use ref to track listening state for closure

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSpeechRecognitionSupported(!!SpeechRecognition);
      setSpeechSynthesisSupported('speechSynthesis' in window);

      if (SpeechRecognition && !recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;

              // Check for voice commands
              const text = result[0].transcript.toLowerCase();
              for (const [command, triggers] of Object.entries(VOICE_COMMANDS)) {
                if (triggers.some(trigger => text.includes(trigger))) {
                  setLastCommand(command);
                  break;
                }
              }
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        recognition.onend = () => {
          // Use ref to check current listening state (avoids closure issue)
          if (isListeningRef.current) {
            // Restart if we're still supposed to be listening
            try {
              setTimeout(() => {
                if (isListeningRef.current && recognitionRef.current) {
                  recognitionRef.current.start();
                }
              }, 100);
            } catch (e) {
              console.error('Failed to restart recognition:', e);
              setIsListening(false);
              isListeningRef.current = false;
            }
          }
        };

        recognitionRef.current = recognition;
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        // Pre-load voices
        window.speechSynthesis.getVoices();
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // Only run once on mount

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      setTranscript('');
      setLastCommand(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
        console.log('Speech recognition started');
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current.stop();
      console.log('Speech recognition stopped');
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setLastCommand(null);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find a Japanese voice
      const voices = synthRef.current.getVoices();
      const japaneseVoice = voices.find(voice => voice.lang.includes('ja'));
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Speech started');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Speech ended');
        resolve();
      };
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        resolve(); // Don't reject, just continue
      };

      synthRef.current.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSpeaking,
    speak,
    stopSpeaking,
    lastCommand,
    speechRecognitionSupported,
    speechSynthesisSupported,
  };
}
