# React INP Auditor - Rules Documentation

This document provides detailed documentation for all performance rules implemented in the React INP Auditor.

## Overview

The React INP Auditor analyzes TypeScript/React code to detect performance anti-patterns that can negatively impact Interaction to Next Paint (INP) scores. The rules are organized into four main categories based on the types of performance issues they detect.

## Rule Categories

Based on [`src/rules/index.ts`](src/rules/index.ts:14), the rules are organized into:

- **EventHandler Rules** (4 rules): Focus on event handler optimization
- **Long Task Rules** (3 rules): Detect functions that can create long tasks (>50ms)
- **Animation Rules** (2 rules): Optimize animation performance
- **Layout Rules** (1 rule): Detect layout thrashing
- **DOM Rules** (1 rule): Monitor DOM size impact

## Event Handler Rules

### 1. INP Event Handler API Calls
**File:** [`inp-event-handler-api-calls.ts`](src/rules/inp-event-handler-api-calls.ts:1)

Detects event handlers that perform API calls without yielding to the main thread.

**What it checks:**
- API calls inside event handlers (fetch, axios, fetch-like patterns)
- Lack of yielding mechanisms (setTimeout, requestAnimationFrame, etc.)

**Impact:**
- **Severity:** High
- **Metric:** INP
- API calls in event handlers can block the main thread for network response duration
- Can severely impact user interaction responsiveness

**Detection Patterns:**
```typescript
//  ❌ Bad
<button onClick={() => {
  fetch('/api/data').then(res => res.json());  // Blocks main thread
  setData(data);
}}>Fetch</button>

// ✅ Good  
<button onClick={() => {
  setLoading(true);
  setTimeout(() => {  // Yield before API call
    fetch('/api/data').then(res => res.json());
  }, 0);
}}>Fetch</button>
```

### 2. INP Event Handler DOM Manipulation
**File:** [`inp-event-handler-dom-manipulation.ts`](src/rules/inp-event-handler-dom-manipulation.ts:1)

Detects event handlers that perform DOM manipulation without yielding to the main thread.

**What it checks:**
- DOM manipulations (innerHTML, innerText, textContent assignments)
- DOM method calls (appendChild, removeChild, etc.)
- Lack of yielding mechanisms

**Impact:**
- **Severity:** High
- **Metric:** INP
- DOM manipulations can trigger layout recalculations
- Multiple DOM operations can block rendering

**Detection Patterns:**
```typescript
//  ❌ Bad
<button onClick={() => {
  element.innerHTML = '<div>content</div>';  // Synchronous DOM write
  element.style.display = 'block';
}}>Show</button>

// ✅ Good
<button onClick={() => {
  // UI update immediately
  element.style.display = 'block';
  
  // Heavy DOM manipulation deferred
  requestAnimationFrame(() => {
    setTimeout(() => {
      element.innerHTML = '<div>content</div>';
    }, 0);
  });
}}>Show</button>
```

### 3. INP Event Handler State Updates
**File:** [`inp-event-handler-state-updates.ts`](src/rules/inp-event-handler-state-updates.ts:1)

Detects event handlers with excessive state updates that don't yield between updates.

**What it checks:**
- Multiple state updates (>3) in a single event handler
- Setter functions starting with "set", "dispatch", or "setState"
- Lack of yielding between updates

**Impact:**
- **Severity:** Medium
- **Metric:** INP
- Multiple synchronous state updates can cause multiple re-renders
- Blocks the main thread during state reconciliation

**Detection Patterns:**
```typescript
//  ❌ Bad
<input onChange={(e) => {
  setValue(e.target.value);    // 1st update
  setCount(count + 1);         // 2nd update  
  setTotal(total + value);     // 3rd update
  setAverage(calculateAvg());  // 4th update - triggers rule
}} />

// ✅ Good
<input onChange={(e) => {
  // Batch state updates
  batch(() => {
    setValue(e.target.value);
    setCount(count + 1);
    setTotal(total + value);
    setAverage(calculateAvg());
  });
  
  // Or yield between updates
  setValue(e.target.value);
  requestAnimationFrame(() => {
    setCount(count + 1);
    setTotal(total + value);
    setTimeout(() => setAverage(calculateAvg()), 0);
  });
}} />
```

### 4. INP Incorrect Yielding
**File:** [`inp-incorrect-yielding.ts`](src/rules/inp-incorrect-yielding.ts:1)

Detects event handlers that use yielding but defer UI updates instead of non-UI work.

**What it checks:**
- UI updates (state setters) inside yielding callbacks
- Pattern analysis: deferred UI updates vs immediate updates
- Only flags handlers that actually use yielding incorrectly

**Impact:**
- **Severity:** Medium
- **Metric:** INP
- Incorrect ordering can delay UI responsiveness
- Users perceive delayed visual feedback

**Detection Patterns:**
```typescript
// ❌ Bad - Deferring UI update
<input onInput={(e) => {
  requestAnimationFrame(() => {
    setValue(e.target.value);  // UI update should be immediate!
  });
}} />

// ✅ Good - UI immediate, non-UI deferred
<input onInput={(e) => {
  // Update UI immediately for responsiveness
  setValue(e.target.value);
  
  // Defer non-critical work
  requestAnimationFrame(() => {
    setTimeout(() => {
      updateWordCount(text);
      checkSpelling(text);
    }, 0);
  });
}} />
```

## Long Task Rules

### 5. INP Long Loop
**File:** [`inp-long-loop.ts`](src/rules/inp-long-loop.ts:1)

Detects loops (for/for-of/while) with heavy operations that don't yield to the main thread.

**What it checks:**
- Loops containing ≥5 operations
- Function calls inside loop bodies
- Heavy array operations (map, filter, reduce, etc.)
- Lack of yielding inside loops

**Impact:**
- **Severity:** High
- **Metric:** INP
- Loops can block the main thread for extended periods
- Can create long tasks (>50ms) that freeze the UI

**Detection Patterns:**
```typescript
// ❌ Bad - No yielding in loop
function processItems(items) {
  for (const item of items) {
    processItem(item);           // 1 operation
    validateItem(item);          // 2 operations
    updateStats(item);           // 3 operations
    renderItem(item);            // 4 operations
    saveToCache(item);           // 5 operations - triggers rule
  }
}

// ✅ Good - Yielding periodically
async function processItems(items) {
  for (const item of items) {
    processItem(item);
    
    // Yield every 10 items to prevent long tasks
    if (items.indexOf(item) % 10 === 0) {
      await scheduler.yield?.() || new Promise(r => setTimeout(r, 0));
    }
  }
}
```

### 6. INP Async Batch Processing
**File:** [`inp-async-batch-processing.ts`](src/rules/inp-async-batch-processing.ts:1)

Detects async functions that process arrays/collections without yielding to the main thread.

**What it checks:**
- Async functions processing collections (for-of, forEach, map, etc.)
- Array operations in async contexts
- Lack of yielding in async batch processing

**Impact:**
- **Severity:** High
- **Metric:** INP
- Async operations can still block the main thread if not yielding
- Large collections can create invisible long tasks

**Detection Patterns:**
```typescript
//  ❌ Bad - Async batch without yielding
async function processLargeArray(array) {
  const chunks = chunkArray(array, 1000);
  
  for (const chunk of chunks) {  // Collection processing
    await processChunk(chunk);   // Async but no yielding
  }
}

// ✅ Good - Scheduled yielding
async function processLargeArray(array) {
  const chunks = chunkArray(array, 1000);
  let lastYield = performance.now();
  
  for (const chunk of chunks) {
    await processChunk(chunk);
    
    // Yield periodically to avoid long tasks
    if (performance.now() - lastYield > 50) {
      await scheduler.yield?.();
      lastYield = performance.now();
    }
  }
}
```

### 7. INP Heavy Computation
**File:** [`inp-heavy-computation.ts`](src/rules/inp-heavy-computation.ts:1)

Detects functions with many sequential operations that could create long tasks (>50ms).

**What it checks:**
- Functions with ≥20 sequential operations
- Excludes event handlers (handled by other rules)
- Operation counting with sophisticated heuristics

**Impact:**
- **Severity:** Medium → High (based on operation count)
- **Metric:** INP
- Sequential operations can accumulate into long tasks
- Even without loops, function bodies can be too heavy

**Detection Patterns:**
```typescript
// ❌ Bad - Too many sequential operations
function calculateComplexResult(data) {
  const result1 = step1(data);     // operation 1
  const result2 = step2(result1);  // operation 2
  const result3 = step3(result2);  // operation 3
  // ... 17 more operations
  const result20 = step20(result19); // operation 20 - triggers rule
  return result20;
}

// ✅ Good - Break up with yielding
async function calculateComplexResult(data) {
  let result = data;
  
  // Break into chunks with yielding
  result = await processChunk1(result);
  await scheduler.yield?.();
  
  result = await processChunk2(result);
  await scheduler.yield?.();
  
  result = await processChunk3(result);
  return result;
}
```

## Animation Rules

### 8. INP Animation Type
**File:** [`inp-animation-type.ts`](src/rules/inp-animation-type.ts:1)

Detects JavaScript animations that should be replaced with CSS animations for better performance.

**What it checks:**
- JavaScript animation patterns (setInterval, requestAnimationFrame loops)
- CSS animation usage (transition, animation properties)
- Flags when JS animations are used without corresponding CSS animations

**Impact:**
- **Severity:** Medium
- **Metric:** INP
- JS animations run on main thread, blocking interactions
- CSS animations run on compositor thread, better performance

**Detection Patterns:**
```typescript
// ❌ Bad - JavaScript animation
function animateElement(element) {
  let position = 0;
  const interval = setInterval(() => {
    position += 1;
    element.style.left = position + 'px';  // JS animation
    if (position > 100) clearInterval(interval);
  }, 16);
}

// ✅ Good - CSS animation
.element {
  transition: left 0.3s ease-in-out;  // Compositor thread
}
```

### 9. INP Animation Compositing
**File:** [`inp-animation-compositing.ts`](src/rules/inp-animation-compositing.ts:1)

Detects non-composited CSS properties in animations that cause layout thrashing.

**What it checks:**
- Non-composited CSS properties (width, height, left, top, margin, padding)
- Animation functions containing these properties
- Event handlers with animation-related code

**Impact:**
- **Severity:** High
- **Metric:** INP
- Non-composited animations trigger layout recalculations
- Forces synchronous layout on main thread

**Detection Patterns:**
```typescript
//  ❌ Bad - Non-composited properties
.element {
  animation: resize 1s infinite;
}

@keyframes resize {
  0% { width: 100px; height: 100px; }  // Layout-triggering
  50% { width: 200px; height: 200px; } // Forces reflow
  100% { width: 100px; height: 100px; }
}

// ✅ Good - Composited properties  
.element {
  animation: scale 1s infinite;
}

@keyframes scale {
  0% { transform: scale(1); }    // Compositor thread
  50% { transform: scale(2); }   // No layout thrashing
  100% { transform: scale(1); }
}
```

## Layout Rules

### 10. INP Layout Thrashing
**File:** [`inp-layout-thrashing.ts`](src/rules/inp-layout-thrashing.ts:1)

Detects layout thrashing patterns where DOM writes are followed by synchronous layout reads.

**What it checks:**
- Read-after-write patterns (DOM write → layout read)
- Read-write loops (layout reads inside loops containing DOM writes)
- Alternating patterns (multiple read/write alternations)
- Layout properties (offsetWidth, getBoundingClientRect, etc.)

**Impact:**
- **Severity:** Medium → High (based on pattern type)
- **Metric:** INP
- Forces synchronous layout recalculations
- Can block the main thread significantly

**Detection Patterns:**
```typescript
//  ❌ Bad - Read after write (layout thrashing)
function resizeElement(element) {
  element.style.width = '100px';        // Write
  const height = element.offsetHeight;  // Read - forces layout!
  element.style.height = height + '10px';
}

// ✅ Good - Batched reads then writes
function resizeElement(element) {
  // Read all layout properties first
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  // Then write all changes
  element.style.width = width + '10px';
  element.style.height = height + '10px';
}
```

## DOM Rules

### 11. INP DOM Size
**File:** [`inp-dom-size.ts`](src/rules/inp-dom-size.ts:1)

Detects excessive DOM size patterns that can negatively impact INP performance.

**What it checks:**
- JSX element nesting depth (> threshold)
- DOM structure complexity
- Deep component trees

**Impact:**
- **Severity:** Medium
- **Metric:** INP
- Deep DOM trees increase rendering time
- More memory usage and slower interaction response

**Detection Patterns:**
```typescript
//  ❌ Bad - Excessive nesting depth
<div>
  <Section>
    <Container>
      <Wrapper>
        <Content>
          <Article>
            <Header>
              <Title>...</Title>  // 6+ levels deep
            </Header>
          </Article>
        </Content>
      </Wrapper>
    </Container>
  </Section>
</div>

// ✅ Good - Flattened structure
<div>
  <AppHeader />
  <MainContent />
  <AppFooter />
</div>
```

## Rule Configuration

### Severity Levels

- **High:** Critical issues that severely impact INP (blocking operations, layout thrashing)
- **Medium:** Performance concerns that affect user experience (optimization opportunities)
- **Low:** Minor issues or stylistic recommendations

### Performance Metrics

All rules focus on **INP (Interaction to Next Paint)** - the Core Web Vital that measures responsiveness to user interactions.

### Rule Dependencies

Rules use shared utilities from [`src/utils/`](src/utils/):
- [`event-handler.ts`](src/utils/event-handler.ts) - Event handler detection
- [`yielding.ts`](src/utils/yielding.ts) - Yielding mechanism detection
- [`functions.ts`](src/utils/functions.ts) - Function analysis utilities
- [`rule-filters.ts`](src/utils/rule-filters.ts) - Rule filtering logic

## Adding New Rules

To add a new rule:

1. Create a new file in [`src/rules/`](src/rules/)
2. Implement the `Rule` interface with `config` and `detect` methods
3. Export the rule as a named export
4. Import and add to the appropriate category in [`src/rules/index.ts`](src/rules/index.ts:14)

```typescript
// Example rule structure
export const myNewRule: Rule = {
  config: {
    name: RuleName.MyNewRule,
    description: "Description of what this rule detects",
    metric: PerformanceMetric.Inp,
    defaultSeverity: Severity.Medium,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    // Rule implementation
    return issues;
  },
};
```

## Testing Rules

Each rule should have corresponding test examples in the [`examples/`](examples/) directory to verify detection accuracy and prevent false positives.