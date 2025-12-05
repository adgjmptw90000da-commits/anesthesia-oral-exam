'use client';

import { Evaluation, Question, Answer } from '@/types';

interface ResultsSummaryProps {
  questions: Question[];
  answers: Answer[];
  evaluations: Evaluation[];
  onRestart: () => void;
  onNewSession: () => void;
}

export function ResultsSummary({
  questions,
  answers,
  evaluations,
  onRestart,
  onNewSession,
}: ResultsSummaryProps) {
  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
  const maxTotalScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0);
  const averageScore = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', label: '優秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'B', label: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 70) return { grade: 'C', label: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 60) return { grade: 'D', label: '要改善', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', label: '不合格', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade(averageScore);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          試験結果
        </h2>

        <div className={`text-center p-8 rounded-xl ${gradeInfo.bg} mb-6`}>
          <p className="text-sm text-gray-700 mb-2">総合評価</p>
          <p className={`text-7xl font-bold ${gradeInfo.color}`}>
            {gradeInfo.grade}
          </p>
          <p className={`text-lg font-medium ${gradeInfo.color} mt-2`}>
            {gradeInfo.label}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">合計得点</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalScore}<span className="text-sm text-gray-700">/{maxTotalScore}</span>
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">正答率</p>
            <p className="text-2xl font-bold text-gray-800">
              {averageScore.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">問題数</p>
            <p className="text-2xl font-bold text-gray-800">
              {questions.length}問
            </p>
          </div>
        </div>
      </div>

      {/* Question-by-Question Results */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">問題別結果</h3>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const evaluation = evaluations[index];
            const answer = answers.find(a => a.questionId === question.id);
            const scorePercent = evaluation ? (evaluation.score / evaluation.maxScore) * 100 : 0;

            return (
              <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      問題 {index + 1}
                    </p>
                    <p className="text-gray-800 line-clamp-2">{question.text}</p>
                  </div>
                  {evaluation && (
                    <div className={`
                      flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                      ${scorePercent >= 80 ? 'bg-green-100' : scorePercent >= 60 ? 'bg-yellow-100' : 'bg-red-100'}
                    `}>
                      <span className={`
                        text-xl font-bold
                        ${scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-yellow-600' : 'text-red-600'}
                      `}>
                        {evaluation.score}
                      </span>
                    </div>
                  )}
                </div>
                {answer && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      詳細を見る
                    </summary>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">あなたの回答:</p>
                        <p className="text-gray-800 mt-1">{answer.userAnswer || '（スキップ）'}</p>
                      </div>
                      {evaluation && (
                        <>
                          <div>
                            <p className="font-medium text-gray-700">模範回答:</p>
                            <p className="text-gray-800 mt-1">{evaluation.modelAnswer}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">フィードバック:</p>
                            <p className="text-gray-800 mt-1">{evaluation.feedback}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          同じ文献で再挑戦
        </button>
        <button
          onClick={onNewSession}
          className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          新しい文献で始める
        </button>
      </div>
    </div>
  );
}
