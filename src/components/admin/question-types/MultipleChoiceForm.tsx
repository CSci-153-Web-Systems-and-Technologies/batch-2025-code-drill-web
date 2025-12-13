'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Plus } from 'lucide-react';

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
        <Label>Answer Choices</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={options.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Choice
        </Button>
      </div>

      <RadioGroup value={selectedCorrect} onValueChange={handleCorrectAnswerChange}>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3">
              <div className="flex items-center space-x-2 pt-2">
                <RadioGroupItem value={option.id} id={`option-${option.id}`} />
              </div>
              
              <div className="flex-1">
                <Input
                  placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  className="w-full"
                />
              </div>

              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(option.id)}
                  className="mt-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>

      <p className="text-sm text-muted-foreground">
        Select the radio button next to the correct answer. Min 2 choices, max 10.
      </p>
    </div>
  );
}
