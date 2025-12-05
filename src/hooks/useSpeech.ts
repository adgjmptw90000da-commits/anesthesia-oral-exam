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
  isRecordingAnswer: boolean;
  transcript: string;
  startCommandListening: () => void;
  stopCommandListening: () => void;
  startAnswerRecording: () => void;
  stopAnswerRecording: () => void;
  resetTranscript: () => void;

  // Speech Synthesis
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;

  // Voice Commands
  lastCommand: string | null;
  clearLastCommand: () => void;

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
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isListeningRef = useRef(false);
  const isRecordingAnswerRef = useRef(false);

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
              const text = result[0].transcript;

              // Check for voice commands
              const lowerText = text.toLowerCase();
              let commandFound = false;
              for (const [command, triggers] of Object.entries(VOICE_COMMANDS)) {
                if (triggers.some(trigger => lowerText.includes(trigger))) {
                  console.log('Voice command detected:', command);
                  setLastCommand(command);
                  commandFound = true;
                  break;
                }
              }

              // Only add to transcript if recording answer and not a command
              if (isRecordingAnswerRef.current && !commandFound) {
                finalTranscript += text;
              }
            }
          }

          if (finalTranscript && isRecordingAnswerRef.current) {
            setTranscript(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            // Don't stop listening on minor errors
          }
        };

        recognition.onend = () => {
          // Always restart if we're supposed to be listening
          if (isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('Speech recognition restarted');
                } catch (e) {
                  console.error('Failed to restart recognition:', e);
                }
              }
            }, 100);
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
  }, []);

  // Start listening for commands (always on in background)
  const startCommandListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
        console.log('Command listening started');
      } catch (e) {
        console.error('Failed to start command listening:', e);
      }
    }
  }, []);

  // Stop listening for commands
  const stopCommandListening = useCallback(() => {
    if (recognitionRef.current) {
      isListeningRef.current = false;
      isRecordingAnswerRef.current = false;
      setIsListening(false);
      setIsRecordingAnswer(false);
      recognitionRef.current.stop();
      console.log('Command listening stopped');
    }
  }, []);

  // Start recording answer (transcript will be captured)
  const startAnswerRecording = useCallback(() => {
    setTranscript('');
    setIsRecordingAnswer(true);
    isRecordingAnswerRef.current = true;
    console.log('Answer recording started');

    // Make sure we're listening
    if (!isListeningRef.current) {
      startCommandListening();
    }
  }, [startCommandListening]);

  // Stop recording answer
  const stopAnswerRecording = useCallback(() => {
    setIsRecordingAnswer(false);
    isRecordingAnswerRef.current = false;
    console.log('Answer recording stopped');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearLastCommand = useCallback(() => {
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
        resolve();
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
    isRecordingAnswer,
    transcript,
    startCommandListening,
    stopCommandListening,
    startAnswerRecording,
    stopAnswerRecording,
    resetTranscript,
    isSpeaking,
    speak,
    stopSpeaking,
    lastCommand,
    clearLastCommand,
    speechRecognitionSupported,
    speechSynthesisSupported,
  };
}
