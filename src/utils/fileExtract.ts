import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
// Import the PDF.js worker as a URL so Vite can serve it
// The `?worker&url` query tells Vite to bundle this as a web worker and give us its URL
// TypeScript is fine with this under Vite's module augmentation
// If your editor complains, it still builds correctly under Vite
// You can also add a d.ts for '*?worker&url' if needed
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import mammoth from 'mammoth';
import type { ParsedDocument } from '@/utils/documentParser';

GlobalWorkerOptions.workerSrc = pdfjsWorker as string;

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

export const extractTextFromPDF = async (file: File): Promise<ParsedDocument> => {
  const data = await readFileAsArrayBuffer(file);
  const pdf = await getDocument({ data }).promise;

  const pages: { page_number: number; content: string }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item: any) => ('str' in item ? item.str : (item as any).text) || '')
      .filter(Boolean);
    const text = strings.join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ page_number: i, content: text });
  }

  const content = pages.map(p => p.content).join('\n');
  return { content, pages };
};

export const extractTextFromDocx = async (file: File): Promise<ParsedDocument> => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const content = (value || '').replace(/\s+$/g, '').trim();
  return {
    content,
    pages: [{ page_number: 1, content }],
  };
};

export const extractTextFromFile = async (file: File): Promise<ParsedDocument> => {
  const mime = file.type;
  if (mime === 'application/pdf') return extractTextFromPDF(file);
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(file);
  }
  // Legacy .doc not supported reliably in-browser
  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
};
