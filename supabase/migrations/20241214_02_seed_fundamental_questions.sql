-- Seed Fundamental Programming Questions for CS 101
-- This migration creates 75 diverse questions across 5 topics and 5 question types
-- Topics: loops, arrays, functions, recursion, pointers
-- Question Types: code_analysis, output_tracing, essay, multiple_choice, true_false
-- 5 topics × 5 types × 3 questions = 75 total questions

-- IMPORTANT: This migration requires 20241214_practice_mode_topics.sql to run first
-- That migration makes template_id and question_number nullable

-- Verify the schema has been updated
DO $$
BEGIN
  -- Check if question_number is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_questions' 
    AND column_name = 'question_number' 
    AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'Migration dependency not met: question_number is still NOT NULL. Please run 20241214_practice_mode_topics.sql first.';
  END IF;
  
  -- Check if course_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_questions' 
    AND column_name = 'course_id'
  ) THEN
    RAISE EXCEPTION 'Migration dependency not met: course_id column does not exist. Please run 20241214_practice_mode_topics.sql first.';
  END IF;
END$$;

-- Disable USER triggers only (not system triggers) to prevent auth.uid() NULL errors during seeding
-- We'll re-enable them after the inserts complete
ALTER TABLE exam_questions DISABLE TRIGGER USER;

-- Get CS 101 course ID
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT id INTO v_course_id FROM professor_courses WHERE course_code = 'CS 101' LIMIT 1;
  
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'CS 101 course not found. Please run 20241203_professor_exams.sql first.';
  END IF;

  -- ========================================================================
  -- LOOPS - CODE ANALYSIS (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, blanks, points, tags, is_published, published_at) VALUES
  (v_course_id, 'code_analysis', 'fill_blanks', 'For Loop Counter', 
   'Fill in the blanks to complete this for loop that prints numbers 1 to 5.',
   E'for (int i = ___1___; i ___2___ 5; i++) {\n    printf("%d ", i);\n}',
   '{"1": "1", "2": "<="}',
   10, ARRAY['loops', 'for-loop', 'initialization'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'While Loop Sum',
   'Complete the while loop to calculate the sum of numbers from 1 to n.',
   E'int sum = 0, i = 1;\nwhile (i ___1___ n) {\n    sum ___2___ i;\n    i++;\n}',
   '{"1": "<=", "2": "+="}',
   10, ARRAY['loops', 'while-loop', 'accumulator'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Nested Loop Pattern',
   'Fill in the blanks to print a triangular pattern of stars.',
   E'for (int i = 1; i <= 5; i++) {\n    for (int j = 1; j ___1___ i; j++) {\n        printf("___2___");\n    }\n    printf("\\n");\n}',
   '{"1": "<=", "2": "*"}',
   15, ARRAY['loops', 'nested-loops', 'pattern-printing'], true, NOW());

  -- ========================================================================
  -- LOOPS - OUTPUT TRACING (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, expected_output, points, tags, is_published, published_at) VALUES
  (v_course_id, 'output_tracing', 'trace_output', 'Loop with Break',
   'What is the output of this code?',
   E'for (int i = 0; i < 10; i++) {\n    if (i == 5) break;\n    printf("%d ", i);\n}',
   '0 1 2 3 4',
   10, ARRAY['loops', 'break-statement', 'control-flow'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Loop with Continue',
   'Trace the output of this loop with continue statement.',
   E'for (int i = 0; i < 5; i++) {\n    if (i % 2 == 0) continue;\n    printf("%d ", i);\n}',
   '1 3',
   10, ARRAY['loops', 'continue-statement', 'modulo'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Do-While Loop',
   'What will this do-while loop print?',
   E'int x = 5;\ndo {\n    printf("%d ", x);\n    x--;\n} while (x > 0);',
   '5 4 3 2 1',
   10, ARRAY['loops', 'do-while', 'decrement'], true, NOW());

  -- ========================================================================
  -- LOOPS - ESSAY (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, essay_requirements, points, tags, is_published, published_at) VALUES
  (v_course_id, 'essay', 'essay', 'Loop Types Comparison',
   'Explain the differences between for, while, and do-while loops. When would you choose each type? Provide examples.',
   '{"word_count": [150, 300], "key_concepts": ["for loop", "while loop", "do-while loop", "use cases"], "examples_required": true}',
   20, ARRAY['loops', 'loop-types', 'comparison'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Infinite Loop Prevention',
   'Describe common causes of infinite loops and strategies to prevent them. Include debugging techniques.',
   '{"word_count": [100, 200], "key_concepts": ["infinite loops", "loop conditions", "debugging"], "examples_required": true}',
   15, ARRAY['loops', 'debugging', 'best-practices'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Nested Loops Applications',
   'Discuss practical applications of nested loops. Provide at least two real-world examples with pseudocode.',
   '{"word_count": [150, 250], "key_concepts": ["nested loops", "2D iteration", "applications"], "examples_required": true}',
   20, ARRAY['loops', 'nested-loops', 'applications'], true, NOW());

  -- ========================================================================
  -- LOOPS - MULTIPLE CHOICE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, choices, correct_answer, points, tags, is_published, published_at) VALUES
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Loop Initialization',
   'Which loop guarantees at least one execution?',
   '[{"id": "a", "text": "for loop"}, {"id": "b", "text": "while loop"}, {"id": "c", "text": "do-while loop"}, {"id": "d", "text": "All loops execute at least once"}]',
   'c',
   5, ARRAY['loops', 'do-while', 'loop-execution'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Loop Control',
   'What statement terminates the current iteration and moves to the next one?',
   '[{"id": "a", "text": "break"}, {"id": "b", "text": "continue"}, {"id": "c", "text": "return"}, {"id": "d", "text": "exit"}]',
   'b',
   5, ARRAY['loops', 'continue-statement', 'control-statements'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Loop Efficiency',
   'Which loop is most efficient for iterating a known number of times?',
   '[{"id": "a", "text": "for loop"}, {"id": "b", "text": "while loop"}, {"id": "c", "text": "do-while loop"}, {"id": "d", "text": "All are equally efficient"}]',
   'd',
   5, ARRAY['loops', 'efficiency', 'performance'], true, NOW());

  -- ========================================================================
  -- LOOPS - TRUE/FALSE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, correct_boolean, points, tags, is_published, published_at) VALUES
  (v_course_id, 'true_false', 'true_false', 'Break Statement Scope',
   'The break statement only terminates the innermost loop in nested loops.',
   true,
   5, ARRAY['loops', 'break-statement', 'nested-loops'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Loop Variable Scope',
   'Variables declared inside a loop are accessible outside the loop.',
   false,
   5, ARRAY['loops', 'scope', 'variables'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Infinite Loop Syntax',
   'The syntax "while(true)" creates an infinite loop.',
   true,
   5, ARRAY['loops', 'infinite-loop', 'syntax'], true, NOW());

  -- ========================================================================
  -- ARRAYS - CODE ANALYSIS (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, blanks, points, tags, is_published, published_at) VALUES
  (v_course_id, 'code_analysis', 'fill_blanks', 'Array Declaration',
   'Fill in the blanks to declare and initialize an integer array of size 5.',
   'int arr___1___ = {1, 2, 3, 4, ___2___};',
   '{"1": "[5]", "2": "5"}',
   10, ARRAY['arrays', '1d-arrays', 'initialization'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Array Traversal',
   'Complete the code to sum all elements in an array.',
   E'int sum = 0;\nfor (int i = 0; i < ___1___; i++) {\n    sum += arr___2___;\n}',
   '{"1": "n", "2": "[i]"}',
   10, ARRAY['arrays', 'array-traversal', 'accumulator'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', '2D Array Access',
   'Fill in the blanks to access element at row 2, column 3 in a 2D array.',
   'int value = matrix___1______2___;',
   '{"1": "[2]", "2": "[3]"}',
   15, ARRAY['arrays', '2d-arrays', 'indexing'], true, NOW());

  -- ========================================================================
  -- ARRAYS - OUTPUT TRACING (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, expected_output, points, tags, is_published, published_at) VALUES
  (v_course_id, 'output_tracing', 'trace_output', 'Array Modification',
   'What is the output after modifying the array?',
   E'int arr[] = {10, 20, 30, 40};\narr[1] = arr[0] + arr[2];\nprintf("%d", arr[1]);',
   '40',
   10, ARRAY['arrays', 'array-modification', 'arithmetic'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Array Reverse Print',
   'What will this code print?',
   E'int arr[] = {1, 2, 3};\nfor (int i = 2; i >= 0; i--) {\n    printf("%d ", arr[i]);\n}',
   '3 2 1',
   10, ARRAY['arrays', 'array-traversal', 'reverse'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Array Element Swap',
   'Trace the output after swapping array elements.',
   E'int arr[] = {5, 10};\nint temp = arr[0];\narr[0] = arr[1];\narr[1] = temp;\nprintf("%d %d", arr[0], arr[1]);',
   '10 5',
   10, ARRAY['arrays', 'swap', 'algorithm'], true, NOW());

  -- ========================================================================
  -- ARRAYS - ESSAY (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, essay_requirements, points, tags, is_published, published_at) VALUES
  (v_course_id, 'essay', 'essay', 'Array vs Linked List',
   'Compare arrays and linked lists in terms of memory allocation, access time, and insertion/deletion operations.',
   '{"word_count": [150, 300], "key_concepts": ["arrays", "linked lists", "memory", "time complexity"], "examples_required": true}',
   20, ARRAY['arrays', 'data-structures', 'comparison'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Array Sorting Algorithms',
   'Explain the bubble sort algorithm. Describe its time complexity and when it might be preferred over other sorting algorithms.',
   '{"word_count": [100, 200], "key_concepts": ["bubble sort", "time complexity", "sorting"], "examples_required": true}',
   15, ARRAY['arrays', 'sorting', 'algorithms'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Multidimensional Arrays',
   'Discuss the concept of multidimensional arrays. Provide examples of when you would use 2D and 3D arrays in programming.',
   '{"word_count": [150, 250], "key_concepts": ["2D arrays", "3D arrays", "applications"], "examples_required": true}',
   20, ARRAY['arrays', '2d-arrays', 'multidimensional'], true, NOW());

  -- ========================================================================
  -- ARRAYS - MULTIPLE CHOICE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, choices, correct_answer, points, tags, is_published, published_at) VALUES
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Array Index',
   'What is the index of the first element in an array?',
   '[{"id": "a", "text": "-1"}, {"id": "b", "text": "0"}, {"id": "c", "text": "1"}, {"id": "d", "text": "Depends on the language"}]',
   'b',
   5, ARRAY['arrays', 'indexing', 'zero-based'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Array Size',
   'How do you determine the number of elements in an array in C?',
   '[{"id": "a", "text": "length property"}, {"id": "b", "text": "size() function"}, {"id": "c", "text": "sizeof(array)/sizeof(array[0])"}, {"id": "d", "text": "count() function"}]',
   'c',
   5, ARRAY['arrays', 'array-size', 'sizeof'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Array Memory',
   'How are array elements stored in memory?',
   '[{"id": "a", "text": "Randomly scattered"}, {"id": "b", "text": "Contiguous locations"}, {"id": "c", "text": "Linked list style"}, {"id": "d", "text": "Hash table"}]',
   'b',
   5, ARRAY['arrays', 'memory', 'storage'], true, NOW());

  -- ========================================================================
  -- ARRAYS - TRUE/FALSE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, correct_boolean, points, tags, is_published, published_at) VALUES
  (v_course_id, 'true_false', 'true_false', 'Array Size Change',
   'The size of an array can be changed after declaration in C.',
   false,
   5, ARRAY['arrays', 'array-size', 'static'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Array Bounds',
   'Accessing an array element beyond its declared size causes a compilation error in C.',
   false,
   5, ARRAY['arrays', 'bounds-checking', 'runtime-error'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Array Passing',
   'When an array is passed to a function, a copy of the entire array is created.',
   false,
   5, ARRAY['arrays', 'function-parameters', 'pass-by-reference'], true, NOW());

  -- ========================================================================
  -- FUNCTIONS - CODE ANALYSIS (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, blanks, points, tags, is_published, published_at) VALUES
  (v_course_id, 'code_analysis', 'fill_blanks', 'Function Definition',
   'Complete the function that returns the sum of two integers.',
   E'___1___ sum(int a, int b) {\n    ___2___ a + b;\n}',
   '{"1": "int", "2": "return"}',
   10, ARRAY['functions', 'function-definition', 'return-values'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Function Prototype',
   'Fill in the blanks for a function that takes two floats and returns a float.',
   '___1___ multiply(___2___ x, ___2___ y);',
   '{"1": "float", "2": "float"}',
   10, ARRAY['functions', 'function-prototype', 'parameters'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Void Function',
   'Complete this function that prints a message without returning a value.',
   E'___1___ greet(char name[]) {\n    printf("Hello, %s!", name);\n}',
   '{"1": "void"}',
   10, ARRAY['functions', 'void-functions', 'no-return'], true, NOW());

  -- ========================================================================
  -- FUNCTIONS - OUTPUT TRACING (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, expected_output, points, tags, is_published, published_at) VALUES
  (v_course_id, 'output_tracing', 'trace_output', 'Function Call Order',
   'What is the output of this program?',
   E'int add(int x) { return x + 5; }\nint main() {\n    int result = add(3);\n    printf("%d", result);\n}',
   '8',
   10, ARRAY['functions', 'function-calls', 'return-values'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Function Scope',
   'Trace the output considering variable scope.',
   E'int x = 10;\nvoid func() {\n    int x = 20;\n    printf("%d ", x);\n}\nint main() {\n    func();\n    printf("%d", x);\n}',
   '20 10',
   15, ARRAY['functions', 'scope', 'local-variables'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Pass by Value',
   'What will be printed?',
   E'void change(int x) { x = 100; }\nint main() {\n    int num = 50;\n    change(num);\n    printf("%d", num);\n}',
   '50',
   10, ARRAY['functions', 'pass-by-value', 'parameters'], true, NOW());

  -- ========================================================================
  -- FUNCTIONS - ESSAY (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, essay_requirements, points, tags, is_published, published_at) VALUES
  (v_course_id, 'essay', 'essay', 'Function Modularization',
   'Explain the importance of breaking programs into functions. Discuss benefits like code reusability and maintainability.',
   '{"word_count": [150, 300], "key_concepts": ["modularization", "reusability", "maintainability"], "examples_required": true}',
   20, ARRAY['functions', 'modularization', 'best-practices'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Pass by Value vs Reference',
   'Compare pass by value and pass by reference. When would you use each method? Provide code examples.',
   '{"word_count": [150, 250], "key_concepts": ["pass by value", "pass by reference", "pointers"], "examples_required": true}',
   20, ARRAY['functions', 'parameters', 'pass-by-reference'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Function Overhead',
   'Discuss function call overhead and when inline functions might be preferred. Include performance considerations.',
   '{"word_count": [100, 200], "key_concepts": ["function overhead", "inline functions", "performance"], "examples_required": false}',
   15, ARRAY['functions', 'performance', 'optimization'], true, NOW());

  -- ========================================================================
  -- FUNCTIONS - MULTIPLE CHOICE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, choices, correct_answer, points, tags, is_published, published_at) VALUES
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Function Return',
   'What keyword is used to return a value from a function?',
   '[{"id": "a", "text": "output"}, {"id": "b", "text": "return"}, {"id": "c", "text": "send"}, {"id": "d", "text": "yield"}]',
   'b',
   5, ARRAY['functions', 'return-statement', 'keywords'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Main Function',
   'What is the return type of the main() function?',
   '[{"id": "a", "text": "void"}, {"id": "b", "text": "int"}, {"id": "c", "text": "char"}, {"id": "d", "text": "float"}]',
   'b',
   5, ARRAY['functions', 'main-function', 'return-type'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Function Parameters',
   'What are values passed to a function called?',
   '[{"id": "a", "text": "Arguments"}, {"id": "b", "text": "Variables"}, {"id": "c", "text": "Inputs"}, {"id": "d", "text": "Data"}]',
   'a',
   5, ARRAY['functions', 'parameters', 'arguments'], true, NOW());

  -- ========================================================================
  -- FUNCTIONS - TRUE/FALSE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, correct_boolean, points, tags, is_published, published_at) VALUES
  (v_course_id, 'true_false', 'true_false', 'Function Overloading',
   'Function overloading is supported in standard C.',
   false,
   5, ARRAY['functions', 'function-overloading', 'c-language'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Recursive Functions',
   'A function can call itself in C programming.',
   true,
   5, ARRAY['functions', 'recursion', 'function-calls'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Function Prototypes',
   'Function prototypes must be declared before using the function.',
   true,
   5, ARRAY['functions', 'function-prototype', 'declaration'], true, NOW());

  -- ========================================================================
  -- RECURSION - CODE ANALYSIS (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, blanks, points, tags, is_published, published_at) VALUES
  (v_course_id, 'code_analysis', 'fill_blanks', 'Factorial Recursion',
   'Complete the recursive function to calculate factorial.',
   E'int factorial(int n) {\n    if (n ___1___ 1) return 1;\n    return n * factorial(n ___2___ 1);\n}',
   '{"1": "<=", "2": "-"}',
   15, ARRAY['recursion', 'factorial', 'base-case'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Fibonacci Recursion',
   'Fill in the recursive Fibonacci function.',
   E'int fib(int n) {\n    if (n <= 1) return ___1___;\n    return fib(n-1) ___2___ fib(n-2);\n}',
   '{"1": "n", "2": "+"}',
   15, ARRAY['recursion', 'fibonacci', 'multiple-recursion'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Sum Recursion',
   'Complete the recursive sum function.',
   E'int sum(int n) {\n    if (n == 0) return ___1___;\n    return n + ___2___(n - 1);\n}',
   '{"1": "0", "2": "sum"}',
   15, ARRAY['recursion', 'tail-recursion', 'accumulator'], true, NOW());

  -- ========================================================================
  -- RECURSION - OUTPUT TRACING (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, expected_output, points, tags, is_published, published_at) VALUES
  (v_course_id, 'output_tracing', 'trace_output', 'Countdown Recursion',
   'What will this recursive function print?',
   E'void countdown(int n) {\n    if (n == 0) return;\n    printf("%d ", n);\n    countdown(n - 1);\n}\ncountdown(3);',
   '3 2 1',
   15, ARRAY['recursion', 'countdown', 'output'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Power Recursion',
   'Trace the output of this power function.',
   E'int power(int base, int exp) {\n    if (exp == 0) return 1;\n    return base * power(base, exp - 1);\n}\nprintf("%d", power(2, 3));',
   '8',
   15, ARRAY['recursion', 'power', 'calculation'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Print Order',
   'What order does this print?',
   E'void print(int n) {\n    if (n == 0) return;\n    print(n - 1);\n    printf("%d ", n);\n}\nprint(3);',
   '1 2 3',
   15, ARRAY['recursion', 'call-stack', 'order'], true, NOW());

  -- ========================================================================
  -- RECURSION - ESSAY (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, essay_requirements, points, tags, is_published, published_at) VALUES
  (v_course_id, 'essay', 'essay', 'Recursion vs Iteration',
   'Compare recursive and iterative approaches to solving problems. Discuss advantages and disadvantages of each.',
   '{"word_count": [150, 300], "key_concepts": ["recursion", "iteration", "stack", "performance"], "examples_required": true}',
   20, ARRAY['recursion', 'iteration', 'comparison'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Base Case Importance',
   'Explain why a base case is essential in recursive functions. What happens without a proper base case?',
   '{"word_count": [100, 200], "key_concepts": ["base case", "termination", "stack overflow"], "examples_required": true}',
   15, ARRAY['recursion', 'base-case', 'termination'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Tail Recursion Optimization',
   'Describe tail recursion and how compilers can optimize it. Provide examples of tail-recursive functions.',
   '{"word_count": [150, 250], "key_concepts": ["tail recursion", "optimization", "compiler"], "examples_required": true}',
   20, ARRAY['recursion', 'tail-recursion', 'optimization'], true, NOW());

  -- ========================================================================
  -- RECURSION - MULTIPLE CHOICE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, choices, correct_answer, points, tags, is_published, published_at) VALUES
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Recursion Memory',
   'Where are recursive function calls stored?',
   '[{"id": "a", "text": "Heap"}, {"id": "b", "text": "Stack"}, {"id": "c", "text": "Data segment"}, {"id": "d", "text": "Code segment"}]',
   'b',
   5, ARRAY['recursion', 'call-stack', 'memory'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Recursion Requirement',
   'What is mandatory in every recursive function?',
   '[{"id": "a", "text": "Loop"}, {"id": "b", "text": "Base case"}, {"id": "c", "text": "Array"}, {"id": "d", "text": "Pointer"}]',
   'b',
   5, ARRAY['recursion', 'base-case', 'requirements'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Recursion Error',
   'What error occurs with infinite recursion?',
   '[{"id": "a", "text": "Compilation error"}, {"id": "b", "text": "Syntax error"}, {"id": "c", "text": "Stack overflow"}, {"id": "d", "text": "Segmentation fault"}]',
   'c',
   5, ARRAY['recursion', 'stack-overflow', 'errors'], true, NOW());

  -- ========================================================================
  -- RECURSION - TRUE/FALSE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, correct_boolean, points, tags, is_published, published_at) VALUES
  (v_course_id, 'true_false', 'true_false', 'Recursion Efficiency',
   'Recursive solutions are always more efficient than iterative solutions.',
   false,
   5, ARRAY['recursion', 'efficiency', 'performance'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Indirect Recursion',
   'Indirect recursion occurs when a function calls itself directly.',
   false,
   5, ARRAY['recursion', 'indirect-recursion', 'types'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Recursion Depth',
   'The maximum recursion depth is unlimited in C.',
   false,
   5, ARRAY['recursion', 'depth-limit', 'stack-size'], true, NOW());

  -- ========================================================================
  -- POINTERS - CODE ANALYSIS (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, blanks, points, tags, is_published, published_at) VALUES
  (v_course_id, 'code_analysis', 'fill_blanks', 'Pointer Declaration',
   'Complete the pointer declaration and initialization.',
   E'int x = 10;\nint ___1___ptr = ___2___x;',
   '{"1": "*", "2": "&"}',
   15, ARRAY['pointers', 'pointer-declaration', 'address-of'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Pointer Dereferencing',
   'Fill in to access the value using a pointer.',
   E'int x = 5;\nint *ptr = &x;\nint value = ___1___ptr;',
   '{"1": "*"}',
   15, ARRAY['pointers', 'dereferencing', 'pointer-operations'], true, NOW()),
   
  (v_course_id, 'code_analysis', 'fill_blanks', 'Pointer Arithmetic',
   'Complete the pointer arithmetic to access the next element.',
   E'int arr[] = {10, 20, 30};\nint *ptr = arr;\nint second = ___1___(ptr ___2___ 1);',
   '{"1": "*", "2": "+"}',
   15, ARRAY['pointers', 'pointer-arithmetic', 'arrays'], true, NOW());

  -- ========================================================================
  -- POINTERS - OUTPUT TRACING (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, code_snippet, expected_output, points, tags, is_published, published_at) VALUES
  (v_course_id, 'output_tracing', 'trace_output', 'Pointer Value Change',
   'What is the output?',
   E'int x = 5;\nint *ptr = &x;\n*ptr = 10;\nprintf("%d", x);',
   '10',
   15, ARRAY['pointers', 'dereferencing', 'modification'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Pointer Swap',
   'Trace the output after pointer-based swap.',
   E'void swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\nint x = 5, y = 10;\nswap(&x, &y);\nprintf("%d %d", x, y);',
   '10 5',
   15, ARRAY['pointers', 'swap', 'pass-by-reference'], true, NOW()),
   
  (v_course_id, 'output_tracing', 'trace_output', 'Array Pointer',
   'What will be printed?',
   E'int arr[] = {1, 2, 3};\nint *ptr = arr;\nprintf("%d", *(ptr + 2));',
   '3',
   15, ARRAY['pointers', 'pointer-arithmetic', 'arrays'], true, NOW());

  -- ========================================================================
  -- POINTERS - ESSAY (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, essay_requirements, points, tags, is_published, published_at) VALUES
  (v_course_id, 'essay', 'essay', 'Pointer Advantages',
   'Discuss the advantages of using pointers in C. Cover dynamic memory allocation, function parameters, and efficiency.',
   '{"word_count": [150, 300], "key_concepts": ["pointers", "dynamic memory", "efficiency"], "examples_required": true}',
   20, ARRAY['pointers', 'advantages', 'memory-management'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Pointer Dangers',
   'Explain common pointer-related errors such as dangling pointers, memory leaks, and null pointer dereferencing.',
   '{"word_count": [150, 250], "key_concepts": ["dangling pointers", "memory leaks", "null pointers"], "examples_required": true}',
   20, ARRAY['pointers', 'errors', 'debugging'], true, NOW()),
   
  (v_course_id, 'essay', 'essay', 'Pointers and Arrays',
   'Describe the relationship between pointers and arrays in C. How can array names be treated as pointers?',
   '{"word_count": [100, 200], "key_concepts": ["pointers", "arrays", "memory addressing"], "examples_required": true}',
   15, ARRAY['pointers', 'arrays', 'relationship'], true, NOW());

  -- ========================================================================
  -- POINTERS - MULTIPLE CHOICE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, choices, correct_answer, points, tags, is_published, published_at) VALUES
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Pointer Operator',
   'Which operator is used to get the address of a variable?',
   '[{"id": "a", "text": "*"}, {"id": "b", "text": "&"}, {"id": "c", "text": "@"}, {"id": "d", "text": "#"}]',
   'b',
   5, ARRAY['pointers', 'address-of', 'operators'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Null Pointer',
   'What value represents a null pointer?',
   '[{"id": "a", "text": "0"}, {"id": "b", "text": "NULL"}, {"id": "c", "text": "Both a and b"}, {"id": "d", "text": "Neither"}]',
   'c',
   5, ARRAY['pointers', 'null-pointer', 'values'], true, NOW()),
   
  (v_course_id, 'multiple_choice', 'multiple_choice', 'Pointer Size',
   'What determines the size of a pointer variable?',
   '[{"id": "a", "text": "Data type it points to"}, {"id": "b", "text": "System architecture"}, {"id": "c", "text": "Compiler settings"}, {"id": "d", "text": "Value stored"}]',
   'b',
   5, ARRAY['pointers', 'pointer-size', 'architecture'], true, NOW());

  -- ========================================================================
  -- POINTERS - TRUE/FALSE (3 questions)
  -- ========================================================================
  
  INSERT INTO exam_questions (course_id, question_type_category, question_type, title, question_text, correct_boolean, points, tags, is_published, published_at) VALUES
  (v_course_id, 'true_false', 'true_false', 'Pointer Initialization',
   'It is safe to use a pointer without initializing it.',
   false,
   5, ARRAY['pointers', 'initialization', 'safety'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Pointer to Pointer',
   'A pointer can point to another pointer in C.',
   true,
   5, ARRAY['pointers', 'double-pointers', 'multi-level'], true, NOW()),
   
  (v_course_id, 'true_false', 'true_false', 'Void Pointer',
   'A void pointer can point to any data type.',
   true,
   5, ARRAY['pointers', 'void-pointer', 'generic'], true, NOW());

  -- Note: The versioning trigger was dropped at the start of this migration
  -- It will be recreated when the original migration runs again or manually

  RAISE NOTICE '75 questions successfully seeded for CS 101 (Fundamentals of Programming)';
  RAISE NOTICE 'Topics: loops, arrays, functions, recursion, pointers';
  RAISE NOTICE 'Question types: code_analysis, output_tracing, essay, multiple_choice, true_false';
  RAISE NOTICE 'All questions published and tagged';
END$$;

-- Re-enable user triggers after seeding completes
ALTER TABLE exam_questions ENABLE TRIGGER USER;
