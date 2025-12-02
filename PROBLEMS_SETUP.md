# Problems Database Setup

## Overview
This document contains the SQL schema and setup instructions for the problems system in CodeDrill.

## Database Schema

### Problems Table

```sql
-- Create problems table
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
  total_submissions INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  example_test_cases JSONB DEFAULT '[]',
  hidden_test_cases JSONB DEFAULT '[]',
  constraints TEXT,
  starter_code JSONB DEFAULT '{}',
  solution_template JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX idx_problems_category ON public.problems(category);
CREATE INDEX idx_problems_slug ON public.problems(slug);
CREATE INDEX idx_problems_tags ON public.problems USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read problems
CREATE POLICY "Allow authenticated users to read problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow admin users to insert/update/delete problems (for now, allow all authenticated users)
CREATE POLICY "Allow authenticated users to insert problems"
  ON public.problems
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update problems"
  ON public.problems
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete problems"
  ON public.problems
  FOR DELETE
  TO authenticated
  USING (true);
```

### Submissions Table

```sql
-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error')),
  runtime INTEGER, -- in milliseconds
  memory INTEGER, -- in KB
  test_cases_passed INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  error_message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own submissions
CREATE POLICY "Users can read their own submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### User Problem Progress Table

```sql
-- Create user_problem_progress table to track which problems users have solved
CREATE TABLE IF NOT EXISTS public.user_problem_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Not Started', 'Attempted', 'Solved')),
  best_runtime INTEGER, -- in milliseconds
  best_memory INTEGER, -- in KB
  attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  solved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, problem_id)
);

-- Create indexes
CREATE INDEX idx_user_problem_progress_user_id ON public.user_problem_progress(user_id);
CREATE INDEX idx_user_problem_progress_problem_id ON public.user_problem_progress(problem_id);
CREATE INDEX idx_user_problem_progress_status ON public.user_problem_progress(status);

-- Enable Row Level Security
ALTER TABLE public.user_problem_progress ENABLE ROW LEVEL SECURITY;

-- Users can only read their own progress
CREATE POLICY "Users can read their own progress"
  ON public.user_problem_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
  ON public.user_problem_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
  ON public.user_problem_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Sample Data

```sql
-- Insert sample problems
INSERT INTO public.problems (title, slug, description, difficulty, category, tags, example_test_cases, constraints, starter_code) VALUES
(
  'Two Sum',
  'two-sum',
  'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

**Example 2:**
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```

**Example 3:**
```
Input: nums = [3,3], target = 6
Output: [0,1]
```',
  'Easy',
  'Array',
  ARRAY['Hash Table', 'Array'],
  '[{"input": "[2,7,11,15], 9", "output": "[0,1]"}, {"input": "[3,2,4], 6", "output": "[1,2]"}, {"input": "[3,3], 6", "output": "[0,1]"}]'::jsonb,
  '- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.',
  '{"javascript": "function twoSum(nums, target) {\n    // Write your code here\n}", "python": "def twoSum(nums, target):\n    # Write your code here\n    pass", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Palindrome Number',
  'palindrome-number',
  'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.

**Example 1:**
```
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
```

**Example 2:**
```
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
```

**Example 3:**
```
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.
```',
  'Easy',
  'Math',
  ARRAY['Math'],
  '[{"input": "121", "output": "true"}, {"input": "-121", "output": "false"}, {"input": "10", "output": "false"}]'::jsonb,
  '- -2^31 <= x <= 2^31 - 1',
  '{"javascript": "function isPalindrome(x) {\n    // Write your code here\n}", "python": "def isPalindrome(x):\n    # Write your code here\n    pass", "java": "class Solution {\n    public boolean isPalindrome(int x) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Reverse String',
  'reverse-string',
  'Write a function that reverses a string. The input string is given as an array of characters `s`.

You must do this by modifying the input array in-place with O(1) extra memory.

**Example 1:**
```
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
```

**Example 2:**
```
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
```',
  'Easy',
  'String',
  ARRAY['Two Pointers', 'String'],
  '[{"input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]", "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"}, {"input": "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", "output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"}]'::jsonb,
  '- 1 <= s.length <= 10^5
- s[i] is a printable ascii character.',
  '{"javascript": "function reverseString(s) {\n    // Write your code here\n}", "python": "def reverseString(s):\n    # Write your code here\n    pass", "java": "class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Valid Parentheses',
  'valid-parentheses',
  'Given a string `s` containing just the characters `''(''`, `'')''`, `''{''`, `''}''`, `''[''` and `'']''`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
```
Input: s = "()"
Output: true
```

**Example 2:**
```
Input: s = "()[]{}"
Output: true
```

**Example 3:**
```
Input: s = "(]"
Output: false
```',
  'Easy',
  'Stack',
  ARRAY['String', 'Stack'],
  '[{"input": "()", "output": "true"}, {"input": "()[]{}", "output": "true"}, {"input": "(]", "output": "false"}]'::jsonb,
  '- 1 <= s.length <= 10^4
- s consists of parentheses only ''()[]{}''.',
  '{"javascript": "function isValid(s) {\n    // Write your code here\n}", "python": "def isValid(s):\n    # Write your code here\n    pass", "java": "class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Merge Two Sorted Lists',
  'merge-two-sorted-lists',
  'You are given the heads of two sorted linked lists `list1` and `list2`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

**Example 1:**
```
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
```

**Example 2:**
```
Input: list1 = [], list2 = []
Output: []
```

**Example 3:**
```
Input: list1 = [], list2 = [0]
Output: [0]
```',
  'Easy',
  'Linked List',
  ARRAY['Linked List', 'Recursion'],
  '[{"input": "[1,2,4], [1,3,4]", "output": "[1,1,2,3,4,4]"}, {"input": "[], []", "output": "[]"}, {"input": "[], [0]", "output": "[0]"}]'::jsonb,
  '- The number of nodes in both lists is in the range [0, 50].
- -100 <= Node.val <= 100
- Both list1 and list2 are sorted in non-decreasing order.',
  '{"javascript": "function mergeTwoLists(list1, list2) {\n    // Write your code here\n}", "python": "def mergeTwoLists(list1, list2):\n    # Write your code here\n    pass", "java": "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Maximum Subarray',
  'maximum-subarray',
  'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.

**Example 1:**
```
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
```

**Example 2:**
```
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
```

**Example 3:**
```
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.
```',
  'Medium',
  'Dynamic Programming',
  ARRAY['Array', 'Dynamic Programming', 'Divide and Conquer'],
  '[{"input": "[-2,1,-3,4,-1,2,1,-5,4]", "output": "6"}, {"input": "[1]", "output": "1"}, {"input": "[5,4,-1,7,8]", "output": "23"}]'::jsonb,
  '- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4',
  '{"javascript": "function maxSubArray(nums) {\n    // Write your code here\n}", "python": "def maxSubArray(nums):\n    # Write your code here\n    pass", "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Binary Tree Level Order Traversal',
  'binary-tree-level-order-traversal',
  'Given the `root` of a binary tree, return the level order traversal of its nodes'' values. (i.e., from left to right, level by level).

**Example 1:**
```
Input: root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]
```

**Example 2:**
```
Input: root = [1]
Output: [[1]]
```

**Example 3:**
```
Input: root = []
Output: []
```',
  'Medium',
  'Tree',
  ARRAY['Tree', 'Breadth-First Search', 'Binary Tree'],
  '[{"input": "[3,9,20,null,null,15,7]", "output": "[[3],[9,20],[15,7]]"}, {"input": "[1]", "output": "[[1]]"}, {"input": "[]", "output": "[]"}]'::jsonb,
  '- The number of nodes in the tree is in the range [0, 2000].
- -1000 <= Node.val <= 1000',
  '{"javascript": "function levelOrder(root) {\n    // Write your code here\n}", "python": "def levelOrder(root):\n    # Write your code here\n    pass", "java": "class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Longest Substring Without Repeating Characters',
  'longest-substring-without-repeating-characters',
  'Given a string `s`, find the length of the longest substring without repeating characters.

**Example 1:**
```
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
```

**Example 2:**
```
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
```

**Example 3:**
```
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
```',
  'Medium',
  'String',
  ARRAY['Hash Table', 'String', 'Sliding Window'],
  '[{"input": "abcabcbb", "output": "3"}, {"input": "bbbbb", "output": "1"}, {"input": "pwwkew", "output": "3"}]'::jsonb,
  '- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.',
  '{"javascript": "function lengthOfLongestSubstring(s) {\n    // Write your code here\n}", "python": "def lengthOfLongestSubstring(s):\n    # Write your code here\n    pass", "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Median of Two Sorted Arrays',
  'median-of-two-sorted-arrays',
  'Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

**Example 1:**
```
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.
```

**Example 2:**
```
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.
```',
  'Hard',
  'Binary Search',
  ARRAY['Array', 'Binary Search', 'Divide and Conquer'],
  '[{"input": "[1,3], [2]", "output": "2.00000"}, {"input": "[1,2], [3,4]", "output": "2.50000"}]'::jsonb,
  '- nums1.length == m
- nums2.length == n
- 0 <= m <= 1000
- 0 <= n <= 1000
- 1 <= m + n <= 2000
- -10^6 <= nums1[i], nums2[i] <= 10^6',
  '{"javascript": "function findMedianSortedArrays(nums1, nums2) {\n    // Write your code here\n}", "python": "def findMedianSortedArrays(nums1, nums2):\n    # Write your code here\n    pass", "java": "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your code here\n    }\n};"}'::jsonb
),
(
  'Regular Expression Matching',
  'regular-expression-matching',
  'Given an input string `s` and a pattern `p`, implement regular expression matching with support for `''.''` and `''*''` where:

- `''.''` Matches any single character.
- `''*''` Matches zero or more of the preceding element.

The matching should cover the entire input string (not partial).

**Example 1:**
```
Input: s = "aa", p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".
```

**Example 2:**
```
Input: s = "aa", p = "a*"
Output: true
Explanation: ''*'' means zero or more of the preceding element, ''a''. Therefore, by repeating ''a'' once, it becomes "aa".
```

**Example 3:**
```
Input: s = "ab", p = ".*"
Output: true
Explanation: ".*" means "zero or more (*) of any character (.)".
```',
  'Hard',
  'Dynamic Programming',
  ARRAY['String', 'Dynamic Programming', 'Recursion'],
  '[{"input": "aa, a", "output": "false"}, {"input": "aa, a*", "output": "true"}, {"input": "ab, .*", "output": "true"}]'::jsonb,
  '- 1 <= s.length <= 20
- 1 <= p.length <= 20
- s contains only lowercase English letters.
- p contains only lowercase English letters, ''.'', and ''*''.
- It is guaranteed for each appearance of the character ''*'', there will be a previous valid character to match.',
  '{"javascript": "function isMatch(s, p) {\n    // Write your code here\n}", "python": "def isMatch(s, p):\n    # Write your code here\n    pass", "java": "class Solution {\n    public boolean isMatch(String s, String p) {\n        // Write your code here\n    }\n}", "cpp": "class Solution {\npublic:\n    bool isMatch(string s, string p) {\n        // Write your code here\n    }\n};"}'::jsonb
);
```

## Setup Instructions

1. **Create Tables**: Run all the CREATE TABLE statements in the Supabase SQL Editor
2. **Enable RLS**: All tables have Row Level Security enabled
3. **Insert Sample Data**: Run the INSERT statements to populate with sample problems
4. **Test Access**: Verify that authenticated users can read problems

## Table Relationships

- `submissions.user_id` → `auth.users.id`
- `submissions.problem_id` → `problems.id`
- `user_problem_progress.user_id` → `auth.users.id`
- `user_problem_progress.problem_id` → `problems.id`

## Notes

- Test cases are stored as JSONB for flexibility
- Starter code supports multiple languages: JavaScript, Python, Java, C++
- RLS policies currently allow all authenticated users to manage problems (update this for admin-only access in production)
- Acceptance rate is calculated as: (total_accepted / total_submissions) * 100
