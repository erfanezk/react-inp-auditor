import type { ChangeEvent } from "react";
import { useState } from "react";

// Example 1: API call without yielding
export function ApiCallWithoutYielding() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleClick = () => {
    // API call without yielding - will trigger INP rule
    fetch("/api/data")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      });

    // Multiple state updates without yielding
    setLoading(false);
    setLoaded(true);
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        Fetch Data (No Yielding)
      </button>
      {loading && <p>Loading...</p>}
      {loaded && <p>Loaded!</p>}
      {data !== null && <p>Data received</p>}
    </div>
  );
}

// Example 2: DOM manipulation without yielding
export function DomManipulationWithoutYielding() {
  const handleClick = () => {
    // DOM manipulation without yielding - will trigger INP rule
    const element = document.getElementById("myElement");
    if (element) {
      element.innerHTML = "Updated";
      element.textContent = "New content";
      element.classList.add("active");
    }

    document.querySelectorAll(".items").forEach((item) => {
      item.classList.remove("hidden");
    });
  };

  return (
    <button type="button" onClick={handleClick}>
      Update DOM (No Yielding)
    </button>
  );
}

// Example 3: Multiple state updates without yielding
export function MultipleStateUpdates() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [max, setMax] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    // More than 2 state updates without yielding - will trigger INP rule
    setCount(count + 1);
    setTotal(total + value);
    setMax(Math.max(max, value));
  };

  return (
    <input
      type="number"
      onChange={handleChange}
      placeholder="Enter number (Multiple State Updates)"
    />
  );
}

// Example 4: Heavy array operations without yielding (outside loops)
export function HeavyArrayOperations() {
  const [result, setResult] = useState<number>(0);

  const handleClick = () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => i);

    // Heavy array operations without yielding - will trigger INP rule
    const mapped = largeArray.map((item) => item * 2);
    const filtered = mapped.filter((item) => item > 1000);
    const reduced = filtered.reduce((acc, item) => acc + item, 0);

    setResult(reduced);
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        Process Array (No Yielding)
      </button>
      {result > 0 && <p>Result: {result}</p>}
    </div>
  );
}

// Example 5: Combined patterns without yielding
export function CombinedPatternsWithoutYielding() {
  const [value, setValue] = useState("");
  const [count, setCount] = useState(0);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // API call
    fetch(`/api/search?q=${inputValue}`).then((res) => res.json());

    // DOM manipulation
    document.getElementById("results")?.classList.add("loading");

    // Multiple state updates
    setValue(inputValue);
    setCount(count + 1);

    // Heavy computation
    const processed = inputValue.split("").map((char) => char.charCodeAt(0));
    processed.reduce((acc, val) => acc + val, 0);
  };

  return (
    <input
      type="text"
      value={value}
      onInput={handleInput}
      placeholder="Search (Combined Patterns)"
    />
  );
}
