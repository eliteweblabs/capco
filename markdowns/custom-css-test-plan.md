# Custom CSS Feature - QA Test Plan

## Test Environment

- **URL**: `/admin/settings`
- **Role Required**: Admin
- **Browser**: Chrome, Firefox, Safari
- **Devices**: Desktop, Tablet, Mobile

---

## Test Cases

### TC-001: Access Control

**Priority**: High  
**Objective**: Verify only admins can access custom CSS feature

| Step | Action                         | Expected Result             |
| ---- | ------------------------------ | --------------------------- |
| 1    | Login as Client role           | ✓ Redirect to dashboard     |
| 2    | Navigate to /admin/settings    | ✓ Access denied or redirect |
| 3    | Login as Admin role            | ✓ Access granted            |
| 4    | Navigate to /admin/settings    | ✓ Page loads successfully   |
| 5    | Scroll to "Custom CSS" section | ✓ Section is visible        |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-002: UI Display

**Priority**: Medium  
**Objective**: Verify UI elements are correctly displayed

| Step | Action                      | Expected Result                       |
| ---- | --------------------------- | ------------------------------------- |
| 1    | Navigate to /admin/settings | ✓ Page loads                          |
| 2    | Locate "Custom CSS" section | ✓ Between Analytics and Typography    |
| 3    | Check section title         | ✓ "Custom CSS" with 💾 icon if saved  |
| 4    | Check description text      | ✓ Clear explanation visible           |
| 5    | Check warning banner        | ✓ Yellow warning about advanced usage |
| 6    | Check textarea              | ✓ 12 rows, monospace font             |
| 7    | Check placeholder           | ✓ Helpful CSS examples visible        |
| 8    | Check helper text           | ✓ Tip about CSS variables visible     |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-003: Basic CSS Injection

**Priority**: Critical  
**Objective**: Verify simple CSS is injected and applied

| Step | Action                                   | Expected Result                               |
| ---- | ---------------------------------------- | --------------------------------------------- |
| 1    | Open /admin/settings                     | ✓ Page loads                                  |
| 2    | Add CSS: `.test-element { color: red; }` | ✓ Text appears in textarea                    |
| 3    | Click "Save Settings"                    | ✓ Success message appears                     |
| 4    | Reload page                              | ✓ Page reloads                                |
| 5    | Open browser DevTools                    | ✓ DevTools opens                              |
| 6    | Inspect page source                      | ✓ Find `<style data-source="cms-custom-css">` |
| 7    | Verify CSS content                       | ✓ Contains `.test-element { color: red; }`    |
| 8    | Create test element                      | ✓ Use DevTools console                        |
| 9    | Verify style applied                     | ✓ Element is red                              |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-004: Complex CSS

**Priority**: High  
**Objective**: Verify complex CSS patterns work correctly

Test CSS:

```css
/* Gradient button */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animated {
  animation: fadeIn 1s ease;
}

/* Media query */
@media (min-width: 768px) {
  .responsive {
    padding: 2rem;
  }
}
```

| Step | Action                | Expected Result                     |
| ---- | --------------------- | ----------------------------------- |
| 1    | Add complex CSS above | ✓ CSS saves successfully            |
| 2    | Reload page           | ✓ Page loads without errors         |
| 3    | Check button gradient | ✓ Gradient visible on buttons       |
| 4    | Test animation        | ✓ Animated elements fade in         |
| 5    | Resize browser        | ✓ Media query applies at breakpoint |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-005: CSS Variables

**Priority**: High  
**Objective**: Verify CSS variables work correctly

Test CSS:

```css
.custom-card {
  background: var(--color-primary-50);
  border: 2px solid var(--color-primary-500);
  color: var(--color-primary-900);
  font-family: var(--font-family);
}
```

| Step | Action                           | Expected Result                  |
| ---- | -------------------------------- | -------------------------------- |
| 1    | Add CSS with variables           | ✓ CSS saves                      |
| 2    | Create test element              | ✓ Element has correct colors     |
| 3    | Verify primary color             | ✓ Matches theme primary          |
| 4    | Verify font                      | ✓ Matches global font            |
| 5    | Change primary color in settings | ✓ Custom CSS updates dynamically |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-006: Dark Mode Support

**Priority**: High  
**Objective**: Verify dark mode styles work

Test CSS:

```css
.custom-header {
  background: white;
  color: black;
}

.dark .custom-header {
  background: #1a1a2e;
  color: white;
}
```

| Step | Action               | Expected Result                |
| ---- | -------------------- | ------------------------------ |
| 1    | Add dark mode CSS    | ✓ CSS saves                    |
| 2    | View in light mode   | ✓ White background, black text |
| 3    | Toggle to dark mode  | ✓ Dark background, white text  |
| 4    | Toggle back to light | ✓ Reverts to light styles      |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-007: Empty/Invalid CSS

**Priority**: Medium  
**Objective**: Verify handling of edge cases

| Step | Action                 | Expected Result                   |
| ---- | ---------------------- | --------------------------------- |
| 1    | Save empty CSS field   | ✓ Saves without error             |
| 2    | Reload page            | ✓ No `<style>` tag injected       |
| 3    | Add only whitespace    | ✓ Saves without error             |
| 4    | Reload page            | ✓ No `<style>` tag injected       |
| 5    | Add invalid CSS: `{{{` | ✓ Saves without error             |
| 6    | Reload page            | ✓ Page loads, invalid CSS ignored |
| 7    | Check console          | ✓ No JavaScript errors            |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-008: Form Persistence

**Priority**: Medium  
**Objective**: Verify CSS persists across sessions

| Step | Action                      | Expected Result              |
| ---- | --------------------------- | ---------------------------- |
| 1    | Add test CSS                | ✓ CSS saves                  |
| 2    | Logout                      | ✓ Session ends               |
| 3    | Login again                 | ✓ Login successful           |
| 4    | Navigate to /admin/settings | ✓ Page loads                 |
| 5    | Check Custom CSS field      | ✓ Previous CSS still present |
| 6    | View site                   | ✓ CSS still applied          |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-009: Responsive Behavior

**Priority**: Medium  
**Objective**: Verify custom CSS works on all devices

Test CSS:

```css
.test-responsive {
  padding: 1rem;
}

@media (min-width: 768px) {
  .test-responsive {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .test-responsive {
    padding: 3rem;
  }
}
```

| Step | Action                      | Expected Result |
| ---- | --------------------------- | --------------- |
| 1    | Add responsive CSS          | ✓ CSS saves     |
| 2    | Test on mobile (< 768px)    | ✓ 1rem padding  |
| 3    | Test on tablet (768-1023px) | ✓ 2rem padding  |
| 4    | Test on desktop (≥ 1024px)  | ✓ 3rem padding  |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-010: Performance Impact

**Priority**: Low  
**Objective**: Verify minimal performance impact

| Step | Action                    | Expected Result             |
| ---- | ------------------------- | --------------------------- |
| 1    | Add 500 lines of CSS      | ✓ CSS saves                 |
| 2    | Reload page               | ✓ Page loads in < 3 seconds |
| 3    | Open DevTools Performance | ✓ Monitor rendering time    |
| 4    | Check Lighthouse score    | ✓ Performance ≥ 90          |
| 5    | Verify no layout shifts   | ✓ CLS ≤ 0.1                 |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-011: Security

**Priority**: Critical  
**Objective**: Verify no XSS or security issues

| Step | Action                            | Expected Result           |
| ---- | --------------------------------- | ------------------------- |
| 1    | Attempt to add `<script>` tag     | ✓ Script not executed     |
| 2    | Add CSS with `javascript:`        | ✓ JavaScript not executed |
| 3    | Add CSS with `url('javascript:')` | ✓ No code execution       |
| 4    | Check page source                 | ✓ CSS properly escaped    |
| 5    | Verify server-side rendering      | ✓ CSS injected during SSR |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-012: Browser Compatibility

**Priority**: Medium  
**Objective**: Verify works across browsers

| Browser | Version | Custom CSS Applied | Notes  |
| ------- | ------- | ------------------ | ------ |
| Chrome  | Latest  | [ ] Pass [ ] Fail  | **\_** |
| Firefox | Latest  | [ ] Pass [ ] Fail  | **\_** |
| Safari  | Latest  | [ ] Pass [ ] Fail  | **\_** |
| Edge    | Latest  | [ ] Pass [ ] Fail  | **\_** |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-013: Concurrent Edits

**Priority**: Low  
**Objective**: Verify handling of concurrent admin edits

| Step | Action                 | Expected Result           |
| ---- | ---------------------- | ------------------------- |
| 1    | Admin A: Open settings | ✓ Page loads              |
| 2    | Admin B: Open settings | ✓ Page loads              |
| 3    | Admin A: Add CSS #1    | ✓ Saves successfully      |
| 4    | Admin B: Add CSS #2    | ✓ Saves successfully      |
| 5    | Verify final CSS       | ✓ Last save wins (CSS #2) |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-014: Cache Behavior

**Priority**: Medium  
**Objective**: Verify cache is properly cleared

| Step | Action               | Expected Result             |
| ---- | -------------------- | --------------------------- |
| 1    | Add CSS #1           | ✓ CSS applied               |
| 2    | Note cache timestamp | ✓ Record time               |
| 3    | Update to CSS #2     | ✓ Saves successfully        |
| 4    | Verify cache cleared | ✓ New CSS loads immediately |
| 5    | Check no stale CSS   | ✓ Old CSS not present       |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

### TC-015: Database Storage

**Priority**: High  
**Objective**: Verify correct database storage

| Step | Action                  | Expected Result                |
| ---- | ----------------------- | ------------------------------ |
| 1    | Add test CSS            | ✓ Saves successfully           |
| 2    | Query database directly | ✓ Check `globalSettings` table |
| 3    | Verify key              | ✓ `key = 'custom_css'`         |
| 4    | Verify value            | ✓ Contains test CSS            |
| 5    | Verify category         | ✓ `category = 'general'`       |
| 6    | Verify valueType        | ✓ `valueType = 'text'`         |
| 7    | Verify updatedBy        | ✓ Admin user ID present        |
| 8    | Verify updatedAt        | ✓ Recent timestamp             |

**Status**: [ ] Pass [ ] Fail  
**Notes**: **************\_**************

---

## Summary Report

### Test Execution Date

\_**\_ / \_\_** / \_\_\_\_

### Tested By

---

### Environment

- **Browser**: **************\_**************
- **OS**: **************\_**************
- **Screen Resolution**: **************\_**************

### Results Summary

- **Total Test Cases**: 15
- **Passed**: **\_** / 15
- **Failed**: **\_** / 15
- **Blocked**: **\_** / 15
- **Not Tested**: **\_** / 15

### Critical Issues Found

1. ***
2. ***
3. ***

### Recommendations

---

---

---

### Sign-off

- **QA Engineer**: **********\_********** Date: ****\_\_****
- **Tech Lead**: **********\_********** Date: ****\_\_****
- **Product Owner**: **********\_********** Date: ****\_\_****

---

## Regression Test Checklist

After bug fixes, re-test:

- [ ] TC-003: Basic CSS Injection
- [ ] TC-011: Security
- [ ] TC-015: Database Storage
- [ ] All failed test cases

---

## Acceptance Criteria

Feature is considered ready for production when:

- ✓ All Critical and High priority tests pass
- ✓ No security vulnerabilities found
- ✓ Works in Chrome, Firefox, Safari (latest)
- ✓ No performance degradation
- ✓ Documentation is complete
- ✓ Stakeholder approval obtained
