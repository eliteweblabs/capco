# Multi-Step Form JavaScript Features

This document outlines all the JavaScript effects and behaviors implemented in the JSON-based multi-step form system.

## Auto-Focus Behavior

### Initial Focus (on page load)

- **Location**: `multi-step-form-handler.ts` lines 726-735
- **Behavior**: Automatically focuses the first visible input field when the form loads
- **Implementation**:
  ```typescript
  setTimeout(() => {
    const firstStep = form.querySelector('.step-content[data-step="1"]');
    if (firstStep) {
      const firstInput = firstStep.querySelector("input:not([type=hidden]):not([readonly])");
      if (firstInput) firstInput.focus();
    }
  }, 150);
  ```

### Step Transition Focus

- **Location**: `multi-step-form-handler.ts` lines 190-213
- **Behavior**: When navigating to a new step, automatically focuses the appropriate element
- **Logic**:
  1. **For SMS choice steps**: Focuses the "Yes" button
  2. **For regular input steps**: Focuses the first visible input field
  3. **Scroll behavior**: Smoothly scrolls the focused element into view
- **Implementation**:
  ```typescript
  setTimeout(() => {
    const smsChoiceButtons = targetStep.querySelectorAll("button.sms-choice");
    if (smsChoiceButtons.length > 0) {
      const yesButton = targetStep.querySelector('button[data-sms-value="true"]');
      if (yesButton) yesButton.focus();
    } else {
      const firstInput = targetStep.querySelector(
        "input:not([type=hidden]):not([readonly]), textarea"
      );
      if (firstInput) {
        firstInput.focus();
        firstInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, 150);
  ```

## Phone Number Formatting

### Real-time Formatting

- **Location**: `multi-step-form-handler.ts` lines 373-408
- **Behavior**: Automatically formats phone numbers as the user types
- **Format**: `(555) 555-5555`
- **Features**:
  - Maintains cursor position during typing
  - Handles deletions correctly
  - Updates "skip" vs "next" button text based on validation
  - Uses `formatPhoneAsYouType()` from `phone-validation.ts`

### Dynamic Button Text

- **Behavior**: Changes button text from "skip" to "next" when a valid phone is entered
- **Implementation**: Updates `#${formId}-next-step-phone-text` element

## Input Validation

### Touch Tracking

- **Location**: `multi-step-form-handler.ts` lines 596-605
- **Behavior**: Adds `touched` class to inputs after user interaction
- **Purpose**: Shows validation errors only after user has interacted with field
- **Events**: Triggered on both `blur` and `input` events

### Step Validation

- **Location**: `multi-step-form-handler.ts` lines 217-303
- **Validates**:
  - Required fields (HTML5 validation)
  - Phone number format (US format)
  - Email uniqueness (configurable via `registerUser` flag)
  - Custom validators (passed via options)
- **Error Display**: Uses `window.showNotice()` for user-friendly error messages

### Email Uniqueness Check

- **Location**: `multi-step-form-handler.ts` lines 269-301
- **Behavior**:
  - Only runs if `formConfig.registerUser === true`
  - Checks against `/api/auth/check-email` endpoint
  - Shows warning with link to login page if email exists
  - Auto-redirects after 10 seconds
  - Preserves redirect URL to return to form after login

## Keyboard Shortcuts

### Enter Key Handling

- **Location**: `multi-step-form-handler.ts` lines 711-721
- **Behavior**: Pressing Enter advances to next step or submits form
- **Exception**: Does not trigger for `<textarea>` elements (allows multi-line input)
- **Implementation**:
  ```typescript
  form.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      const nextBtn = currentStepEl?.querySelector(
        ".next-step, .submit-registration, .submit-contact"
      );
      if (nextBtn) nextBtn.click();
    }
  });
  ```

## Progress Bar Animation

### Visual States

- **Location**: `multi-step-form-handler.ts` lines 29-104
- **Step States**:
  1. **Completed**: Green circle with checkmark icon, 100% progress line
  2. **Current**: Primary color circle with ring, number shown, 0% progress line
  3. **Future**: Gray circle, number shown, 0% progress line
- **Smooth Transitions**: CSS transitions handle color and width changes

### Progress Line Animation

- **Behavior**: Progress lines between steps fill from 0% to 100% as steps are completed
- **CSS**: `transition-all duration-500 ease-out` for smooth animation

## Choice Button Interactions

### SMS Alerts (Yes/No)

- **Location**: `multi-step-form-handler.ts` lines 487-500
- **Behavior**: Immediately advances to next step based on selection
- **Data Storage**: Updates hidden `smsAlerts` input field
- **Navigation**: Uses `data-next` attribute for step routing

### Fuel Source (Gas/Electric)

- **Location**: `multi-step-form-handler.ts` lines 420-451
- **Behavior**: Select first, then proceed with separate button
- **Visual Feedback**:
  - Highlights selected option with ring and background color
  - Removes highlighting from deselected options
  - Enables the "Next" button after selection
- **Classes Applied**: `!ring-2`, `!ring-primary-600`, `!bg-primary-50`

### HVAC System Type

- **Location**: `multi-step-form-handler.ts` lines 453-485
- **Behavior**: Similar to Fuel Source (select then proceed)
- **Conditional Display**: Shows only Gas or Electric options based on fuel selection
- **Dynamic Content**: Updates step subtitle based on fuel choice

## Conditional Step Display

### HVAC Options Filtering

- **Location**: `multi-step-form-handler.ts` lines 156-188
- **Trigger**: When entering step 6
- **Logic**:
  1. Reads `fuelSource` hidden input value
  2. Hides all HVAC choice buttons
  3. Shows only buttons matching the fuel type (`.hvac-gas` or `.hvac-electric`)
  4. Updates subtitle text dynamically
- **Implementation**: Uses `display: none` and `display: inline-flex` CSS

### SMS Step Skipping

- **Location**: `multi-step-form-handler.ts` lines 518-537, 558-577
- **Behavior**: Skips SMS consent and carrier selection if no phone provided
- **Skip Logic**:
  - Phone step button checks if phone input is empty
  - If empty, sets `smsAlerts` to `false` and jumps ahead +2 steps
  - Previous button on following steps also accounts for skipped SMS steps

## Skip Logic System

### Authentication-Based Skipping

- **Location**: `multi-step-form-handler.ts` lines 745-852
- **Function**: `initializeMultiStepForm()`
- **Features**:
  - Evaluates `skipCondition` from form config
  - Skips steps based on `initialData` (e.g., authenticated user info)
  - Finds first valid non-skipped step on load
  - Overrides navigation to skip over conditional steps
- **Use Case**: Skips email/name/phone steps for authenticated users

## Form Submission

### Duplicate Prevention

- **Location**: `multi-step-form-handler.ts` lines 608-709
- **Behavior**: Uses `isSubmitting` flag to prevent duplicate submissions
- **Button State**: Disables submit button during processing

### Custom vs Default Submission

- **Custom**: Uses `options.onSubmit()` callback if provided
- **Default**: Standard fetch POST to `form.action`
- **Feedback**: Shows loading notice, then success/error notice
- **Redirect**: Honors `result.redirect` from API response

### Logging

- **Behavior**: Comprehensive console logging for debugging
- **Prefix**: All logs use `[MULTISTEP-FORM]` prefix
- **Information**: Logs validation, submission, errors, and redirects

## Review Step Features

### Auto-Update Display

- **Location**: `multi-step-form-handler.ts` lines 329-363
- **Trigger**: Automatically called when entering a step with `.edit-step` buttons
- **Updates**: Syncs review display with current form values
- **Special Handling**:
  - Password: Shows `••••••` instead of actual value
  - SMS Alerts: Converts boolean to "Yes"/"No"
  - Mobile Carrier: Extracts display text from button
  - Name: Combines firstName + lastName

### Edit Button Navigation

- **Location**: `multi-step-form-handler.ts` lines 581-586
- **Behavior**: Jumps back to specific step for editing
- **Data Preservation**: Form data persists when navigating back

## Animation Effects

### Button Focus Effects

- **Location**: `multi-step-form-handler.ts` lines 110-124
- **Behavior**: Removes focus outline classes when leaving a step
- **Classes Removed**: `!outline`, `!outline-2`, `!outline-dashed`, `!outline-primary-500`, `!outline-offset-2`, `dark:!outline-primary-400`

### Smooth Scrolling

- **Behavior**: When focusing inputs, smoothly scrolls element to center of viewport
- **CSS**: `{ behavior: "smooth", block: "center" }`

## Title Block Visibility

### Step 1 Only Display

- **Location**: `multi-step-form-handler.ts` lines 135-143
- **Behavior**: Shows `.step-1-only` elements only on first step
- **Purpose**: Allows for special header/hero content on initial step
- **Implementation**: Uses `display: block` and `display: none`

## Summary

All features from the old `ContactForm` and `MultiStepRegisterForm` are preserved in the new JSON system through the `multi-step-form-handler.ts` module. The handler provides:

✅ **Auto-focus on step transitions**
✅ **Phone number formatting**
✅ **Input validation with touch tracking**
✅ **Email uniqueness checking**
✅ **Enter key navigation**
✅ **Animated progress bar**
✅ **Choice button interactions**
✅ **Conditional step display**
✅ **Skip logic for authenticated users**
✅ **Form submission with duplicate prevention**
✅ **Review step auto-updates**
✅ **Edit button navigation**
✅ **Button focus effects**
✅ **Smooth scrolling**

The system is fully feature-complete and maintains all the JavaScript enhancements from the original forms.
