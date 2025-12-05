'use client';

import { useState, useCallback, useRef } from 'react';

interface PDFUploadProps {
  onUploadComplete: (content: string, fileName: string) => void;
}

export function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfjsRef = useRef<typeof import('pdfjs-dist') | null>(null);

  const loadPdfjs = async () => {
    if (!pdfjsRef.current) {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      pdfjsRef.current = pdfjs;
    }
    return pdfjsRef.current;
  };

  const extractText = async (file: File): Promise<string> => {
    const pdfjs = await loadPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDFファイルのみアップロード可能です');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractText(file);

      console.log('Extracted text length:', text.length);
      console.log('First 500 chars:', text.slice(0, 500));

      if (!text || text.trim().length < 10) {
        const confirmContinue = window.confirm(
          'PDFからテキストをほとんど抽出できませんでした。\n' +
          'このPDFはテキストレイヤーを持たない画像PDFの可能性があります。\n\n' +
          '抽出できた文字数: ' + text.trim().length + '文字\n\n' +
          'それでも続行しますか？（テキストが少ないと問題生成の質が低下する可能性があります）'
        );

        if (!confirmContinue) {
          throw new Error('PDFからテキストを抽出できませんでした（画像PDFの可能性があります）');
        }
      }

      onUploadComplete(text, file.name);
    } catch (err) {
      console.error('PDF processing error:', err);
      setError(err instanceof Error ? err.message : 'PDFの処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          id="pdf-upload"
          disabled={isProcessing}
        />
        <label htmlFor="pdf-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isProcessing ? 'PDF解析中...' : 'PDFファイルをドロップ'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                またはクリックしてファイルを選択
              </p>
            </div>
          </div>
        </label>
      </div>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
