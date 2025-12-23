import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

// Example 1: Heavy for loop (>10 iterations)
export function HeavyLoopButton() {
  const handleClick = () => {
    // Heavy loop in event handler - will trigger INP rule
    for (let i = 0; i < 10000; i++) {
      console.log(`Processing item ${i}`);
      const result = Math.sqrt(i) * Math.random();
      const processed = result * 2;
      console.warn(processed);
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      Click me (Heavy Loop)
    </button>
  );
}

// Example 2: Nested loops
export function NestedLoopsForm() {
  const [value, setValue] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Nested loops in onChange - will trigger INP rule
    for (let i = 0; i < 1000; i++) {
      for (let j = 0; j < 500; j++) {
        const computed = i * j;
        computed.toString();
      }
    }

    setValue(inputValue);
  };

  return (
    <form>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Type here (Nested Loops)"
      />
    </form>
  );
}

// Example 3: While loop
export function WhileLoopComponent() {
  const handleMouseEnter = () => {
    // While loop in event handler
    let count = 0;
    while (count < 2000) {
      count++;
      count * 2;
    }
  };

  return (
    <button type="button" onMouseEnter={handleMouseEnter}>
      Hover me (While Loop)
    </button>
  );
}

// Example 4: For...of loop with heavy computation
export function ForOfLoopComponent() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Heavy loop in onSubmit handler
    const data: Array<{ id: number; value: number; processed: number }> = [];
    for (let i = 0; i < 50000; i++) {
      data.push({
        id: i,
        value: Math.random() * 1000,
        processed: Math.sqrt(i),
      });
    }

    console.log("Processed", data.length, "items");
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit (Heavy For Loop)</button>
    </form>
  );
}
