'use client';

import { Question, ScenarioContext } from '@/types';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  scenarioContext?: ScenarioContext | null;
  isSpeaking?: boolean;
  onReadQuestion?: () => void;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  scenarioContext,
  isSpeaking,
  onReadQuestion,
}: QuestionDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {scenarioContext && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">{scenarioContext.title}</h3>
          <p className="text-sm text-blue-700 mb-2">{scenarioContext.description}</p>
          {scenarioContext.patientInfo && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-xs font-medium text-blue-600 mb-1">患者情報</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {scenarioContext.patientInfo}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">
          問題 {questionNumber} / {totalQuestions}
        </span>
        {onReadQuestion && (
          <button
            onClick={onReadQuestion}
            disabled={isSpeaking}
            className={`
              flex items-center gap-2 px-3 py-1 rounded-full text-sm
              ${isSpeaking
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            {isSpeaking ? '読み上げ中...' : '読み上げ'}
          </button>
        )}
      </div>

      <div className="prose max-w-none">
        <p className="text-lg text-gray-800 leading-relaxed">
          {question.text}
        </p>
      </div>

      {question.reference && (
        <p className="mt-4 text-xs text-gray-500">
          参考: {question.reference}
        </p>
      )}
    </div>
  );
}
