// PDF処理はクライアントサイドで行うため、このファイルは使用されません
// src/components/PDFUpload.tsx を参照してください

export async function extractTextFromPDF(_buffer: ArrayBuffer): Promise<string> {
  throw new Error('PDF処理はクライアントサイドで行われます');
}
