'use client';

import { useState, useEffect } from 'react';

interface CodeWithBlanksProps {
  codeSnippet: string;
  blanks: Record<string, string>; // Expected answers
  userAnswers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  showCorrectness?: boolean; // For auto-grading feedback
}

export default function CodeWithBlanks({
  codeSnippet,
  blanks,
  userAnswers,
  onChange,
  showCorrectness = false,
}: CodeWithBlanksProps) {
  // Parse code snippet to find blanks like ___1___, ___2___, etc.
  const renderCodeWithBlanks = () => {
    const blankPattern = /___(\d+)___/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = blankPattern.exec(codeSnippet)) !== null) {
      const blankNumber = match[1];
      const blankKey = blankNumber;
      
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {codeSnippet.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the input field for the blank
      const userAnswer = userAnswers[blankKey] || '';
      const expectedAnswer = blanks[blankKey] || '';
      const isCorrect = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
      
      parts.push(
        <input
          key={`blank-${blankKey}`}
          type="text"
          value={userAnswer}
          onChange={(e) => {
            const newAnswers = { ...userAnswers, [blankKey]: e.target.value };
            onChange(newAnswers);
          }}
          className={`inline-block px-2 py-1 border-b-2 font-mono bg-gray-800 text-white focus:outline-none focus:bg-gray-700 min-w-[60px] max-w-[200px] ${
            showCorrectness
              ? isCorrect
                ? 'border-green-500 bg-green-900/20'
                : userAnswer
                ? 'border-red-500 bg-red-900/20'
                : 'border-yellow-500'
              : 'border-blue-500'
          }`}
          placeholder={`blank ${blankNumber}`}
          style={{ width: `${Math.max(60, (userAnswer.length + 1) * 8)}px` }}
        />
      );

      lastIndex = blankPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < codeSnippet.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {codeSnippet.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
      <pre className="text-sm whitespace-pre-wrap">
        <code>{renderCodeWithBlanks()}</code>
      </pre>
    </div>
  );
}
