'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface EssayRequirements {
  word_count: [number, number];
  key_concepts: string[];
  examples_required: boolean;
}

interface EssayData {
  essay_context: string | null;
  essay_requirements: EssayRequirements | null;
  essay_structure_guide: string | null;
}

interface EssayFormProps {
  data: EssayData;
  onChange: (data: Partial<EssayData>) => void;
  errors: Record<string, string>;
}

export default function EssayForm({ data, onChange, errors }: EssayFormProps) {
  const [newConcept, setNewConcept] = useState('');

  const requirements = data.essay_requirements || {
    word_count: [200, 500],
    key_concepts: [],
    examples_required: false,
  };

  const handleContextChange = (value: string) => {
    onChange({ essay_context: value });
  };

  const handleWordCountChange = (index: 0 | 1, value: number) => {
    const newWordCount: [number, number] = [...requirements.word_count];
    newWordCount[index] = value;
    onChange({
      essay_requirements: {
        ...requirements,
        word_count: newWordCount,
      },
    });
  };

  const handleExamplesRequiredChange = (value: boolean) => {
    onChange({
      essay_requirements: {
        ...requirements,
        examples_required: value,
      },
    });
  };

  const handleAddConcept = () => {
    if (!newConcept.trim()) return;
    onChange({
      essay_requirements: {
        ...requirements,
        key_concepts: [...requirements.key_concepts, newConcept.trim()],
      },
    });
    setNewConcept('');
  };

  const handleRemoveConcept = (index: number) => {
    const updatedConcepts = requirements.key_concepts.filter((_, i) => i !== index);
    onChange({
      essay_requirements: {
        ...requirements,
        key_concepts: updatedConcepts,
      },
    });
  };

  const handleUpdateConcept = (index: number, value: string) => {
    const updatedConcepts = [...requirements.key_concepts];
    updatedConcepts[index] = value;
    onChange({
      essay_requirements: {
        ...requirements,
        key_concepts: updatedConcepts,
      },
    });
  };

  const handleStructureGuideChange = (value: string) => {
    onChange({ essay_structure_guide: value || null });
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-4">Essay Question</h2>
      <p className="text-gray-400 text-sm mb-6">
        Students will write a comprehensive essay response demonstrating their understanding
      </p>
      
      {/* Essay Context */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Essay Context / Prompt <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-2">
          Provide background information and the essay prompt
        </p>
        <textarea
          value={data.essay_context || ''}
          onChange={(e) => handleContextChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          placeholder="Discuss the advantages and disadvantages of object-oriented programming compared to functional programming. Consider aspects such as code reusability, maintainability, and performance."
        />
        {errors.essay_context && <p className="text-red-400 text-sm mt-1">{errors.essay_context}</p>}
      </div>

      {/* Word Count Requirements */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Word Count Range <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Minimum Words</label>
            <input
              type="number"
              value={requirements.word_count[0]}
              onChange={(e) => handleWordCountChange(0, parseInt(e.target.value) || 50)}
              min="50"
              max="10000"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Maximum Words</label>
            <input
              type="number"
              value={requirements.word_count[1]}
              onChange={(e) => handleWordCountChange(1, parseInt(e.target.value) || 500)}
              min="50"
              max="10000"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        {errors['essay_requirements.word_count'] && (
          <p className="text-red-400 text-sm mt-1">{errors['essay_requirements.word_count']}</p>
        )}
      </div>

      {/* Key Concepts */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Concepts to Address <span className="text-red-400">*</span>
        </label>
        <p className="text-sm text-gray-400 mb-3">
          List the main topics students must cover in their essay
        </p>
        
        {requirements.key_concepts.length > 0 && (
          <div className="space-y-2 mb-3">
            {requirements.key_concepts.map((concept, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-800/40 p-3 rounded-lg">
                <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => handleUpdateConcept(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Key concept"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveConcept(index)}
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
            value={newConcept}
            onChange={(e) => setNewConcept(e.target.value)}
            placeholder="E.g., 'Encapsulation and data hiding'"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConcept())}
          />
          <Button type="button" onClick={handleAddConcept}>
            Add Concept
          </Button>
        </div>
        {errors['essay_requirements.key_concepts'] && (
          <p className="text-red-400 text-sm mt-1">{errors['essay_requirements.key_concepts']}</p>
        )}
      </div>

      {/* Examples Required */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={requirements.examples_required}
            onChange={(e) => handleExamplesRequiredChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-700 bg-gray-800 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-300">
            Students must provide code examples or real-world applications
          </span>
        </label>
      </div>

      {/* Structure Guide */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Essay Structure Guide (Optional)
        </label>
        <p className="text-sm text-gray-400 mb-2">
          Provide guidance on how students should structure their essay (introduction, body paragraphs, conclusion, etc.)
        </p>
        <textarea
          value={data.essay_structure_guide || ''}
          onChange={(e) => handleStructureGuideChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          placeholder="Introduction (define OOP and FP)
Body Paragraph 1: Discuss code reusability in both paradigms
Body Paragraph 2: Compare maintainability aspects
Body Paragraph 3: Analyze performance considerations
Conclusion: Summarize key findings and provide your perspective"
        />
      </div>

      {/* Grading Note */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h3 className="text-purple-300 font-semibold mb-2">Grading Note</h3>
        <p className="text-sm text-gray-300">
          Essay questions require manual grading. The system will track word count and check for key concepts,
          but a professor must review and assign final points based on content quality, argument strength, and adherence to requirements.
        </p>
      </div>
    </Card>
  );
}
