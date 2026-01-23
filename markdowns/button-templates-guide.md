# Button Templates - Multi-Step Forms

Both `MultiStepRegisterForm` and `ContactForm` now use **button template props** in the frontmatter for easy customization.

## 📍 Location

**ContactForm:** `src/features/contact-form/components/ContactForm.astro` (lines 11-42)
**RegisterForm:** `src/components/form/MultiStepRegisterForm.astro` (lines 11-42)

## 🎨 Button Template Props

Instead of repeating button props everywhere, define them once at the top:

```typescript
const nextButtonProps = {
  type: "button",
  variant: "primary",
  size: "xl",
  class: "next-step",
  icon: "arrow-right",
  iconPosition: "right",
  iconClasses: "m-0 md:mr-2",
};

const prevButtonProps = {
  type: "button",
  variant: "outline",
  size: "xl",
  class: "prev-step",
  icon: "arrow-left",
  iconPosition: "left",
  iconClasses: "m-0 md:ml-2",
};

const submitButtonProps = {
  type: "button",
  variant: "primary",
  size: "xl",
  class: "submit-contact",
  icon: "send",
  iconPosition: "right",
  iconClasses: "m-0 md:mr-2",
};
```

## 🔧 How Buttons Use Templates

### Simple Usage (spread operator):

```astro
<!-- All props from template -->
<Button {...nextButtonProps} dataAttributes={{ "data-next": "2" }}>
  next
</Button>

<!-- Icon-only buttons -->
<Button {...prevButtonProps} dataAttributes={{ "data-prev": "1" }} />
```

### Override Specific Props:

```astro
<!-- Use template but change size -->
<Button {...nextButtonProps} size="lg" dataAttributes={{ "data-next": "3" }}>
  continue
</Button>

<!-- Use template but add extra classes -->
<Button {...prevButtonProps} class="prev-step px-12 text-lg" dataAttributes={{ "data-prev": "2" }} />
```

## ✏️ How to Customize

### Change All Next Buttons

Edit the template once, all Next buttons update:

```typescript
const nextButtonProps = {
  type: "button",
  variant: "success",      // ← Green instead of blue
  size: "lg",              // ← Smaller
  class: "next-step",
  icon: "chevron-right",   // ← Different icon
  iconPosition: "right",
  iconClasses: "",
};
```

**Result:** All 10+ Next buttons instantly become green, smaller, with a chevron! ✨

### Change All Previous Buttons

```typescript
const prevButtonProps = {
  type: "button",
  variant: "ghost",        // ← Transparent style
  size: "md",              // ← Smaller
  class: "prev-step",
  icon: "",                // ← Remove icon
  iconPosition: "left",
  iconClasses: "",
};
```

### Change Submit Button

```typescript
const submitButtonProps = {
  type: "button",
  variant: "success",      // ← Green for positive action
  size: "xl",
  class: "submit-contact",
  icon: "check-circle",    // ← Checkmark instead of arrow
  iconPosition: "left",    // ← Icon on left
  iconClasses: "m-0 md:ml-2",
};
```

## 🎯 Real Examples

### ContactForm Next Buttons

All of these use `nextButtonProps`:

```astro
<!-- Step 1 -->
<Button {...nextButtonProps} dataAttributes={{ "data-next": "2" }}>next</Button>

<!-- Step 2 -->  
<Button {...nextButtonProps} dataAttributes={{ "data-next": "3" }}>next</Button>

<!-- Step 3 -->
<Button {...nextButtonProps} size="lg" dataAttributes={{ "data-next": "4" }}>next</Button>

<!-- And so on... -->
```

Change `nextButtonProps` once → All update!

### RegisterForm Prev Buttons

All of these use `prevButtonProps`:

```astro
<!-- Step 2 -->
<Button {...prevButtonProps} dataAttributes={{ "data-prev": "1" }} />

<!-- Step 3 -->
<Button {...prevButtonProps} dataAttributes={{ "data-prev": "2" }} />

<!-- Step 4 -->
<Button {...prevButtonProps} dataAttributes={{ "data-prev": "3" }} />

<!-- Step 5 -->
<Button {...prevButtonProps} size="lg" class="prev-step px-12 text-lg" dataAttributes={{ "data-prev": "4" }} />
```

Change `prevButtonProps` once → All update!

## 📋 Available Props

### Button Variants
```typescript
variant: 
  | "primary"      // Blue/primary color
  | "secondary"    // Gray
  | "outline"      // Transparent with border
  | "ghost"        // Transparent, no border
  | "success"      // Green
  | "warning"      // Yellow
  | "danger"       // Red
```

### Sizes
```typescript
size:
  | "sm"   // Small
  | "md"   // Medium  
  | "lg"   // Large
  | "xl"   // Extra large
```

### Icon Positions
```typescript
iconPosition:
  | "left"   // Icon before text
  | "right"  // Icon after text
```

## 💡 Pro Tips

### 1. Icon-Only Buttons
Don't include text in the Button tag:
```astro
<Button {...prevButtonProps} dataAttributes={{ "data-prev": "1" }} />
```

### 2. Button with Text
Add text between tags:
```astro
<Button {...nextButtonProps} dataAttributes={{ "data-next": "2" }}>
  Continue
</Button>
```

### 3. Override Single Prop
Use spread + override:
```astro
<Button {...nextButtonProps} size="lg" dataAttributes={{ "data-next": "2" }}>
  next
</Button>
```

### 4. Override Multiple Props
```astro
<Button 
  {...nextButtonProps} 
  size="lg" 
  class="next-step custom-class"
  dataAttributes={{ "data-next": "2" }}
>
  continue
</Button>
```

## 🎨 Styling Examples

### Bold & Large Theme
```typescript
const nextButtonProps = {
  type: "button",
  variant: "primary",
  size: "xl",           // Extra large
  class: "next-step font-bold",  // Add bold
  icon: "arrow-right",
  iconPosition: "right",
  iconClasses: "text-2xl",  // Bigger icon
};
```

### Minimal Ghost Theme
```typescript
const prevButtonProps = {
  type: "button",
  variant: "ghost",     // No background
  size: "md",           // Small
  class: "prev-step",
  icon: "",             // No icon
  iconPosition: "left",
  iconClasses: "",
};
```

### Success/Positive Theme
```typescript
const submitButtonProps = {
  type: "button",
  variant: "success",   // Green
  size: "xl",
  class: "submit-contact shadow-lg",  // Add shadow
  icon: "check-circle",
  iconPosition: "left",
  iconClasses: "text-xl",
};
```

## ✅ Benefits

- ✅ **Edit once, update everywhere** - Change 1 object, update 10+ buttons
- ✅ **Clean code** - `<Button {...nextButtonProps} />` vs 10 lines of props
- ✅ **Type-safe** - TypeScript ensures valid values
- ✅ **Flexible** - Can override any prop when needed
- ✅ **Maintainable** - One place to look for button configuration
- ✅ **Consistent** - All buttons automatically match

## 📊 Button Count

### ContactForm (6 steps):
- Next buttons: 5 (all use `nextButtonProps`)
- Prev buttons: 5 (all use `prevButtonProps`)  
- Submit button: 1 (uses `submitButtonProps`)
- **Total: 11 buttons controlled by 3 templates**

### RegisterForm (6 steps):
- Next buttons: 5 (all use `nextButtonProps`)
- Prev buttons: 5 (all use `prevButtonProps`)
- Submit button: 1 (uses `submitButtonProps`)
- **Total: 11 buttons controlled by 3 templates**

## 🔍 Before & After Comparison

### ❌ Before (repetitive):
```astro
<Button
  type="button"
  variant="primary"
  size="xl"
  class="next-step"
  icon="arrow-right"
  iconPosition="right"
  iconClasses="m-0 md:mr-2"
  dataAttributes={{ "data-next": "2" }}
>
  next
</Button>

<!-- Repeated 10+ times with slight variations -->
```

### ✅ After (clean):
```astro
<!-- Define once at top -->
const nextButtonProps = {
  type: "button",
  variant: "primary",
  size: "xl",
  class: "next-step",
  icon: "arrow-right",
  iconPosition: "right",
  iconClasses: "m-0 md:mr-2",
};

<!-- Use everywhere -->
<Button {...nextButtonProps} dataAttributes={{ "data-next": "2" }}>
  next
</Button>
```

**Lines of code:** 11 lines → 3 lines per button! 📉

## 🚀 Quick Start

1. **Open the form file**
2. **Find the button templates** (lines 11-42)
3. **Edit the props** you want to change
4. **Save** - all buttons update automatically!

Example:
```typescript
// Want all Next buttons to be green?
const nextButtonProps = {
  variant: "success",  // ← Just change this!
  // ... rest stays same
};
```

Done! All Next buttons are now green. 🎉
