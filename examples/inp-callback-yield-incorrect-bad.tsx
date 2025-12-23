import type { ChangeEvent } from "react";
import { useState } from "react";

// Example 1: Deferring UI update instead of non-UI work
export function IncorrectYieldingPattern1() {
  const [value, setValue] = useState("");

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Incorrect: UI update is deferred - should be immediate
    requestAnimationFrame(() => {
      setValue(inputValue); // UI update should happen synchronously!
    });
  };

  return (
    <input
      type="text"
      value={value}
      onInput={handleInput}
      placeholder="Type here (Incorrect Yielding)"
    />
  );
}

// Example 2: Deferring all work including UI updates
export function IncorrectYieldingPattern2() {
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Incorrect: Everything is deferred, including UI update
    setTimeout(() => {
      setText(inputValue); // Should be immediate
      setWordCount(inputValue.split(" ").length); // Can be deferred
    }, 0);
  };

  return (
    <div>
      <input
        type="text"
        value={text}
        onInput={handleInput}
        placeholder="Type here (All Deferred)"
      />
      <p>Words: {wordCount}</p>
    </div>
  );
}

// Example 3: More deferred updates than immediate
export function IncorrectYieldingPattern3() {
  const [value, setValue] = useState("");
  const [count, setCount] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Only one immediate update
    setValue(inputValue);

    // But multiple deferred updates - incorrect pattern
    requestAnimationFrame(() => {
      setTimeout(() => {
        setCount(count + 1); // Should be immediate if it's UI-related
        setValue(inputValue.toUpperCase()); // UI update deferred!
        setValue(inputValue.toLowerCase()); // Another deferred UI update!
      }, 0);
    });
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="Type here (More Deferred)"
    />
  );
}

// Example 4: Using requestAnimationFrame without setTimeout wrapper
export function IncorrectYieldingPattern4() {
  const [items, setItems] = useState<string[]>([]);

  const handleClick = () => {
    // Incorrect: Non-UI work in requestAnimationFrame without setTimeout
    requestAnimationFrame(() => {
      // Heavy computation should use setTimeout wrapper
      const processed = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      setItems(processed);
    });
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        Process Data (Incorrect RAF Usage)
      </button>
      {items.length > 0 && <p>Processed {items.length} items</p>}
    </div>
  );
}
