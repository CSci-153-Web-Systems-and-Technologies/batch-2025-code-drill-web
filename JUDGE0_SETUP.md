# Judge0 API Integration Setup

## Overview
This document explains how to set up Judge0 API for code execution in CodeDrill.

## What is Judge0?
Judge0 is a robust, scalable, and open-source online code execution system. It can be used to build a wide range of applications that need online code execution features.

## Setup Options

### Option 1: Judge0 CE (Community Edition) via RapidAPI
**Recommended for development and testing**

1. **Sign up for RapidAPI:**
   - Go to https://rapidapi.com/
   - Create a free account

2. **Subscribe to Judge0 CE:**
   - Visit https://rapidapi.com/judge0-official/api/judge0-ce
   - Subscribe to a plan (Free tier available with 50 requests/day)
   - Get your API key from the dashboard

3. **Configure Environment Variables:**
   Add to your `.env.local`:
   ```env
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your_rapidapi_key_here
   ```

### Option 2: Self-Hosted Judge0
**Recommended for production**

1. **Install Docker and Docker Compose**

2. **Clone Judge0 repository:**
   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   ```

3. **Start Judge0:**
   ```bash
   docker-compose up -d
   ```

4. **Configure Environment Variables:**
   Add to your `.env.local`:
   ```env
   JUDGE0_API_URL=http://localhost:2358
   JUDGE0_API_KEY=  # Not required for self-hosted
   ```

## Language Support

The system currently supports these languages with their Judge0 language IDs:

| Language   | Judge0 ID | Version              |
|------------|-----------|----------------------|
| JavaScript | 63        | Node.js 12.14.0      |
| Python     | 71        | Python 3.8.1         |
| Java       | 62        | Java (OpenJDK 13.0.1)|
| C++        | 54        | C++ (GCC 9.2.0)      |

## Implementation Status

### ✅ Completed
- Server Actions for code execution (`runCode`, `submitCode`)
- Basic structure for Judge0 integration
- Mock responses for testing UI

### 🚧 To Enable Judge0 Integration
1. Add your Judge0 API credentials to `.env.local`
2. Uncomment the Judge0 API calls in `/app/problems/[slug]/actions.ts`
3. Update the `runCode` function to use `executeWithJudge0`
4. Update the `submitCode` function to execute against all test cases

## Testing Without Judge0

The current implementation returns mock results that always pass. This allows you to:
- Test the UI and user flow
- Develop other features without API dependency
- Avoid API rate limits during development

## Enabling Real Code Execution

To enable real code execution, update `app/problems/[slug]/actions.ts`:

```typescript
export async function runCode({ problemId, language, code, testCases }: RunCodeParams) {
  try {
    const results = await Promise.all(
      testCases.map(async (testCase) => {
        try {
          const { output, error } = await executeWithJudge0(language, code, testCase.input);
          
          if (error) {
            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: undefined,
              passed: false,
              error,
            };
          }

          const passed = output.trim() === testCase.output.trim();
          return {
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: output,
            passed,
            error: undefined,
          };
        } catch (err) {
          return {
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: undefined,
            passed: false,
            error: err instanceof Error ? err.message : 'Execution failed',
          };
        }
      })
    );

    return { success: true, results };
  } catch (error) {
    console.error('Error running code:', error);
    return {
      success: false,
      results: [],
      error: 'Failed to execute code',
    };
  }
}
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **Timeouts**: Judge0 has built-in time limits (default: 5 seconds)
3. **Memory Limits**: Judge0 enforces memory limits per execution
4. **Input Validation**: Validate and sanitize all inputs before execution
5. **Error Handling**: Never expose internal errors to users

## API Rate Limits

### RapidAPI Free Tier:
- 50 requests per day
- Rate: ~1 request per 30 minutes

### RapidAPI Basic Plan ($10/month):
- 2000 requests per month
- Rate: ~2 requests per minute

### Self-Hosted:
- No rate limits
- Limited by your server resources

## Alternative Code Execution Services

If Judge0 doesn't meet your needs:
- **Piston API**: https://github.com/engineer-man/piston
- **Sphere Engine**: https://sphere-engine.com/
- **HackerEarth CodeTable**: https://www.hackerearth.com/
- **AWS Lambda**: Custom solution for specific languages

## Troubleshooting

### Issue: API returns 429 (Too Many Requests)
**Solution**: You've exceeded the rate limit. Wait or upgrade your plan.

### Issue: Execution timeout
**Solution**: Optimize the test cases or increase timeout limits.

### Issue: Compilation error
**Solution**: Check the starter code templates match the expected function signatures.

## Next Steps

1. Set up Judge0 API credentials
2. Test with simple problems first
3. Monitor API usage and costs
4. Implement caching for repeated submissions
5. Add more detailed error messages
6. Track execution metrics (runtime, memory)
