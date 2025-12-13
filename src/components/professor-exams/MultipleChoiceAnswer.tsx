'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface MultipleChoiceOption {
  id: string;
  text: string;
}

interface MultipleChoiceAnswerProps {
  choices: MultipleChoiceOption[];
  currentAnswer?: string;
  onSubmit: (selectedChoice: string) => Promise<void>;
  isSubmitted?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  showFeedback?: boolean;
}

export function MultipleChoiceAnswer({
  choices,
  currentAnswer,
  onSubmit,
  isSubmitted = false,
  isCorrect,
  correctAnswer,
  showFeedback = false,
}: MultipleChoiceAnswerProps) {
  const [selectedChoice, setSelectedChoice] = useState<string>(currentAnswer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedChoice) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedChoice);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChoiceClassName = (choiceId: string) => {
    if (!showFeedback) return '';
    
    if (choiceId === correctAnswer) {
      return 'border-green-500 bg-green-500/10';
    }
    
    if (isSubmitted && choiceId === selectedChoice && !isCorrect) {
      return 'border-red-500 bg-red-500/10';
    }
    
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <div 
            key={choice.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border ${getChoiceClassName(choice.id)}`}
          >
            <input
              type="radio"
              name="multiple-choice"
              value={choice.id}
              checked={selectedChoice === choice.id}
              onChange={() => setSelectedChoice(choice.id)}
              disabled={isSubmitted}
              id={`choice-${choice.id}`}
              className="h-4 w-4"
            />
            <label 
              htmlFor={`choice-${choice.id}`} 
              className="flex-1 cursor-pointer font-normal"
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {choice.text}
            </label>
            
            {showFeedback && choice.id === correctAnswer && (
              <span className="text-green-400 text-sm font-medium">✓ Correct</span>
            )}
            
            {showFeedback && isSubmitted && choice.id === selectedChoice && !isCorrect && (
              <span className="text-red-400 text-sm font-medium">✗ Incorrect</span>
            )}
          </div>
        ))}
      </div>

      {!isSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedChoice || isSubmitting}
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
        </div>
      )}
    </div>
  );
}
