import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question, ScenarioContext, Evaluation } from '@/types';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(apiKey);
};

export async function generateSimpleQuestions(
  pdfContent: string,
  questionCount: number,
  previousQuestions: string[] = []
): Promise<Question[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const previousQuestionsText = previousQuestions.length > 0
    ? `\n\n以下の問題は既に出題済みなので、異なる問題を作成してください:\n${previousQuestions.join('\n')}`
    : '';

  const prompt = `あなたは麻酔科の口頭試問の試験官です。以下の文献内容に基づいて、麻酔科口頭試問形式の知識問題を${questionCount}問作成してください。

【重要な注意事項】
- 各問題は1つの明確な質問のみを含めてください
- 複数の回答を一度に求めるような問題は避けてください（例：「〜を3つ挙げよ」のような形式は避ける）
- 「〜について説明せよ」「〜とは何か」のような形式を使用してください
- 文献内容から逸脱しない範囲で出題してください
${previousQuestionsText}

【文献内容について】
※この文献はOCRで読み取られたため、一部に誤字や文字化けがある可能性があります。
文脈から適切に解釈して、内容を理解してください。

【文献内容】
${pdfContent.slice(0, 15000)}

【出力形式】
以下のJSON形式で出力してください。他の文章は含めないでください:
{
  "questions": [
    {"id": "q1", "text": "問題文1"},
    {"id": "q2", "text": "問題文2"}
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse questions from response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.questions;
}

export async function generateScenario(
  pdfContent: string,
  questionCount: number
): Promise<ScenarioContext> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `あなたは麻酔科の口頭試問の試験官です。以下の文献内容に基づいて、麻酔科口頭試問形式のシナリオ問題を作成してください。

【重要な注意事項】
- 実際の臨床シナリオを想定した症例を作成してください
- 患者情報（年齢、性別、既往歴、現病歴など）を含めてください
- シナリオに関連する問題を${questionCount}問作成してください
- 各問題は1つの明確な質問のみを含めてください
- 複数の回答を一度に求めるような問題は避けてください
- 問題は段階的に進行するように設計してください（術前評価→麻酔計画→術中管理→合併症対応など）
- 文献内容から逸脱しない範囲で出題してください

【文献内容について】
※この文献はOCRで読み取られたため、一部に誤字や文字化けがある可能性があります。
文脈から適切に解釈して、内容を理解してください。

【文献内容】
${pdfContent.slice(0, 15000)}

【出力形式】
以下のJSON形式で出力してください。他の文章は含めないでください:
{
  "title": "シナリオタイトル",
  "description": "シナリオの概要説明",
  "patientInfo": "患者情報（年齢、性別、身長、体重、既往歴、現病歴、予定手術など）",
  "questions": [
    {"id": "s1", "text": "問題文1"},
    {"id": "s2", "text": "問題文2"}
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse scenario from response');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function evaluateAnswer(
  question: string,
  userAnswer: string,
  pdfContent: string,
  scenarioContext?: string
): Promise<Evaluation> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const scenarioText = scenarioContext
    ? `\n【シナリオ情報】\n${scenarioContext}\n`
    : '';

  const prompt = `あなたは麻酔科の口頭試問の試験官です。以下の問題に対する受験者の回答を評価してください。

【問題】
${question}
${scenarioText}
【受験者の回答】
${userAnswer}

【参考文献について】
※この文献はOCRで読み取られたため、一部に誤字や文字化けがある可能性があります。
文脈から適切に解釈して、内容を理解してください。

【参考文献】
${pdfContent.slice(0, 10000)}

【評価基準】
- 10点満点で採点してください
- 文献内容に基づいた正確性を重視してください
- 臨床的な妥当性も考慮してください
- 回答が不完全でも、正しい方向性であれば部分点を与えてください

【出力形式】
以下のJSON形式で出力してください。他の文章は含めないでください:
{
  "score": 7,
  "maxScore": 10,
  "feedback": "評価コメント（良かった点、改善点を含む）",
  "modelAnswer": "模範回答",
  "keyPoints": ["重要ポイント1", "重要ポイント2", "重要ポイント3"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse evaluation from response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    questionId: '',
    ...parsed
  };
}
