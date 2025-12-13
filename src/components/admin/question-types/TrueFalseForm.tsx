'use client';

import React from 'react';

interface TrueFalseFormProps {
  correctAnswer?: boolean;
  onChange: (correctAnswer: boolean) => void;
}

export function TrueFalseForm({
  correctAnswer,
  onChange,
}: TrueFalseFormProps) {
  const value = correctAnswer === undefined ? '' : String(correctAnswer);

  const handleChange = (newValue: string) => {
    onChange(newValue === 'true');
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            name="true-false-answer"
            value="true"
            checked={value === 'true'}
            onChange={() => handleChange('true')}
            id="true-option"
            className="h-4 w-4"
          />
          <label htmlFor="true-option" className="font-normal cursor-pointer">
            True
          </label>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            name="true-false-answer"
            value="false"
            checked={value === 'false'}
            onChange={() => handleChange('false')}
            id="false-option"
            className="h-4 w-4"
          />
          <label htmlFor="false-option" className="font-normal cursor-pointer">
            False
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Select whether the correct answer is True or False.
      </p>
    </div>
  );
}
