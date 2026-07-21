// Multi-language code execution service
// JavaScript runs in-browser; C/C++/Python/Java use Wandbox (free, no auth)

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

const WANDBOX_API = "https://wandbox.org/api/compile.json";

// Wandbox API versions
const WANDBOX_MAP: Record<string, string> = {
  python: "cpython-3.10.15",
  py: "cpython-3.10.15",
  java: "openjdk-jdk-21+35",
  c: "gcc-head-c",
  cpp: "gcc-head",
  "c++": "gcc-head",
};

export async function executeCode(
  code: string,
  language: string,
  input?: string,
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const lang = language.toLowerCase();

  try {
    if (lang === "javascript" || lang === "js") {
      return await executeJavaScript(code);
    }
    return await executeWandbox(code, lang, input, startTime);
  } catch (error: any) {
    return {
      success: false,
      output: "",
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  try {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(" ")),
      error: (...args: any[]) =>
        logs.push("ERROR: " + args.map(String).join(" ")),
      warn: (...args: any[]) =>
        logs.push("WARN: " + args.map(String).join(" ")),
    };
    const func = new Function("console", code);
    func(customConsole);
    return {
      success: true,
      output: logs.join("\n"),
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      output: "",
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

async function executeWandbox(
  code: string,
  language: string,
  input: string | undefined,
  startTime: number,
): Promise<ExecutionResult> {
  const compiler = WANDBOX_MAP[language];
  if (!compiler) {
    return {
      success: false,
      output: "",
      error: `Unsupported language: ${language}`,
      executionTime: Date.now() - startTime,
    };
  }

  const body = {
    compiler: compiler,
    code: code,
    stdin: input || "",
  };

  const response = await fetch(WANDBOX_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Execution API error: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.status !== "0") {
    return {
      success: false,
      output: result.program_output || "",
      error:
        result.compiler_error || result.program_error || "Execution failed",
      executionTime: Date.now() - startTime,
    };
  }

  return {
    success: true,
    output: result.program_output || "",
    executionTime: Date.now() - startTime,
  };
}

export function getLanguageName(language: string): string {
  const names: Record<string, string> = {
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    js: "JavaScript",
    py: "Python",
    "c++": "C++",
  };
  return names[language.toLowerCase()] || language;
}

export function getCodeTemplate(language: string): string {
  const templates: Record<string, string> = {
    javascript: `// Write your JavaScript code here
// Use console.log() to print output

const arr = [64, 34, 25, 12, 22, 11, 90];
// Your code here
console.log(arr);`,

    python: `# Write your Python code here
# Use print() to print output

arr = [64, 34, 25, 12, 22, 11, 90]
# Your code here
print(arr)`,

    java: `// Write your Java code here
// Note: Class name must be "Main"
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        // Your code here
        System.out.println(Arrays.toString(arr));
    }
}`,

    c: `// Write your C code here
#include <stdio.h>

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    // Your code here
    printf("[");
    for(int i = 0; i < n; i++) {
        printf("%d", arr[i]);
        if(i < n-1) printf(", ");
    }
    printf("]\\n");
    return 0;
}`,

    cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    // Your code here
    cout << "[";
    for(int i = 0; i < n; i++) {
        cout << arr[i];
        if(i < n-1) cout << ", ";
    }
    cout << "]" << endl;
    return 0;
}`,
  };
  return templates[language.toLowerCase()] || "// Write your code here";
}

export function getEditorMode(language: string): string {
  const modes: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    c: "c_cpp",
    cpp: "c_cpp",
    js: "javascript",
    py: "python",
    "c++": "c_cpp",
  };
  return modes[language.toLowerCase()] || "text";
}
