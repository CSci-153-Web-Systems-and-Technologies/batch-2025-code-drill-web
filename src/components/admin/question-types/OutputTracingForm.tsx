'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface OutputTracingData {
  code_snippet: string | null;
  expected_output: string | null;
  output_tips?: string[] | null;
}

interface OutputTracingFormProps {
  data: OutputTracingData;
  onChange: (data: Partial<OutputTracingData>) => void;
  errors: Record<string, string>;
}

export default function OutputTracingForm({ data, onChange, errors }: OutputTracingFormProps) {
  const [newTip, setNewTip] = useState('');

  const tips = data.output_tips || [];

  const handleCodeChange = (value: string) => {
    onChange({ code_snippet: value });
  };

  const handleOutputChange = (value: string) => {
    onChange({ expected_output: value });
  };

  const handleAddTip = () => {
    if (!newTip.trim()) return;
    onChange({ output_tips: [...tips, newTip] });
    setNewTip('');
  };

  const handleRemoveTip = (index: number) => {
    const updatedTips = tips.filter((_, i) => i !== index);
    onChange({ output_tips: updatedTips.length > 0 ? updatedTips : null });
  };

  const handleUpdateTip = (index: number, value: string) => {
    const updatedTips = [...tips];
    updatedTips[index] = value;
    onChange({ output_tips: updatedTips });
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-4">Output Tracing</h2>
      <p className="text-gray-400 text-sm mb-6">
        Students will trace through the code execution step-by-step and predict the output
      </p>
      
      {/* Code Snippet */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Code Snippet <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-2">
          Provide the code that students will trace through
        </p>
        <textarea
          value={data.code_snippet || ''}
          onChange={(e) => handleCodeChange(e.target.value)}
          rows={15}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          placeholder="x = 5
y = 10
z = x + y
print(z)
x = x * 2
print(x)"
        />
        {errors.code_snippet && <p className="text-red-400 text-sm mt-1">{errors.code_snippet}</p>}
      </div>

      {/* Expected Output */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Expected Output <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-2">
          The correct output after executing the code
        </p>
        <textarea
          value={data.expected_output || ''}
          onChange={(e) => handleOutputChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          placeholder="15
10"
        />
        {errors.expected_output && <p className="text-red-400 text-sm mt-1">{errors.expected_output}</p>}
      </div>

      {/* Execution Tips */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Execution Tips (Optional)
        </label>
        <p className="text-sm text-gray-400 mb-3">
          Provide hints about execution flow, variable states, or common pitfalls
        </p>
        
        {tips.length > 0 && (
          <div className="space-y-2 mb-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-2 items-start bg-gray-800/40 p-3 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={tip}
                    onChange={(e) => handleUpdateTip(index, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Tip text"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveTip(index)}
                  className="px-3 py-2 text-sm"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            placeholder="E.g., 'Remember that x is reassigned after the first print'"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTip())}
          />
          <Button type="button" onClick={handleAddTip}>
            Add Tip
          </Button>
        </div>
      </div>

      {/* Tracing Guide */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-blue-300 font-semibold mb-2">Grading Note</h3>
        <p className="text-sm text-gray-300">
          Students will trace execution line-by-line. Their output will be compared against the expected output.
          Consider providing tips about execution order, variable state changes, and output formatting.
        </p>
      </div>
    </Card>
  );
}
