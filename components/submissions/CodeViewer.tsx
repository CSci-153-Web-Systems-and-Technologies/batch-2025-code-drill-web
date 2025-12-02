'use client';

interface Props {
  code: string;
  language: string;
}

export default function CodeViewer({ code, language }: Props) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 px-3 py-1 bg-gray-900 rounded text-xs text-gray-400 font-mono">
        {language}
      </div>
      <pre className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-300 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
