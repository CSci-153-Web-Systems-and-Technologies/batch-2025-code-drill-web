'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface IdentificationAnswerProps {
  currentAnswer?: string;
  onSubmit: (answer: string) => Promise<void>;
  isSubmitted?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  showFeedback?: boolean;
}

export function IdentificationAnswer({
  currentAnswer = '',
  onSubmit,
  isSubmitted = false,
  isCorrect,
  correctAnswer,
  showFeedback = false,
}: IdentificationAnswerProps) {
  const [answer, setAnswer] = useState<string>(currentAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitted && answer.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitted}
          placeholder="Type your answer here..."
          className={`w-full px-3 py-2 border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showFeedback && isSubmitted
              ? isCorrect
                ? 'border-green-500 bg-green-500/10'
                : 'border-red-500 bg-red-500/10'
              : 'border-gray-300'
          }`}
        />
      </div>

      {!isSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      )}

      {showFeedback && isSubmitted && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50'}`}>
          <p className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {showFeedback && !isCorrect && correctAnswer && (
            <p className="text-sm mt-2">
              The correct answer is: <span className="font-medium">{correctAnswer}</span>
            </p>
          )}
          {!isCorrect && (
            <p className="text-sm mt-1 text-gray-400">
              Your answer: {answer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
