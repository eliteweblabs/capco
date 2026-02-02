# MultiStepForm Animated Placeholder Stagger Delay Rule

## Protected Code

The following code in `src/components/form/MultiStepForm.astro` is **PROTECTED** and must NOT be removed or modified without explicit user approval:

### Line ~944: Stagger Delay in rotatePlaceholders()

```typescript
// Not part of a sync group, use normal staggered delay
const staggerDelay = stepIndex * 100;
```

### Line ~991: Stagger Delay in resetPlaceholderAnimation()

```typescript
// Apply stagger delay for reset animation too
const staggerDelay = stepIndex * 100;
```

## Context

This code creates a staggered animation effect for successive animated placeholders within a form step. Without this delay, all placeholder animations would trigger simultaneously, creating a jarring user experience.

**IMPORTANT**: The stagger delay must be applied in BOTH functions:
1. `rotatePlaceholders()` - For ongoing rotation cycles
2. `resetPlaceholderAnimation()` - For initial display when step becomes active

## Problem History

This code has been accidentally removed multiple times during refactoring/optimization:
1. Initial implementation included stagger delay
2. Bug: Stagger delay was only in `rotatePlaceholders()`, not in `resetPlaceholderAnimation()`
3. Result: First appearance was simultaneous, subsequent rotations were staggered
4. **Fixed (Feb 2, 2026)**: Added stagger delay to `resetPlaceholderAnimation()` as well

## Rules for AI Agents

1. **DO NOT** remove or modify the `staggerDelay` calculation in either function
2. **DO NOT** refactor these functions to remove the delay
3. **DO NOT** optimize by removing the `stepIndex * 100` multiplication
4. **DO NOT** consolidate logic in a way that eliminates the stagger delay
5. **DO** preserve the 100ms multiplier exactly as written in BOTH functions
6. **DO** reference the documentation at `markdowns/animated-placeholder-stagger-delay.md` if questions arise

## Related Protected Logic

The entire placeholder animation system should be treated carefully:
- `rotatePlaceholders()` function (lines ~871-959) - handles rotation cycles
- `resetPlaceholderAnimation()` function (lines ~961-1000) - handles initial display
- Sync group logic (no stagger) - lines ~897-937
- Non-sync group logic (with stagger) - lines ~938-958

## Verification

After any changes to MultiStepForm.astro, verify that:
1. The `staggerDelay` variable exists in `rotatePlaceholders()`
2. The `staggerDelay` variable exists in `resetPlaceholderAnimation()`
3. Both are calculated as `stepIndex * 100`
4. Both are applied in setTimeout before animations trigger

## Exception

This rule can be overridden ONLY if the user explicitly requests:
- Changing the stagger delay duration
- Removing the stagger effect entirely
- Modifying the placeholder animation system

## Ref

- Documentation: `markdowns/animated-placeholder-stagger-delay.md`
- Component: `src/components/form/MultiStepForm.astro`
- Functions: `rotatePlaceholders()` and `resetPlaceholderAnimation()`
