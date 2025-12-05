export type QuestionMode = 'simple' | 'scenario';

export interface Question {
  id: string;
  text: string;
  reference?: string;
}

export interface ScenarioContext {
  title: string;
  description: string;
  patientInfo?: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  userAnswer: string;
  timestamp: number;
}

export interface Evaluation {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  modelAnswer: string;
  keyPoints: string[];
}

export interface SessionState {
  mode: QuestionMode;
  pdfContent: string | null;
  pdfFileName: string | null;
  currentQuestionIndex: number;
  questions: Question[];
  scenarioContext: ScenarioContext | null;
  answers: Answer[];
  evaluations: Evaluation[];
  isComplete: boolean;
}

export interface GenerateQuestionRequest {
  mode: QuestionMode;
  pdfContent: string;
  questionCount: number;
  previousQuestions?: string[];
  scenarioContext?: string;
}

export interface EvaluateAnswerRequest {
  question: string;
  userAnswer: string;
  pdfContent: string;
  scenarioContext?: string;
}
