'use server';

import { createClient } from '@/lib/supabase/server';

interface TestCase {
  input: string;
  output: string;
}

interface RunCodeParams {
  problemId: string;
  language: string;
  code: string;
  testCases: TestCase[];
}

interface SubmitCodeParams {
  problemId: string;
  language: string;
  code: string;
}

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++ (GCC 9.2.0)
};

export async function runCode({ problemId, language, code, testCases }: RunCodeParams) {
  try {
    // For now, return mock results
    // TODO: Integrate with Judge0 API
    const results = testCases.map((testCase, index) => ({
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: testCase.output, // Mock: always pass for now
      passed: true,
      error: undefined,
    }));

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error running code:', error);
    return {
      success: false,
      results: [],
      error: 'Failed to execute code',
    };
  }
}

export async function submitCode({ problemId, language, code }: SubmitCodeParams) {
  const supabase = await createClient();

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get problem with all test cases
    const { data: problem } = await supabase
      .from('problems')
      .select('example_test_cases, hidden_test_cases')
      .eq('id', problemId)
      .single();

    if (!problem) {
      throw new Error('Problem not found');
    }

    const allTestCases = [
      ...(problem.example_test_cases || []),
      ...(problem.hidden_test_cases || []),
    ];

    // For now, return mock results
    // TODO: Integrate with Judge0 API to run against all test cases
    const results = allTestCases.map((testCase) => ({
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: testCase.output, // Mock: always pass for now
      passed: true,
      error: undefined,
    }));

    const allPassed = results.every((r) => r.passed);
    const status = allPassed ? 'Accepted' : 'Wrong Answer';

    // Save submission to database
    const { error: insertError } = await supabase.from('submissions').insert({
      user_id: user.id,
      problem_id: problemId,
      language,
      code,
      status,
      test_cases_passed: results.filter((r) => r.passed).length,
      total_test_cases: results.length,
    });

    if (insertError) {
      console.error('Error saving submission:', insertError);
    }

    // Update user_problem_progress
    if (allPassed) {
      const { error: progressError } = await supabase
        .from('user_problem_progress')
        .upsert(
          {
            user_id: user.id,
            problem_id: problemId,
            status: 'Solved',
            solved_at: new Date().toISOString(),
            attempts: 1, // TODO: Increment existing attempts
          },
          {
            onConflict: 'user_id,problem_id',
          }
        );

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }
    }

    return {
      success: true,
      results,
      status,
    };
  } catch (error) {
    console.error('Error submitting code:', error);
    return {
      success: false,
      results: [],
      error: 'Failed to submit code',
    };
  }
}

// Function to execute code using Judge0 API (for future implementation)
async function executeWithJudge0(
  language: string,
  code: string,
  input: string
): Promise<{ output: string; error?: string }> {
  const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

  if (!JUDGE0_API_KEY) {
    throw new Error('Judge0 API key not configured');
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    // Submit code for execution
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(input).toString('base64'),
      }),
    });

    const { token } = await submitResponse.json();

    // Poll for results
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      });

      const result = await resultResponse.json();

      if (result.status.id > 2) {
        // Completed
        const output = result.stdout
          ? Buffer.from(result.stdout, 'base64').toString()
          : '';
        const error = result.stderr
          ? Buffer.from(result.stderr, 'base64').toString()
          : result.compile_output
          ? Buffer.from(result.compile_output, 'base64').toString()
          : undefined;

        return { output: output.trim(), error };
      }

      attempts++;
    }

    throw new Error('Execution timeout');
  } catch (error) {
    console.error('Judge0 execution error:', error);
    throw error;
  }
}
