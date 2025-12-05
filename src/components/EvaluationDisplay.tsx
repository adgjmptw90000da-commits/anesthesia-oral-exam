'use client';

import { Evaluation } from '@/types';

interface EvaluationDisplayProps {
  evaluation: Evaluation;
  userAnswer: string;
  onNext: () => void;
  onReadEvaluation?: () => void;
  isSpeaking?: boolean;
  isLastQuestion?: boolean;
}

export function EvaluationDisplay({
  evaluation,
  userAnswer,
  onNext,
  onReadEvaluation,
  isSpeaking,
  isLastQuestion,
}: EvaluationDisplayProps) {
  const scorePercentage = (evaluation.score / evaluation.maxScore) * 100;
  const scoreColor =
    scorePercentage >= 80 ? 'text-green-600' :
    scorePercentage >= 60 ? 'text-yellow-600' :
    'text-red-600';

  const scoreBgColor =
    scorePercentage >= 80 ? 'bg-green-100' :
    scorePercentage >= 60 ? 'bg-yellow-100' :
    'bg-red-100';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Score Display */}
      <div className={`flex items-center justify-center p-6 rounded-xl ${scoreBgColor}`}>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">スコア</p>
          <p className={`text-5xl font-bold ${scoreColor}`}>
            {evaluation.score}
            <span className="text-2xl text-gray-700">/{evaluation.maxScore}</span>
          </p>
        </div>
      </div>

      {/* Read Aloud Button */}
      {onReadEvaluation && (
        <button
          onClick={onReadEvaluation}
          disabled={isSpeaking}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-lg
            ${isSpeaking
              ? 'bg-gray-100 text-gray-600'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          {isSpeaking ? '読み上げ中...' : '評価を読み上げる'}
        </button>
      )}

      {/* Your Answer */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">あなたの回答</h4>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-800 whitespace-pre-wrap">{userAnswer || '（スキップ）'}</p>
        </div>
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">フィードバック</h4>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 whitespace-pre-wrap">{evaluation.feedback}</p>
        </div>
      </div>

      {/* Model Answer */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">模範回答</h4>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 whitespace-pre-wrap">{evaluation.modelAnswer}</p>
        </div>
      </div>

      {/* Key Points */}
      {evaluation.keyPoints && evaluation.keyPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">重要ポイント</h4>
          <ul className="space-y-2">
            {evaluation.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
      >
        {isLastQuestion ? '結果を見る' : '次の問題へ'}
      </button>
    </div>
  );
}
