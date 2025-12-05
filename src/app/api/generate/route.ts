import { NextRequest, NextResponse } from 'next/server';
import { generateSimpleQuestions, generateScenario } from '@/lib/gemini';
import { QuestionMode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, pdfContent, questionCount, previousQuestions } = body as {
      mode: QuestionMode;
      pdfContent: string;
      questionCount: number;
      previousQuestions?: string[];
    };

    if (!pdfContent) {
      return NextResponse.json(
        { error: 'PDFコンテンツが必要です' },
        { status: 400 }
      );
    }

    if (mode === 'simple') {
      const questions = await generateSimpleQuestions(
        pdfContent,
        questionCount || 5,
        previousQuestions || []
      );

      return NextResponse.json({
        success: true,
        questions,
      });
    } else if (mode === 'scenario') {
      const scenario = await generateScenario(pdfContent, questionCount || 5);

      return NextResponse.json({
        success: true,
        scenario,
      });
    } else {
      return NextResponse.json(
        { error: '無効なモードです' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: '問題の生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
