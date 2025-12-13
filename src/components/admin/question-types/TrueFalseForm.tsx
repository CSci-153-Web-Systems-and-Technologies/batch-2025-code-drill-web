'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
      <Label>Correct Answer</Label>
      
      <RadioGroup value={value} onValueChange={handleChange}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="true" id="true-option" />
            <Label htmlFor="true-option" className="font-normal cursor-pointer">
              True
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="false" id="false-option" />
            <Label htmlFor="false-option" className="font-normal cursor-pointer">
              False
            </Label>
          </div>
        </div>
      </RadioGroup>

      <p className="text-sm text-muted-foreground">
        Select whether the correct answer is True or False.
      </p>
    </div>
  );
}
