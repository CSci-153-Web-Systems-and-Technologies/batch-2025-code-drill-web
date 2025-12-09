'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FillInBlanksData {
  code_snippet: string | null;
  blanks: Record<string, string> | null;
  expected_output?: string | null;
  output_tips?: string[] | null;
}

interface FillInBlanksFormProps {
  data: FillInBlanksData;
  onChange: (data: Partial<FillInBlanksData>) => void;
  errors: Record<string, string>;
}

export default function FillInBlanksForm({ data, onChange, errors }: FillInBlanksFormProps) {
  const [newBlankKey, setNewBlankKey] = useState('');
  const [newBlankValue, setNewBlankValue] = useState('');
  const [newTip, setNewTip] = useState('');

  const blanks = data.blanks || {};
  const tips = data.output_tips || [];

  const handleCodeChange = (value: string) => {
    onChange({ code_snippet: value });
  };

  const handleAddBlank = () => {
    if (!newBlankKey.trim() || !newBlankValue.trim()) return;
    
    const updatedBlanks = { ...blanks, [newBlankKey]: newBlankValue };
    onChange({ blanks: updatedBlanks });
    setNewBlankKey('');
    setNewBlankValue('');
  };

  const handleRemoveBlank = (key: string) => {
    const updatedBlanks = { ...blanks };
    delete updatedBlanks[key];
    onChange({ blanks: Object.keys(updatedBlanks).length > 0 ? updatedBlanks : null });
  };

  const handleUpdateBlank = (oldKey: string, newKey: string, newValue: string) => {
    const updatedBlanks = { ...blanks };
    delete updatedBlanks[oldKey];
    if (newKey.trim() && newValue.trim()) {
      updatedBlanks[newKey] = newValue;
    }
    onChange({ blanks: updatedBlanks });
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

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-4">Fill in the Blanks - Code Analysis</h2>
      
      {/* Code Snippet */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Code Snippet <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-2">
          Use __BLANK_1__, __BLANK_2__, etc. to mark where students should fill in
        </p>
        <textarea
          value={data.code_snippet || ''}
          onChange={(e) => handleCodeChange(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          placeholder="def sum_array(arr):
    total = __BLANK_1__
    for num in arr:
        total __BLANK_2__ num
    return total"
        />
        {errors.code_snippet && <p className="text-red-400 text-sm mt-1">{errors.code_snippet}</p>}
      </div>

      {/* Blanks (Expected Answers) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Blank Answers <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-3">
          Define the correct answer for each blank in the code
        </p>

        {/* Existing Blanks */}
        {Object.keys(blanks).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(blanks).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-start bg-gray-800/40 p-3 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleUpdateBlank(key, e.target.value, value)}
                    placeholder="Blank ID (e.g., 1, 2, 3)"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateBlank(key, key, e.target.value)}
                    placeholder="Expected answer"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveBlank(key)}
                  className="px-3 py-2 text-sm"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Blank */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newBlankKey}
            onChange={(e) => setNewBlankKey(e.target.value)}
            placeholder="Blank ID (e.g., 1)"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={newBlankValue}
            onChange={(e) => setNewBlankValue(e.target.value)}
            placeholder="Expected answer"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <Button type="button" onClick={handleAddBlank}>
            Add Blank
          </Button>
        </div>
        {errors.blanks && <p className="text-red-400 text-sm mt-1">{errors.blanks}</p>}
      </div>

      {/* Expected Output (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Expected Output (Optional)
        </label>
        <p className="text-sm text-gray-400 mb-2">
          Show students what the completed code should output
        </p>
        <textarea
          value={data.expected_output || ''}
          onChange={(e) => onChange({ expected_output: e.target.value || null })}
          rows={4}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          placeholder="Example output after running the completed code"
        />
      </div>

      {/* Output Tips */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hints/Tips (Optional)
        </label>
        
        {tips.length > 0 && (
          <div className="space-y-2 mb-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-800/40 p-3 rounded-lg">
                <span className="text-gray-300 flex-1">{tip}</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveTip(index)}
                  className="px-3 py-1 text-sm"
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
            placeholder="Add a hint for students"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTip())}
          />
          <Button type="button" onClick={handleAddTip}>
            Add Hint
          </Button>
        </div>
      </div>
    </Card>
  );
}
