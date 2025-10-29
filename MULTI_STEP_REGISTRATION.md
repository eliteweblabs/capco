# Multi-Step Registration Form

A beautiful, **full-screen** multi-step registration experience that guides users through account creation one question at a time with smooth rolling fade animations.

## Features

### 🎯 Step-by-Step Flow

1. **Email** - "What's your email?"
2. **Name** - "What's your name?" (First & Last)
3. **Company** - "What's your company?"
4. **Phone** - "How can we reach you?" (Optional, with SMS alerts)
5. **Review** - Review and submit

### ✨ Key Features

- **Full-Screen Experience** - Immersive, distraction-free registration
- **AOS Animations** - Smooth rolling fade-up animations using AOS library
- **Progress Bar** - Visual indicator showing current step and completion
- **Smooth Transitions** - Elegant fade animations between steps (800ms)
- **Validation** - Real-time validation with helpful error messages
- **Review & Edit** - Final review page with ability to edit any step
- **Keyboard Navigation** - Press Enter to advance to next step
- **Mobile Responsive** - Works beautifully on all devices
- **Dark Mode Support** - Full dark mode with gradient background
- **Icon Indicators** - Each step has a unique icon for visual clarity
- **Centered Layout** - Large, centered text inputs for better focus

### 🎨 Design Highlights

- **Full-screen immersive layout** with subtle transparent gradient overlay
- **Background pattern visible** through the transparent overlay with backdrop blur
- **Large 5xl headings** for maximum impact
- **Centered text inputs** for focus
- **AOS fade-up animations** with staggered delays (200ms, 400ms, 600ms)
- **Icon-based visual hierarchy** with 40px Simple icons
- **Professional gradient progress bar** at the top
- **Clean review summary cards** with edit buttons
- **Fixed login link** at bottom for easy access

## Usage

### Access the Form

Users can access the multi-step registration in two ways:

1. **Direct URL**: `/auth/register-multi-step`
2. **From Login Page**: Click "Try our step-by-step registration" link on the register tab

### Implementation Details

**Component**: `src/components/form/MultiStepRegisterForm.astro`
**Page**: `src/pages/auth/register-multi-step.astro`

### Navigation Flow

```
Step 1 (Email)
    ↓ [Continue] →
Step 2 (Name)
    ↓ [Continue] →
Step 3 (Company)
    ↓ [Continue] →
Step 4 (Phone)
    ↓ [Continue] →
Step 5 (Review & Submit)
    ↓ [Create Account]
```

### Validation

- **Step 1**: Valid email format required
- **Step 2**: First and last name required (min 2 characters each)
- **Step 3**: Company name required (min 2 characters)
- **Step 4**: Phone optional, but validated if provided
- **Step 5**: Final review before submission

### User Experience

1. **Focus Management** - Automatically focuses on first input when entering a step
2. **Keyboard Support** - Press Enter to advance to next step
3. **Back Navigation** - Easy to go back and change answers
4. **Edit Functionality** - Edit any field from the review page
5. **Progress Tracking** - Always shows current step number

## Technical Implementation

### Vanilla JavaScript

Built using vanilla JS/TypeScript following project guidelines (no React).

### AOS (Animate On Scroll) Library

- Uses the same AOS library as the index page for consistency
- Fade-up animations with staggered delays (200ms, 400ms, 600ms)
- AOS.refresh() called when switching steps to trigger animations
- Duration: 800ms with ease-out easing

### Form Data

All form fields are submitted together when user clicks "Create Account" on the final step. The form uses the same `/api/auth/register` endpoint as the traditional form.

### Styling

- **Full-screen layout** with fixed positioning
- **Subtle gradient overlay** (white with 40%→20%→10% opacity in light, black with 60%→40%→20% opacity in dark)
- **Backdrop blur** allowing the background pattern to show through
- **Tailwind CSS** for responsive design
- **Simple Icons** for iconography (mail, user, building-2, phone, check-circle, arrows)
- **AOS animations** for smooth rolling fade effects
- **Centered text inputs** with larger font sizes (text-xl)
- **Fixed login link** at bottom with backdrop blur

## Benefits

### For Users

- Less overwhelming than seeing all fields at once
- Clear progress indication
- Feels like a conversation
- Easy to correct mistakes
- Mobile-friendly interface

### For Business

- Higher completion rates
- Better user engagement
- Professional appearance
- Reduced form abandonment
- Accessible design

## Integration

The multi-step form integrates seamlessly with:

- Existing authentication system
- Supabase backend
- Profile creation
- RLS policies
- SMS notification preferences

## Future Enhancements

Potential improvements:

- Add animation variety (slide, fade, scale)
- Save progress locally (localStorage)
- Social proof/testimonials between steps
- Smart validation (suggest corrections)
- A/B testing capabilities
- Analytics integration
