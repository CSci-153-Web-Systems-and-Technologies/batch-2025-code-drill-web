'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Problem } from '@/types';
import { submitCode, runCode } from './actions';

// Dynamically import CodeMirror to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      Loading editor...
    </div>
  ),
});

interface ProblemDetailClientProps {
  problem: Problem;
}

type Language = 'javascript' | 'python' | 'java' | 'cpp';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  error?: string;
}

export default function ProblemDetailClient({ problem }: ProblemDetailClientProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState<string>(
    problem.starterCode[selectedLanguage] || ''
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');

  const languageLabels: Record<Language, string> = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    setCode(problem.starterCode[lang] || '');
    setTestResults([]);
    setShowResults(false);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setShowResults(false);
    
    try {
      const result = await runCode({
        problemId: problem.id,
        language: selectedLanguage,
        code,
        testCases: problem.exampleTestCases,
      });

      setTestResults(result.results);
      setShowResults(true);
    } catch (error) {
      console.error('Error running code:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowResults(false);

    try {
      const result = await submitCode({
        problemId: problem.id,
        language: selectedLanguage,
        code,
      });

      setTestResults(result.results);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passedTests = testResults.filter((r) => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/problems" className="text-gray-600 hover:text-gray-900">
              ← Back to Problems
            </a>
            <h1 className="text-xl font-bold text-gray-900">{problem.title}</h1>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                problem.difficulty === 'Easy'
                  ? 'bg-green-100 text-green-700'
                  : problem.difficulty === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Submissions
              </button>
            </div>

            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <div
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: problem.description
                        .replace(/\n/g, '<br/>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                        .replace(/^(Description|Submissions|Example \d+:\*\*|Constraints|Tags)$/gm, '')
                        .replace(/<br\/><br\/>/g, '<br/>')
                        .trim(),
                    }}
                  />
                </div>

                {/* Tags */}
                <div>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Acceptance Rate:</span>{' '}
                    {problem.acceptanceRate.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Submissions:</span>{' '}
                    {problem.totalSubmissions}
                  </div>
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="text-center py-12 text-gray-500">
                <p>Your submission history will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col bg-gray-900">
          {/* Language Selector & Actions */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex gap-2">
              {(Object.keys(languageLabels) as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {languageLabels[lang]}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              language={selectedLanguage}
              onChange={setCode}
            />
          </div>

          {/* Results Panel */}
          {showResults && (
            <div className="h-64 bg-white border-t border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Test Results
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      passedTests === totalTests
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {passedTests} / {totalTests} Passed
                  </span>
                </div>

                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {result.passed ? (
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span className="font-medium text-gray-900">
                          Test Case {index + 1}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-700">Input:</span>{' '}
                          <code className="bg-white px-2 py-0.5 rounded">
                            {result.input}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Expected:
                          </span>{' '}
                          <code className="bg-white px-2 py-0.5 rounded">
                            {result.expectedOutput}
                          </code>
                        </div>
                        {result.actualOutput && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Actual:
                            </span>{' '}
                            <code className="bg-white px-2 py-0.5 rounded">
                              {result.actualOutput}
                            </code>
                          </div>
                        )}
                        {result.error && (
                          <div className="text-red-600 mt-2">
                            <span className="font-medium">Error:</span> {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
