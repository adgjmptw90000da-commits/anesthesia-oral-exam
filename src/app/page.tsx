'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PDFUpload } from '@/components/PDFUpload';
import { QuestionMode } from '@/types';

export default function Home() {
  const router = useRouter();
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<QuestionMode>('simple');
  const [questionCount, setQuestionCount] = useState(5);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (content: string, fileName: string) => {
    setPdfContent(content);
    setPdfFileName(fileName);
    setError(null);
  };

  const handleStart = async () => {
    if (!pdfContent) {
      setError('PDFファイルをアップロードしてください');
      return;
    }

    setIsStarting(true);
    setError(null);

    // Store session data in sessionStorage
    sessionStorage.setItem('examSession', JSON.stringify({
      pdfContent,
      pdfFileName,
      mode,
      questionCount,
    }));

    router.push('/practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            麻酔科口頭試問対策
          </h1>
          <p className="text-lg text-gray-800">
            PDFの文献を元にAIが問題を作成・採点します
          </p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* PDF Upload Section */}
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              1. 参考文献をアップロード
            </h2>
            <PDFUpload onUploadComplete={handleUploadComplete} />
            {pdfFileName && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">{pdfFileName}</span>
              </div>
            )}
          </section>

          {/* Mode Selection */}
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              2. 問題形式を選択
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('simple')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  mode === 'simple'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  シンプル問題
                </h3>
                <p className="text-sm text-gray-700">
                  基本的な知識を問う問題を連続で出題します。短時間で効率よく学習できます。
                </p>
              </button>
              <button
                onClick={() => setMode('scenario')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  mode === 'scenario'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  シナリオ問題
                </h3>
                <p className="text-sm text-gray-700">
                  実際の症例に基づいた臨床シナリオで、段階的に問題が進行します。
                </p>
              </button>
            </div>
          </section>

          {/* Question Count */}
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              3. 問題数を設定
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="10"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                {questionCount}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              {mode === 'simple' ? `${questionCount}問連続で出題されます` : `1シナリオに対して${questionCount}問出題されます`}
            </p>
          </section>

          {/* Start Button */}
          <section>
            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700">
                {error}
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={!pdfContent || isStarting}
              className={`
                w-full py-5 rounded-xl font-bold text-xl transition-all
                ${pdfContent && !isStarting
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-700 cursor-not-allowed'}
              `}
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  準備中...
                </span>
              ) : (
                '問題を開始する'
              )}
            </button>
          </section>

          {/* Voice Control Info */}
          <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              音声操作対応
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              運転中でも使用できるよう、以下の音声コマンドに対応しています：
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>・「回答開始」「開始」 - 回答の録音を開始</li>
              <li>・「回答終了」「終了」 - 回答の録音を終了</li>
              <li>・「次へ」 - 次の問題へ進む</li>
              <li>・「もう一度」「リピート」 - 問題を再度読み上げ</li>
              <li>・「スキップ」「パス」 - 問題をスキップ</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
