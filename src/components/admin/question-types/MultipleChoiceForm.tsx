'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface MultipleChoiceOption {
  id: string;
  text: string;
}

interface MultipleChoiceFormProps {
  choices?: MultipleChoiceOption[];
  correctAnswer?: string;
  onChange: (choices: MultipleChoiceOption[], correctAnswer: string) => void;
}

export function MultipleChoiceForm({
  choices = [
    { id: '1', text: '' },
    { id: '2', text: '' },
  ],
  correctAnswer = '',
  onChange,
}: MultipleChoiceFormProps) {
  const [options, setOptions] = useState<MultipleChoiceOption[]>(choices);
  const [selectedCorrect, setSelectedCorrect] = useState<string>(correctAnswer);

  const handleAddOption = () => {
    if (options.length >= 10) return;
    
    const newOption: MultipleChoiceOption = {
      id: String(options.length + 1),
      text: '',
    };
    
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    onChange(updatedOptions, selectedCorrect);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return; // Minimum 2 options
    
    const updatedOptions = options.filter((opt) => opt.id !== id);
    setOptions(updatedOptions);
    
    // If we removed the correct answer, clear it
    const newCorrect = selectedCorrect === id ? '' : selectedCorrect;
    setSelectedCorrect(newCorrect);
    onChange(updatedOptions, newCorrect);
  };

  const handleOptionTextChange = (id: string, text: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === id ? { ...opt, text } : opt
    );
    setOptions(updatedOptions);
    onChange(updatedOptions, selectedCorrect);
  };

  const handleCorrectAnswerChange = (id: string) => {
    setSelectedCorrect(id);
    onChange(options, id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Answer Choices</label>
        <Button
          type="button"
          onClick={handleAddOption}
          disabled={options.length >= 10}
          className="text-sm"
        >
          <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Choice
        </Button>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-start gap-3">
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="radio"
                name="correct-answer"
                value={option.id}
                checked={selectedCorrect === option.id}
                onChange={() => handleCorrectAnswerChange(option.id)}
                id={`option-${option.id}`}
                className="h-4 w-4"
              />
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                value={option.text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOptionTextChange(option.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="mt-1 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        Select the radio button next to the correct answer. Min 2 choices, max 10.
      </p>
    </div>
  );
}
