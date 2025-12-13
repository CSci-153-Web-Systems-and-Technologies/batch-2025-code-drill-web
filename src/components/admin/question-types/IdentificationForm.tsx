'use client';

import React from 'react';

interface IdentificationFormProps {
  correctAnswer?: string;
  onChange: (correctAnswer: string) => void;
}

export function IdentificationForm({
  correctAnswer = '',
  onChange,
}: IdentificationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="correct-answer" className="block text-sm font-medium text-gray-700">
          Correct Answer
        </label>
        <input
          id="correct-answer"
          type="text"
          placeholder="Enter the correct answer"
          value={correctAnswer}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <p className="text-sm text-gray-500">
        Enter the exact answer. Grading will be case-insensitive and trim whitespace.
      </p>
    </div>
  );
}
