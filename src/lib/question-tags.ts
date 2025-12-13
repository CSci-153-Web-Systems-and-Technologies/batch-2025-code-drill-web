/**
 * Common programming tags for autocomplete suggestions
 * Organized by category for better UX
 */
export const COMMON_PROGRAMMING_TAGS = {
  loops: ['loops', 'for-loop', 'while-loop', 'do-while', 'nested-loops', 'loop-control', 'break-statement', 'continue-statement', 'infinite-loop'],
  arrays: ['arrays', '1d-arrays', '2d-arrays', 'multidimensional', 'array-traversal', 'array-manipulation', 'sorting', 'searching', 'array-bounds'],
  functions: ['functions', 'function-definition', 'function-prototype', 'parameters', 'arguments', 'return-values', 'void-functions', 'pass-by-value', 'pass-by-reference', 'scope', 'recursion-base'],
  recursion: ['recursion', 'base-case', 'recursive-case', 'tail-recursion', 'tree-recursion', 'backtracking', 'call-stack', 'stack-overflow', 'indirect-recursion'],
  pointers: ['pointers', 'pointer-declaration', 'pointer-arithmetic', 'dereferencing', 'address-of', 'null-pointer', 'double-pointers', 'void-pointer', 'dangling-pointers', 'memory-leaks'],
  control: ['if-statement', 'else-if', 'switch-case', 'ternary-operator', 'conditional-logic'],
  strings: ['strings', 'string-manipulation', 'string-comparison', 'string-concatenation', 'char-arrays'],
  structures: ['structs', 'unions', 'typedef', 'nested-structures', 'structure-pointers'],
  memory: ['dynamic-memory', 'malloc', 'calloc', 'realloc', 'free', 'memory-management', 'heap', 'stack'],
  io: ['input-output', 'printf', 'scanf', 'file-io', 'formatted-io'],
  operators: ['arithmetic-operators', 'relational-operators', 'logical-operators', 'bitwise-operators', 'assignment-operators'],
  debugging: ['debugging', 'testing', 'error-handling', 'edge-cases', 'validation'],
  algorithms: ['algorithms', 'complexity', 'time-complexity', 'space-complexity', 'optimization'],
} as const;

// Flatten all tags for easy searching
export const ALL_COMMON_TAGS = Object.values(COMMON_PROGRAMMING_TAGS).flat();

/**
 * Normalize tags: lowercase, trim, remove duplicates, sort
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0);
  
  return Array.from(new Set(normalized)).sort();
}

/**
 * Validate tags: ensure they're reasonable length and format
 */
export function validateTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  tags.forEach((tag, index) => {
    if (tag.length === 0) {
      errors.push(`Tag ${index + 1} is empty`);
    } else if (tag.length > 50) {
      errors.push(`Tag "${tag}" is too long (max 50 characters)`);
    } else if (!/^[a-z0-9-]+$/.test(tag)) {
      errors.push(`Tag "${tag}" contains invalid characters (only lowercase letters, numbers, and hyphens allowed)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
