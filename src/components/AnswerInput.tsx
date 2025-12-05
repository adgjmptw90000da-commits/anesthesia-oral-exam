'use client';

import { useState, useEffect } from 'react';

interface AnswerInputProps {
  isListening: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  speechRecognitionSupported: boolean;
}

export function AnswerInput({
  isListening,
  transcript,
  onStartListening,
  onStopListening,
  onSubmit,
  onSkip,
  isSubmitting,
  speechRecognitionSupported,
}: AnswerInputProps) {
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');

  // Sync transcript to text input when using voice
  useEffect(() => {
    if (inputMode === 'voice' && transcript) {
      setTextInput(transcript);
    }
  }, [transcript, inputMode]);

  const handleSubmit = () => {
    if (textInput.trim()) {
      onSubmit(textInput.trim());
      setTextInput('');
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      onStopListening();
    } else {
      setTextInput('');
      onStartListening();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Input Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInputMode('voice')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            inputMode === 'voice'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          音声入力
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            inputMode === 'text'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          テキスト入力
        </button>
      </div>

      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <div className="space-y-4">
          {!speechRecognitionSupported ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
              お使いのブラウザは音声認識に対応していません。Chrome または Edge をお使いください。
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <button
                  onClick={handleVoiceToggle}
                  disabled={isSubmitting}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center transition-all
                    ${isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700'}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isListening ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              <p className="text-center text-sm text-gray-700">
                {isListening ? '「回答終了」または停止ボタンで終了' : '「回答開始」または開始ボタンで録音'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Text Area (shown in both modes) */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          回答
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={inputMode === 'voice' ? '音声入力した内容がここに表示されます（編集可能）' : '回答を入力してください'}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black placeholder:text-gray-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          スキップ
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !textInput.trim()}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              評価中...
            </span>
          ) : (
            '回答を送信'
          )}
        </button>
      </div>

      {/* Voice Command Help */}
      {speechRecognitionSupported && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">音声コマンド</p>
          <p className="text-xs text-gray-700">
            「回答開始」「回答終了」「次へ」「スキップ」「もう一度」
          </p>
        </div>
      )}
    </div>
  );
}
