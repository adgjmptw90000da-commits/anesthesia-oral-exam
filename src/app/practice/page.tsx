'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSpeech } from '@/hooks/useSpeech';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { AnswerInput } from '@/components/AnswerInput';
import { EvaluationDisplay } from '@/components/EvaluationDisplay';
import { ResultsSummary } from '@/components/ResultsSummary';
import { Question, ScenarioContext, Answer, Evaluation, QuestionMode } from '@/types';

type PracticePhase = 'loading' | 'question' | 'evaluation' | 'results';

interface SessionData {
  pdfContent: string;
  pdfFileName: string;
  mode: QuestionMode;
  questionCount: number;
}

export default function PracticePage() {
  const router = useRouter();
  const speech = useSpeech();

  const [phase, setPhase] = useState<PracticePhase>('loading');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scenarioContext, setScenarioContext] = useState<ScenarioContext | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const hasReadCurrentQuestion = useRef(false);

  // Load session data and generate questions
  useEffect(() => {
    const loadSession = async () => {
      const stored = sessionStorage.getItem('examSession');
      if (!stored) {
        router.push('/');
        return;
      }

      const data: SessionData = JSON.parse(stored);
      setSessionData(data);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: data.mode,
            pdfContent: data.pdfContent,
            questionCount: data.questionCount,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '問題の生成に失敗しました');
        }

        if (data.mode === 'scenario' && result.scenario) {
          setScenarioContext(result.scenario);
          setQuestions(result.scenario.questions);
        } else {
          setQuestions(result.questions);
        }

        setPhase('question');
      } catch (err) {
        setError(err instanceof Error ? err.message : '問題の生成に失敗しました');
      }
    };

    loadSession();
  }, [router]);

  // Read question aloud when entering question phase (only once per question)
  useEffect(() => {
    if (phase === 'question' && questions[currentIndex] && autoReadEnabled && !hasReadCurrentQuestion.current) {
      hasReadCurrentQuestion.current = true;

      const readQuestion = async () => {
        // Small delay to ensure UI is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        let textToRead = '';

        // Include scenario context for first question
        if (scenarioContext && currentIndex === 0) {
          textToRead += `シナリオ: ${scenarioContext.title}。${scenarioContext.description}。`;
          if (scenarioContext.patientInfo) {
            textToRead += `患者情報: ${scenarioContext.patientInfo}。`;
          }
        }

        textToRead += `問題${currentIndex + 1}。${questions[currentIndex].text}`;

        await speech.speak(textToRead);
      };

      readQuestion();
    }
  }, [phase, currentIndex, questions, scenarioContext, autoReadEnabled, speech.speak]);

  // Reset read flag when question changes
  useEffect(() => {
    hasReadCurrentQuestion.current = false;
  }, [currentIndex]);

  // Handle voice commands
  useEffect(() => {
    if (!speech.lastCommand) return;

    switch (speech.lastCommand) {
      case 'START_ANSWER':
        if (phase === 'question' && !speech.isListening) {
          speech.startListening();
        }
        break;
      case 'STOP_ANSWER':
        if (speech.isListening) {
          speech.stopListening();
        }
        break;
      case 'NEXT':
        if (phase === 'evaluation') {
          handleNext();
        }
        break;
      case 'SKIP':
        if (phase === 'question') {
          handleSkip();
        }
        break;
      case 'REPEAT':
        if (phase === 'question' && questions[currentIndex]) {
          speech.speak(questions[currentIndex].text);
        }
        break;
    }
  }, [speech.lastCommand]);

  const handleSubmitAnswer = async (answer: string) => {
    if (!sessionData || !questions[currentIndex]) return;

    setIsSubmitting(true);
    speech.stopListening();

    const newAnswer: Answer = {
      questionId: questions[currentIndex].id,
      userAnswer: answer,
      timestamp: Date.now(),
    };
    setAnswers(prev => [...prev, newAnswer]);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentIndex].text,
          userAnswer: answer,
          pdfContent: sessionData.pdfContent,
          scenarioContext: scenarioContext
            ? `${scenarioContext.title}\n${scenarioContext.description}\n${scenarioContext.patientInfo || ''}`
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '評価に失敗しました');
      }

      const evaluation: Evaluation = {
        ...result.evaluation,
        questionId: questions[currentIndex].id,
      };

      setCurrentEvaluation(evaluation);
      setEvaluations(prev => [...prev, evaluation]);
      setPhase('evaluation');

      // Read evaluation aloud
      if (speech.speechSynthesisSupported) {
        const evalText = `${evaluation.score}点です。${evaluation.feedback}。模範回答: ${evaluation.modelAnswer}`;
        speech.speak(evalText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '評価に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const skipAnswer: Answer = {
      questionId: questions[currentIndex].id,
      userAnswer: '',
      timestamp: Date.now(),
    };
    setAnswers(prev => [...prev, skipAnswer]);

    // Create a skip evaluation
    const skipEvaluation: Evaluation = {
      questionId: questions[currentIndex].id,
      score: 0,
      maxScore: 10,
      feedback: 'この問題はスキップされました。',
      modelAnswer: '（スキップされたため模範回答を生成しませんでした）',
      keyPoints: [],
    };

    setCurrentEvaluation(skipEvaluation);
    setEvaluations(prev => [...prev, skipEvaluation]);
    setPhase('evaluation');
  };

  const handleNext = useCallback(() => {
    speech.stopSpeaking();
    speech.resetTranscript();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentEvaluation(null);
      setPhase('question');
    } else {
      setPhase('results');
    }
  }, [currentIndex, questions.length, speech]);

  const handleReadQuestion = () => {
    if (questions[currentIndex]) {
      speech.speak(questions[currentIndex].text);
    }
  };

  const handleReadEvaluation = () => {
    if (currentEvaluation) {
      const evalText = `${currentEvaluation.score}点です。${currentEvaluation.feedback}。模範回答: ${currentEvaluation.modelAnswer}`;
      speech.speak(evalText);
    }
  };

  const handleRestart = () => {
    setQuestions([]);
    setScenarioContext(null);
    setCurrentIndex(0);
    setAnswers([]);
    setEvaluations([]);
    setCurrentEvaluation(null);
    setPhase('loading');

    // Re-trigger loading
    const stored = sessionStorage.getItem('examSession');
    if (stored) {
      const data: SessionData = JSON.parse(stored);
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: data.mode,
          pdfContent: data.pdfContent,
          questionCount: data.questionCount,
        }),
      })
        .then(res => res.json())
        .then(result => {
          if (data.mode === 'scenario' && result.scenario) {
            setScenarioContext(result.scenario);
            setQuestions(result.scenario.questions);
          } else {
            setQuestions(result.questions);
          }
          setPhase('question');
        })
        .catch(err => setError(err.message));
    }
  };

  const handleNewSession = () => {
    sessionStorage.removeItem('examSession');
    router.push('/');
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">エラー</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ホームに戻る
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">問題を生成中...</h2>
              <p className="text-gray-700">AIが文献から問題を作成しています</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results state
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <ResultsSummary
          questions={questions}
          answers={answers}
          evaluations={evaluations}
          onRestart={handleRestart}
          onNewSession={handleNewSession}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            終了
          </button>
          <div className="text-sm text-gray-700">
            {sessionData?.pdfFileName}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span>{sessionData?.mode === 'scenario' ? 'シナリオ問題' : 'シンプル問題'}</span>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          {currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              scenarioContext={currentIndex === 0 ? scenarioContext : null}
              isSpeaking={speech.isSpeaking}
              onReadQuestion={handleReadQuestion}
            />
          )}

          {phase === 'question' && (
            <AnswerInput
              isListening={speech.isListening}
              transcript={speech.transcript}
              onStartListening={speech.startListening}
              onStopListening={speech.stopListening}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
              isSubmitting={isSubmitting}
              speechRecognitionSupported={speech.speechRecognitionSupported}
            />
          )}

          {phase === 'evaluation' && currentEvaluation && currentAnswer && (
            <EvaluationDisplay
              evaluation={currentEvaluation}
              userAnswer={currentAnswer.userAnswer}
              onNext={handleNext}
              onReadEvaluation={handleReadEvaluation}
              isSpeaking={speech.isSpeaking}
              isLastQuestion={currentIndex === questions.length - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
