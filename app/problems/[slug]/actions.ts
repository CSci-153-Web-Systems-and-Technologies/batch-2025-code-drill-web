  'use server';

import { createClient } from '@/lib/supabase/server';
import { calculatePoints, type Difficulty } from '@/lib/scoring';

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

// Wrap user code with boilerplate to create a complete executable program
function wrapCodeForExecution(language: string, code: string, problemSlug: string): string {
  if (language === 'cpp') {
    return wrapCppCode(code, problemSlug);
  }
  // For other languages, return code as-is for now
  return code;
}

// Generate C++ wrapper with main() function based on problem
function wrapCppCode(userCode: string, problemSlug: string): string {
  // Add comprehensive C++ headers if not already present
  let wrappedCode = '';
  
  if (!userCode.includes('#include')) {
    wrappedCode += '#include <iostream>\n';
    wrappedCode += '#include <vector>\n';
    wrappedCode += '#include <string>\n';
    wrappedCode += '#include <sstream>\n';
    wrappedCode += '#include <unordered_map>\n';
    wrappedCode += '#include <unordered_set>\n';
    wrappedCode += '#include <map>\n';
    wrappedCode += '#include <set>\n';
    wrappedCode += '#include <queue>\n';
    wrappedCode += '#include <stack>\n';
    wrappedCode += '#include <algorithm>\n';
    wrappedCode += '#include <climits>\n';
    wrappedCode += '#include <cmath>\n';
    wrappedCode += 'using namespace std;\n\n';
  }
  
  wrappedCode += userCode + '\n\n';
  
  // Add main() function based on problem signature
  switch (problemSlug) {
    case 'two-sum':
      wrappedCode += `
int main() {
    Solution solution;
    string line;
    getline(cin, line);
    
    // Parse input: "[2,7,11,15], 9"
    size_t commaPos = line.find("], ");
    string arrStr = line.substr(1, commaPos - 1);
    int target = stoi(line.substr(commaPos + 3));
    
    vector<int> nums;
    stringstream ss(arrStr);
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    vector<int> result = solution.twoSum(nums, target);
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    
    return 0;
}`;
      break;
      
    case 'palindrome-number':
      wrappedCode += `
int main() {
    Solution solution;
    int x;
    cin >> x;
    cout << (solution.isPalindrome(x) ? "true" : "false") << endl;
    return 0;
}`;
      break;
      
    case 'reverse-string':
      wrappedCode += `
int main() {
    Solution solution;
    string line;
    getline(cin, line);
    
    // Parse input: ["h","e","l","l","o"]
    vector<char> s;
    for (size_t i = 0; i < line.length(); i++) {
        if (line[i] == '"' && i + 1 < line.length() && line[i + 2] == '"') {
            s.push_back(line[i + 1]);
        }
    }
    
    solution.reverseString(s);
    
    cout << "[";
    for (size_t i = 0; i < s.size(); i++) {
        cout << "\\"" << s[i] << "\\"";
        if (i < s.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    
    return 0;
}`;
      break;
      
    case 'valid-parentheses':
      wrappedCode += `
int main() {
    Solution solution;
    string s;
    getline(cin, s);
    cout << (solution.isValid(s) ? "true" : "false") << endl;
    return 0;
}`;
      break;
      
    case 'maximum-subarray':
      wrappedCode += `
int main() {
    Solution solution;
    string line;
    getline(cin, line);
    
    // Parse input: "[-2,1,-3,4,-1,2,1,-5,4]"
    vector<int> nums;
    stringstream ss(line.substr(1, line.length() - 2));
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    cout << solution.maxSubArray(nums) << endl;
    return 0;
}`;
      break;
      
    case 'longest-substring-without-repeating-characters':
      wrappedCode += `
int main() {
    Solution solution;
    string s;
    getline(cin, s);
    cout << solution.lengthOfLongestSubstring(s) << endl;
    return 0;
}`;
      break;
      
    case 'median-of-two-sorted-arrays':
      wrappedCode += `
int main() {
    Solution solution;
    string line;
    getline(cin, line);
    
    // Parse input: "[1,3], [2]"
    size_t splitPos = line.find("], [");
    string arr1Str = line.substr(1, splitPos - 1);
    string arr2Str = line.substr(splitPos + 4, line.length() - splitPos - 5);
    
    vector<int> nums1, nums2;
    
    if (!arr1Str.empty()) {
        stringstream ss1(arr1Str);
        string num;
        while (getline(ss1, num, ',')) {
            nums1.push_back(stoi(num));
        }
    }
    
    if (!arr2Str.empty()) {
        stringstream ss2(arr2Str);
        string num;
        while (getline(ss2, num, ',')) {
            nums2.push_back(stoi(num));
        }
    }
    
    double result = solution.findMedianSortedArrays(nums1, nums2);
    cout << fixed;
    cout.precision(5);
    cout << result << endl;
    return 0;
}`;
      break;
      
    case 'regular-expression-matching':
      wrappedCode += `
int main() {
    Solution solution;
    string line;
    getline(cin, line);
    
    // Parse input: "aa, a*"
    size_t commaPos = line.find(", ");
    string s = line.substr(0, commaPos);
    string p = line.substr(commaPos + 2);
    
    cout << (solution.isMatch(s, p) ? "true" : "false") << endl;
    return 0;
}`;
      break;
      
    default:
      // Generic wrapper - assumes simple input/output
      wrappedCode += `
int main() {
    Solution solution;
    // Add your main function implementation here
    return 0;
}`;
  }
  
  return wrappedCode;
}

// Function to execute code using Judge0 API
async function executeWithJudge0(
  language: string,
  code: string,
  input: string,
  problemSlug: string = ''
): Promise<{ output: string; error?: string; status?: string }> {
  const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

  if (!JUDGE0_API_KEY) {
    throw new Error('Judge0 API key not configured');
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Wrap code with necessary boilerplate (especially for C++)
  const executableCode = wrapCodeForExecution(language, code, problemSlug);

  // Helper: fetch with exponential backoff on 429
  async function fetchWithBackoff(url: string, options: RequestInit, maxRetries = 3) {
    let attempt = 0;
    let delayMs = 1000;
    while (true) {
      const res = await fetch(url, options);
      if (res.status !== 429) return res;
      if (attempt >= maxRetries) return res;
      await new Promise((r) => setTimeout(r, delayMs));
      attempt++;
      delayMs = Math.min(delayMs * 2, 8000);
    }
  }

  try {
    // Submit code for execution
    const submitResponse = await fetchWithBackoff(
      `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
          source_code: Buffer.from(executableCode).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(input).toString('base64'),
        }),
      }
    );

    if (!submitResponse.ok) {
      if (submitResponse.status === 429) {
        return { output: '', error: 'Service busy — please retry in a few seconds.', status: 'Too Many Requests' };
      }
      throw new Error(`Judge0 submission failed: ${submitResponse.statusText}`);
    }

    const { token } = await submitResponse.json();

    // Poll for results
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await fetchWithBackoff(
        `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=true`,
        {
          headers: {
            'X-RapidAPI-Key': JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        }
      );

      if (!resultResponse.ok) {
        if (resultResponse.status === 429) {
          return { output: '', error: 'Service busy — please retry in a few seconds.', status: 'Too Many Requests' };
        }
        throw new Error(`Judge0 result fetch failed: ${resultResponse.statusText}`);
      }

      const result = await resultResponse.json();

      // Status IDs: 1-2 = In Queue/Processing, 3 = Accepted, 4+ = Various errors
      if (result.status.id > 2) {
        // Completed
        const output = result.stdout
          ? Buffer.from(result.stdout, 'base64').toString().trim()
          : '';
        
        let error: string | undefined;
        
        // Check for compilation errors
        if (result.compile_output) {
          error = Buffer.from(result.compile_output, 'base64').toString();
        }
        // Check for runtime errors
        else if (result.stderr) {
          error = Buffer.from(result.stderr, 'base64').toString();
        }
        // Check for other error statuses
        else if (result.status.id !== 3) {
          error = result.status.description || 'Unknown error';
        }

        return { 
          output, 
          error,
          status: result.status.description
        };
      }

      attempts++;
    }

    throw new Error('Execution timeout');
  } catch (error) {
    console.error('Judge0 execution error:', error);
    throw error;
  }
}

export async function runCode({ problemId, language, code, testCases }: RunCodeParams) {
  try {
    // Get problem slug from problemId
    const supabase = await createClient();
    const { data: problem } = await supabase
      .from('problems')
      .select('slug')
      .eq('id', problemId)
      .single();
    
    const problemSlug = problem?.slug || '';
    
    // Execute test cases sequentially to avoid Judge0 rate-limit bursts
    const results: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean; error?: string; }> = [];
    for (const testCase of testCases) {
      try {
        const result = await executeWithJudge0(language, code, testCase.input, problemSlug);
        
        if (result.error) {
          results.push({
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: result.output || '',
            passed: false,
            error: result.error,
          });
          continue;
        }

        const expectedOutput = testCase.output.trim();
        const actualOutput = result.output.trim();
        const passed = expectedOutput === actualOutput;

        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.output,
          passed,
          error: undefined,
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          passed: false,
          error: error instanceof Error ? error.message : 'Execution failed',
        });
      }
    }

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
  const submissionStartTime = Date.now();

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get problem with all test cases and difficulty
    const { data: problem } = await supabase
      .from('problems')
      .select('example_test_cases, hidden_test_cases, difficulty, slug')
      .eq('id', problemId)
      .single();

    if (!problem) {
      throw new Error('Problem not found');
    }

    // Check if user has attempted this problem before
    const { data: existingProgress } = await supabase
      .from('user_problem_progress')
      .select('status, attempts')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single();

    const isFirstAttempt = !existingProgress || existingProgress.attempts === 0;

    const allTestCases = [
      ...(problem.example_test_cases || []),
      ...(problem.hidden_test_cases || []),
    ];

    // Execute all test cases in parallel using Judge0 API
    const executionPromises = allTestCases.map(async (testCase) => {
      try {
        const result = await executeWithJudge0(language, code, testCase.input, problem.slug);
        
        if (result.error) {
          return {
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: result.output || '',
            passed: false,
            error: result.error,
          };
        }

        const expectedOutput = testCase.output.trim();
        const actualOutput = result.output.trim();
        const passed = expectedOutput === actualOutput;

        return {
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.output,
          passed,
          error: undefined,
        };
      } catch (error) {
        return {
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          passed: false,
          error: error instanceof Error ? error.message : 'Execution failed',
        };
      }
    });

    const results = await Promise.all(executionPromises);

    const allPassed = results.every((r) => r.passed);
    const hasCompilationError = results.some((r) => r.error && r.error.includes('error'));
    
    let status = 'Accepted';
    if (hasCompilationError) {
      status = 'Compilation Error';
    } else if (!allPassed) {
      status = 'Wrong Answer';
    }

    // Calculate solve time in seconds
    const solveTimeSeconds = Math.floor((Date.now() - submissionStartTime) / 1000);

    // Calculate points if submission passed
    let pointsEarned = 0;
    let pointsBreakdown = null;

    if (allPassed) {
      pointsBreakdown = calculatePoints(
        problem.difficulty as Difficulty,
        isFirstAttempt,
        solveTimeSeconds
      );
      pointsEarned = pointsBreakdown.totalPoints;
    }

    // Save submission to database with backward-compatible fallbacks
    const basePayload: any = {
      user_id: user.id,
      problem_id: problemId,
      language,
      code,
      status,
      test_cases_passed: results.filter((r) => r.passed).length,
      total_test_cases: results.length,
    };

    // Try with extended fields first (new schema)
    let insertError: any | null = null;
    {
      const extendedPayload = {
        ...basePayload,
        points_earned: pointsEarned,
        solve_time_seconds: solveTimeSeconds,
      };
      const res = await supabase.from('submissions').insert(extendedPayload);
      insertError = res.error;
    }

    // If the new columns do not exist yet, retry without them
    if (insertError && insertError.code === 'PGRST204') {
      // Retry without new columns (schema not yet migrated)
      const fallbackRes = await supabase.from('submissions').insert(basePayload);
      if (fallbackRes.error) {
        console.error('Error saving submission (fallback):', fallbackRes.error);
      }
    } else if (insertError) {
      // If another constraint fails, try a minimal payload one last time
      const minimalPayload = {
        user_id: user.id,
        problem_id: problemId,
        language,
        code,
        status,
      };
      const minimalRes = await supabase.from('submissions').insert(minimalPayload);
      if (minimalRes.error) {
        console.error('Error saving submission (minimal):', minimalRes.error);
      }
    }

    // Update user stats if submission passed
    if (allPassed) {
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'update_user_stats',
        {
          p_user_id: user.id,
          p_problem_id: problemId,
          p_points_earned: pointsEarned,
          p_difficulty: problem.difficulty,
          p_runtime: null, // TODO: Get from Judge0 response
          p_memory: null, // TODO: Get from Judge0 response
          p_is_first_solve: isFirstAttempt,
        }
      );

      // If the RPC isn't deployed yet, skip without failing the request
      if (updateError) {
        if (updateError.code === 'PGRST202') {
          console.warn('update_user_stats RPC not found (skipping):', updateError.message);
        } else {
          console.error('Error updating user stats:', updateError);
        }
      }
    } else {
      // If not accepted, still record an attempt for analytics if RPC exists
      const { error: attemptErr } = await supabase.rpc('increment_problem_attempts', {
        p_user_id: user.id,
        p_problem_id: problemId,
      });
      if (attemptErr && attemptErr.code !== 'PGRST202') {
        console.warn('increment_problem_attempts RPC error:', attemptErr.message);
      }
    }

    return {
      success: true,
      results,
      status,
      pointsEarned,
      pointsBreakdown,
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
