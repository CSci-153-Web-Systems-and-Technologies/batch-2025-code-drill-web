'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface TrueFalseAnswerProps {
  currentAnswer?: boolean;
  onSubmit: (answer: boolean) => Promise<void>;
  isSubmitted?: boolean;
  isCorrect?: boolean;
  correctAnswer?: boolean;
  showFeedback?: boolean;
}

export function TrueFalseAnswer({
  currentAnswer,
  onSubmit,
  isSubmitted = false,
  isCorrect,
  correctAnswer,
  showFeedback = false,
}: TrueFalseAnswerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(
    currentAnswer !== undefined ? String(currentAnswer) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedAnswer === '') return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedAnswer === 'true');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionClassName = (value: string) => {
    if (!showFeedback) return 'border-gray-700';
    
    const isCorrectOption = String(correctAnswer) === value;
    const isSelectedOption = selectedAnswer === value;
    
    if (isCorrectOption) {
      return 'border-green-500 bg-green-500/10';
    }
    
    if (isSubmitted && isSelectedOption && !isCorrect) {
      return 'border-red-500 bg-red-500/10';
    }
    
    return 'border-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getOptionClassName('true')}`}>
          <input
            type="radio"
            name="true-false"
            value="true"
            checked={selectedAnswer === 'true'}
            onChange={() => setSelectedAnswer('true')}
            disabled={isSubmitted}
            id="true-option"
            className="h-4 w-4"
          />
          <label 
            htmlFor="true-option" 
            className="flex-1 cursor-pointer font-normal text-lg text-gray-200"
          >
            True
          </label>
          
          {showFeedback && correctAnswer === true && (
            <span className="text-green-400 text-sm font-medium">✓ Correct</span>
          )}
          
          {showFeedback && isSubmitted && selectedAnswer === 'true' && !isCorrect && (
            <span className="text-red-400 text-sm font-medium">✗ Incorrect</span>
          )}
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getOptionClassName('false')}`}>
          <input
            type="radio"
            name="true-false"
            value="false"
            checked={selectedAnswer === 'false'}
            onChange={() => setSelectedAnswer('false')}
            disabled={isSubmitted}
            id="false-option"
            className="h-4 w-4"
          />
          <label 
            htmlFor="false-option" 
            className="flex-1 cursor-pointer font-normal text-lg text-gray-200"
          >
            False
          </label>
          
          {showFeedback && correctAnswer === false && (
            <span className="text-green-400 text-sm font-medium">✓ Correct</span>
          )}
          
          {showFeedback && isSubmitted && selectedAnswer === 'false' && !isCorrect && (
            <span className="text-red-400 text-sm font-medium">✗ Incorrect</span>
          )}
        </div>
      </div>

      {!isSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === '' || isSubmitting}
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
          {showFeedback && !isCorrect && (
            <p className="text-sm mt-1 text-gray-300">
              The correct answer is: <span className="font-medium">{correctAnswer ? 'True' : 'False'}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
