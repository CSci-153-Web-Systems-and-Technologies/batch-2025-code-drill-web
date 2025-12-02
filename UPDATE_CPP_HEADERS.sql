-- Update C++ starter code to include necessary headers
-- Run this in Supabase SQL Editor to fix compilation errors

-- 1. Two Sum (add vector header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'two-sum';

-- 2. Palindrome Number (no headers needed - uses only primitives)
-- No update needed

-- 3. Reverse String (add vector header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'reverse-string';

-- 4. Valid Parentheses (add string header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'valid-parentheses';

-- 5. Merge Two Sorted Lists (add ListNode struct)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n    ListNode(int x, ListNode *next) : val(x), next(next) {}\n};\n\nclass Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'merge-two-sorted-lists';

-- 6. Maximum Subarray (add vector header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'maximum-subarray';

-- 7. Binary Tree Level Order Traversal (add vector header and TreeNode struct)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <vector>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode() : val(0), left(nullptr), right(nullptr) {}\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n};\n\nclass Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'binary-tree-level-order-traversal';

-- 8. Longest Substring (add string header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'longest-substring-without-repeating-characters';

-- 9. Median of Two Sorted Arrays (add vector header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'median-of-two-sorted-arrays';

-- 10. Regular Expression Matching (add string header)
UPDATE problems 
SET starter_code = jsonb_set(
  starter_code,
  '{cpp}',
  '"#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isMatch(string s, string p) {\n        // Write your code here\n    }\n};"'
)
WHERE slug = 'regular-expression-matching';
