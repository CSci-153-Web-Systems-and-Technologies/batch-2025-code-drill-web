'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <Label htmlFor="correct-answer">Correct Answer</Label>
        <Input
          id="correct-answer"
          type="text"
          placeholder="Enter the correct answer"
          value={correctAnswer}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Enter the exact answer. Grading will be case-insensitive and trim whitespace.
      </p>
    </div>
  );
}
