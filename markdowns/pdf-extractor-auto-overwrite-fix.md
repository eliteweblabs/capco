# PDF Data Extractor - Auto-Overwrite Fix & Text Formatting

## Issue Description

The PDF data extractor had a UX bug where:
1. After extracting text from the PDF, users HAD to click the "Set" button to continue
2. The crosshair cursor was NOT triggered when focusing on `#project-form-pdf-current-field-input`
3. Re-selecting/extracting text did NOT overwrite the existing value in the input field
4. Extracted text was often in ALL CAPS and needed manual formatting

## Solution Implemented

### 1. Added Focus Event Listener for Current Field Input

**Location:** `initializeCurrentField()` function (~line 1113-1147)

Added an event listener that enables selection mode (crosshair cursor) when the user focuses on the guided interface input field:

```javascript
if (currentFieldInput) {
  currentFieldInput.addEventListener("focus", () => {
    console.log("🎯 [PDF-GUIDED] Current field input focused, enabling selection mode");
    enableSelectionMode();
  });
}
```

### 2. Auto-Overwrite on Re-Selection

**Location:** OCR processing in guided mode (~line 2198-2228)

Modified the OCR result handler to:
- Always overwrite the current value in `currentFieldInput` with extracted text
- Keep selection mode enabled after extraction (instead of disabling it)
- Trigger input events for any listeners
- Update the success message to indicate users can "select again to replace"

**Before:**
```javascript
currentFieldInput.value = extractedText;
// ... 
clearSelection();
disableSelectionMode(); // This prevented re-selection
```

**After:**
```javascript
currentFieldInput.value = extractedText;
currentFieldInput.dispatchEvent(new Event("input", { bubbles: true }));
// ...
clearSelection();
// Keep selection mode enabled for re-selection
setTimeout(() => {
  enableSelectionMode();
}, 200);
```

### 3. Added Smart Capitalization Normalization

**Location:** New function `normalizeCapitalization()` (~line 1806-1833)

Added automatic text formatting that converts ALL CAPS text to proper title case:

**Features:**
- Detects if text is mostly uppercase (>80% uppercase letters)
- Converts to title case with proper capitalization rules
- Preserves capitalization for text that's already properly formatted
- Handles common small words (a, an, the, and, but, or, for, etc.) correctly
- Applied to both guided interface and direct form field population

**Example Transformations:**
- `"123 MAIN STREET"` → `"123 Main Street"`
- `"JOHN DOE ARCHITECT"` → `"John Doe Architect"`
- `"FIRE PROTECTION SYSTEM"` → `"Fire Protection System"`
- `"Already Proper"` → `"Already Proper"` (unchanged)

```javascript
function normalizeCapitalization(text: string): string {
  if (!text) return text;

  // Check if text is mostly uppercase (more than 80% uppercase letters)
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[A-Za-z]/g) || []).length;
  const isAllCaps = letterCount > 0 && upperCount / letterCount > 0.8;

  if (!isAllCaps) return text; // Return as-is if not all caps

  // Convert to title case (capitalize first letter of each word, rest lowercase)
  return text
    .toLowerCase()
    .split(/\b/)
    .map((word, index) => {
      // Don't capitalize common small words unless they're first
      const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in'];
      if (index > 0 && smallWords.includes(word.toLowerCase().trim())) {
        return word.toLowerCase();
      }
      // Capitalize first letter of each word
      if (word.match(/^[a-z]/)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join('');
}
```

### 4. Maintained Error State Selection

**Location:** Error handler in guided mode (~line 2337-2347)

Updated error handler to properly restore the placeholder text using the current field's label and re-enable selection mode.

## User Flow Now

1. User focuses on `#project-form-pdf-current-field-input` → Crosshair cursor activates automatically
2. User selects text from PDF → Text is extracted, formatted (ALL CAPS → Title Case), and populates the input field
3. User can:
   - **Option A:** Select again to overwrite with different text (crosshair stays active)
   - **Option B:** Click "Set" button to apply the value to the form field
4. After clicking "Set", the next field is automatically initialized with crosshair ready

## Benefits

- ✅ More intuitive workflow - crosshair activates on focus
- ✅ Faster iteration - users can quickly re-select if they grabbed the wrong text
- ✅ No forced "Set" button click before re-selecting
- ✅ Maintains guided interface flow without interruption
- ✅ **Automatic text formatting** - converts ALL CAPS to proper Title Case
- ✅ **Smart detection** - only formats text that needs it (>80% uppercase)
- ✅ **Preserves intent** - respects already properly formatted text

## Files Modified

- `src/components/project/ProjectForm.astro`
  - Lines ~1806-1833: Added `normalizeCapitalization()` function
  - Lines ~1113-1147: Added focus listener
  - Lines ~2198-2228: Updated OCR result handling with capitalization normalization
  - Lines ~2337-2347: Updated error handling
  - Lines ~1835-1860: Integrated normalization into `formatExtractedText()`
