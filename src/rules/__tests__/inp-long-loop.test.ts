import { describe, expect, it } from "vitest";
import type { PerformanceIssue } from "@/types";
import { RuleName } from "@/types";
import { inpLongLoopRule } from "../inp-long-loop";
import {
  detectIssues as detectIssuesGeneric,
  expectIssuesDetected as expectIssuesDetectedGeneric,
  expectNoIssues,
} from "./test-utils";

function detectIssues(code: string, fileName: string = "test.tsx"): PerformanceIssue[] {
  return detectIssuesGeneric(inpLongLoopRule, code, fileName);
}

function expectIssuesDetected(issues: PerformanceIssue[], minCount: number = 1): void {
  expectIssuesDetectedGeneric(issues, RuleName.InpLongLoop, minCount);
  for (const issue of issues) {
    expect(issue.explanation).toContain("operations without yielding");
    expect(issue.explanation).toContain("INP");
  }
}

describe("inp-long-loop rule", () => {
  describe("detects loops with 5+ operations", () => {
    it.each([
      ["for", "for (let i = 0; i < items.length; i++)"],
      ["for-of", "for (const item of items)"],
      ["for-in", "for (const key in obj)"],
      ["while", "while (queue.length > 0)"],
      ["do-while", "do"],
    ])("detects %s loop with 5+ operations", (_, loopSyntax) => {
      const code = `
        function test(items: any[]) {
          ${loopSyntax} {
            processItem(items[0]);
            validateItem(items[0]);
            transformItem(items[0]);
            saveItem(items[0]);
            logItem(items[0]);
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });
  });

  describe("operation counting edge cases", () => {
    it("counts heavy array operations with extra weight", () => {
      const code = `
        function test(data: any[]) {
          for (let i = 0; i < data.length; i++) {
            data.map(x => x);
            data.filter(x => x);
            data.reduce((a, b) => a + b, 0);
            data.forEach(x => {});
            data.some(x => x);
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("does not detect loop when yielding mechanisms are present in body", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            func1();
            func2();
            func3();
            func4();
            func5();
            setTimeout(() => {}, 0);
          }
        }
      `;
      // Should not detect: yielding mechanism in loop body prevents detection
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("excludes yielding mechanisms from operation count but still detects if no yielding present", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            func1();
            func2();
            func3();
            func4();
            func5();
            // Yielding in comment doesn't count
          }
        }
      `;
      // Should detect: 5 operations, no yielding mechanisms
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("does not detect loop with only property access", () => {
      const code = `
        function test(items: any[]) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const value = item.value;
            const name = item.name;
            const id = item.id;
            const type = item.type;
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });
  });

  describe("threshold behavior", () => {
    it("does not detect loop with 4 operations", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            func1();
            func2();
            func3();
            func4();
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("detects loop with exactly 5 operations", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            func1();
            func2();
            func3();
            func4();
            func5();
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
      expect(detectIssues(code, "test.ts")[0].explanation).toContain("5");
    });
  });

  describe("yielding mechanism detection", () => {
    it("does not detect loop inside setTimeout", () => {
      const code = `
        function test() {
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              processItem(i);
              validateItem(i);
              transformItem(i);
              saveItem(i);
              logItem(i);
            }
          }, 0);
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop inside requestAnimationFrame", () => {
      const code = `
        function test() {
          requestAnimationFrame(() => {
            for (let i = 0; i < 10; i++) {
              processItem(i);
              validateItem(i);
              transformItem(i);
              saveItem(i);
              logItem(i);
            }
          });
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop with scheduler.yield() in body", () => {
      const code = `
        async function test() {
          for (let i = 0; i < 10; i++) {
            processItem(i);
            validateItem(i);
            transformItem(i);
            saveItem(i);
            await scheduler.yield();
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop with setTimeout in body", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            processItem(i);
            validateItem(i);
            transformItem(i);
            saveItem(i);
            setTimeout(() => {}, 0);
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop in function that already has yielding", () => {
      const code = `
        async function test() {
          await scheduler.yield();
          for (let i = 0; i < 10; i++) {
            processItem(i);
            validateItem(i);
            transformItem(i);
            saveItem(i);
            logItem(i);
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop in function wrapped in setTimeout", () => {
      const code = `
        function test() {
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              processItem(i);
              validateItem(i);
              transformItem(i);
              saveItem(i);
              logItem(i);
            }
          }, 0);
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });
  });

  describe("nested and complex scenarios", () => {
    it("detects inner nested loop independently", () => {
      const code = `
        function test(items: any[][]) {
          for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].length; j++) {
              processItem(items[i][j]);
              validateItem(items[i][j]);
              transformItem(items[i][j]);
              saveItem(items[i][j]);
              logItem(items[i][j]);
            }
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("detects outer loop if it has enough operations", () => {
      const code = `
        function test(items: any[][]) {
          for (let i = 0; i < items.length; i++) {
            processRow(items[i]);
            validateRow(items[i]);
            transformRow(items[i]);
            saveRow(items[i]);
            logRow(items[i]);
            for (let j = 0; j < items[i].length; j++) {
              processItem(items[i][j]);
            }
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("detects multiple loops in same function independently", () => {
      const code = `
        function test(items1: any[], items2: any[]) {
          for (let i = 0; i < items1.length; i++) {
            processItem(items1[i]);
            validateItem(items1[i]);
            transformItem(items1[i]);
            saveItem(items1[i]);
            logItem(items1[i]);
          }
          for (let i = 0; i < items2.length; i++) {
            processItem(items2[i]);
            validateItem(items2[i]);
            transformItem(items2[i]);
            saveItem(items2[i]);
            logItem(items2[i]);
          }
        }
      `;
      const issues = detectIssues(code, "test.ts");
      expectIssuesDetected(issues, 2);
    });

    it("detects loop in arrow function", () => {
      const code = `
        const processItems = (items: any[]) => {
          for (let i = 0; i < items.length; i++) {
            processItem(items[i]);
            validateItem(items[i]);
            transformItem(items[i]);
            saveItem(items[i]);
            logItem(items[i]);
          }
        };
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("detects loop in React component handler", () => {
      const code = `
        export const Component = () => {
          const handleClick = () => {
            const items = [1, 2, 3, 4, 5];
            for (const item of items) {
              processItem(item);
              validateItem(item);
              transformItem(item);
              saveItem(item);
              logItem(item);
            }
          };
          return <button onClick={handleClick}>Click</button>;
        };
      `;
      expectIssuesDetected(detectIssues(code, "test.tsx"));
    });
  });

  describe("edge cases", () => {
    it("does not detect empty loop", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
          }
        }
      `;
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("does not detect loop with conditional yielding (yielding present in body)", () => {
      const code = `
        function test(items: any[]) {
          for (let i = 0; i < items.length; i++) {
            processItem(items[i]);
            validateItem(items[i]);
            transformItem(items[i]);
            saveItem(items[i]);
            if (i % 10 === 0) {
              setTimeout(() => {}, 0);
            }
          }
        }
      `;
      // Rule detects yielding mechanism in loop body, even if conditional
      expectNoIssues(detectIssues(code, "test.ts"));
    });

    it("handles loop with nested function calls", () => {
      const code = `
        function test(items: any[]) {
          for (let i = 0; i < items.length; i++) {
            processItem(items[i]);
            validateItem(items[i]);
            transformItem(items[i]);
            saveItem(items[i]);
            logItem(items[i]);
          }
        }
        function processItem(item: any) {
          return item.map(x => x.value).filter(x => x);
        }
      `;
      // Should detect: nested calls don't count as yielding
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });

    it("handles loop with method chaining", () => {
      const code = `
        function test(data: any[]) {
          for (let i = 0; i < data.length; i++) {
            data.map(x => x).filter(x => x).reduce((a, b) => a + b, 0);
            data.forEach(x => console.log(x));
            data.find(x => x.id === i);
          }
        }
      `;
      expectIssuesDetected(detectIssues(code, "test.ts"));
    });
  });

  describe("issue metadata", () => {
    it("generates correct issue structure with operation count", () => {
      const code = `
        function test() {
          for (let i = 0; i < 10; i++) {
            func1();
            func2();
            func3();
            func4();
            func5();
            func6();
            func7();
          }
        }
      `;
      const issues = detectIssues(code, "test.ts");
      expectIssuesDetected(issues);
      const issue = issues[0];

      expect(issue.fix).toContain("scheduler.yield");
      expect(issue.explanation).toMatch(/\d+ operations/);
      expect(issue.explanation).toContain("50ms");
      expect(issue.codeSnippet).toBeDefined();
      expect(issue.codeSnippet?.length).toBeGreaterThan(0);
    });
  });
});
