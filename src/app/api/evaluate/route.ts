import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userAnswer, pdfContent, scenarioContext } = body as {
      question: string;
      userAnswer: string;
      pdfContent: string;
      scenarioContext?: string;
    };

    if (!question || !userAnswer || !pdfContent) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const evaluation = await evaluateAnswer(
      question,
      userAnswer,
      pdfContent,
      scenarioContext
    );

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: '回答の評価中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
