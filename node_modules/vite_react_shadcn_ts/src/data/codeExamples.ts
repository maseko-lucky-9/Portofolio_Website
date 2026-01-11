/**
 * =============================================
 * CODE EXAMPLES FOR INTERACTIVE DEMO
 * =============================================
 * EDIT: Update with your own code examples
 */

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: "javascript" | "typescript" | "python";
  code: string;
  output?: string;
}

export const codeExamples: CodeExample[] = [
  {
    id: "api-fetch",
    title: "API Fetch Example",
    description: "Fetching data from an API with error handling",
    language: "typescript",
    code: `// Fetch user data with error handling
async function fetchUser(userId: string) {
  try {
    const response = await fetch(
      \`https://jsonplaceholder.typicode.com/users/\${userId}\`
    );
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const user = await response.json();
    return {
      success: true,
      data: {
        name: user.name,
        email: user.email,
        company: user.company.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test the function
const result = await fetchUser("1");
console.log(JSON.stringify(result, null, 2));`,
    output: `{
  "success": true,
  "data": {
    "name": "Leanne Graham",
    "email": "Sincere@april.biz",
    "company": "Romaguera-Crona"
  }
}`,
  },
  {
    id: "algorithm",
    title: "Algorithm: Binary Search",
    description: "Efficient binary search implementation",
    language: "typescript",
    code: `// Binary Search Algorithm
function binarySearch<T>(
  arr: T[],
  target: T,
  compareFn: (a: T, b: T) => number = (a, b) => 
    a < b ? -1 : a > b ? 1 : 0
): number {
  let left = 0;
  let right = arr.length - 1;
  let steps = 0;

  while (left <= right) {
    steps++;
    const mid = Math.floor((left + right) / 2);
    const comparison = compareFn(arr[mid], target);

    if (comparison === 0) {
      console.log(\`Found at index \${mid} in \${steps} steps\`);
      return mid;
    }

    if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  console.log(\`Not found after \${steps} steps\`);
  return -1;
}

// Test with sorted array
const numbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log("Array:", numbers.join(", "));
console.log("Searching for 13...");
binarySearch(numbers, 13);`,
    output: `Array: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19
Searching for 13...
Found at index 6 in 3 steps`,
  },
  {
    id: "react-hook",
    title: "Custom React Hook",
    description: "useDebounce hook for input optimization",
    language: "typescript",
    code: `// Custom useDebounce Hook
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage Example
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      console.log('Searching for:', debouncedQuery);
      // Perform search API call here
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}

console.log("Hook ready for use!");`,
    output: `Hook ready for use!
// Type in the input to see debounced search`,
  },
];
