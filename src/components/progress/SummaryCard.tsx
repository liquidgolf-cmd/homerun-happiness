import { useState } from 'react';
import { downloadSummaryPDF } from '@/utils/pdfExport';
import { ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BaseStage } from '@/types/conversation';
import { BASE_STAGES } from '@/utils/constants';

interface SummaryCardProps {
  summary: string;
  baseStage: BaseStage;
  loading?: boolean;
}

export default function SummaryCard({ summary, baseStage, loading = false }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const baseInfo = BASE_STAGES.find(b => b.key === baseStage);
  const title = baseInfo?.label || baseStage;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownloadPDF = () => {
    downloadSummaryPDF(summary, baseStage, `${title} - Your Breakthrough Discovery`);
  };

  if (loading) {
    return (
      <div className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-loam shadow-lg p-8 border-2 border-amber-200">
        <div className="flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="ml-4 text-amber-800 font-medium">Generating your breakthrough summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-loam shadow-lg p-8 border-2 border-amber-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">✨</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Your Breakthrough Discovery</h3>
          <p className="text-sm text-amber-700 font-medium">{title}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 mb-6 border border-amber-200">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
          {summary}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-loam font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition shadow-md hover:shadow-lg"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Download Summary PDF
        </button>
        <button
          onClick={handleCopyToClipboard}
          className={`flex items-center gap-2 px-5 py-3 rounded-loam font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition shadow-md hover:shadow-lg ${
            copied
              ? 'bg-green-600 text-white focus:ring-green-500'
              : 'bg-white text-gray-700 border-2 border-amber-300 hover:bg-amber-50 focus:ring-amber-500'
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-5 h-5" />
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
    </div>
  );
}
