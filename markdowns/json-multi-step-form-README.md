# 🎨 JSON Multi-Step Form Generator

A powerful, flexible, and beautiful multi-step form system that generates forms from JSON configuration files. No code required!

## ✨ Features

- 🎯 **JSON-Driven**: Define entire forms in simple JSON configuration files
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 📱 **Mobile-First**: Works perfectly on all device sizes
- ⚡ **Zero Code**: Create complex forms without writing HTML/JavaScript
- 🔧 **Highly Configurable**: Customize every aspect of your forms
- 🎭 **Multiple Field Types**: Support for 14+ field types including special components
- ✅ **Built-in Validation**: Client-side validation with custom error messages
- 🎪 **Conditional Logic**: Show/hide fields based on other field values
- 📊 **Progress Indicators**: Visual progress bars with step numbers
- 🎨 **Multiple Layouts**: Single column, 2-column, or 3-column grids
- 🔌 **Special Components**: Address search, phone/SMS, slot machine selectors
- 🎯 **Button Choices**: Turn multiple choice into beautiful button UIs
- 🎬 **Smooth Transitions**: Animated step transitions and focus management
- ♿ **Accessible**: ARIA-friendly with keyboard navigation support

## 🚀 Quick Start

### 1. Create a JSON Configuration

Create a file in `/config/my-form.json`:

```json
{
  "id": "my-form",
  "action": "/api/submit",
  "steps": [
    {
      "step": 1,
      "title": "What's your name?",
      "fields": [
        {
          "name": "firstName",
          "type": "text",
          "placeholder": "John",
          "required": true
        }
      ]
    }
  ]
}
```

### 2. Use in Your Astro Page

```astro
---
import JSONMultiStepForm from '@components/form/JSONMultiStepForm.astro';
import formConfig from '../config/my-form.json';
---

<JSONMultiStepForm config={formConfig} />
```

That's it! 🎉

## 📚 Documentation

- **[Full Documentation](./markdowns/json-multi-step-form.md)** - Complete guide with all features
- **[Quick Reference](./markdowns/json-multi-step-form-quick-reference.md)** - Cheat sheet for quick lookups
- **[Live Demo](http://localhost:4321/tests/form-demo?type=contact)** - Interactive examples

## 📦 What's Included

```
src/
├── components/form/
│   └── JSONMultiStepForm.astro    # Main form component
├── types/
│   └── form-config.ts              # TypeScript type definitions
└── pages/tests/
    └── form-demo.astro             # Demo page

config/
├── form-contact-example.json       # Simple contact form
├── form-register-example.json      # User registration form
└── form-survey-example.json        # Advanced survey form

markdowns/
├── json-multi-step-form.md         # Complete documentation
└── json-multi-step-form-quick-reference.md  # Quick reference
```

## 🎯 Examples

### Example 1: Simple Contact Form

6-step contact form with name, email, phone, company, address, and message.

**Config:** `/config/form-contact-example.json`

**Demo:** `http://localhost:4321/tests/form-demo?type=contact`

### Example 2: User Registration

Multi-step registration with email validation, password requirements, and optional phone/SMS consent.

**Config:** `/config/form-register-example.json`

**Demo:** `http://localhost:4321/tests/form-demo?type=register`

### Example 3: Advanced Survey

Complex survey demonstrating button choices, conditionals, select dropdowns, and multi-column layouts.

**Config:** `/config/form-survey-example.json`

**Demo:** `http://localhost:4321/tests/form-demo?type=survey`

## 🎨 Supported Field Types

### Standard Inputs
- ✏️ Text input
- 📧 Email input
- 📱 Phone input
- 🔒 Password input
- 🔢 Number input
- 🔗 URL input
- 📅 Date picker
- 📝 Textarea
- 📋 Select dropdown
- 🔐 Hidden field

### Special Components
- 📞 **Phone & SMS**: Phone input with SMS consent toggle
- 🗺️ **Address Search**: Google Places autocomplete
- 🎰 **Slot Machine**: Beautiful modal selector
- 🎯 **Button Choice**: Multiple choice as buttons

## ⚙️ Configuration Options

### Form Level
- Progress bar customization
- Success redirect and messages
- Default button styles
- Custom submit handlers
- Container styling
- Enable/disable Enter key navigation

### Step Level
- Multi-column layouts (1, 2, or 3 columns)
- Custom icons
- Conditional display logic
- Per-step button overrides
- Custom CSS classes

### Field Level
- All HTML5 validation attributes
- Custom error messages
- Conditional visibility
- Auto-focus control
- Grid column spanning
- Component-specific props

## 🎨 Customization

### Button Variants
- `primary` - Primary brand color
- `secondary` - Secondary color
- `outline` - Outlined style
- `ghost` - Transparent with hover
- `anchor` - Link style

### Button Sizes
- `sm` - Small
- `md` - Medium
- `lg` - Large
- `xl` - Extra large

### Icons
Use any [BoxIcon](https://boxicons.com/) name:
`arrow-right`, `arrow-left`, `send`, `envelope`, `user`, `phone`, `building-2`, `lock`, `check-circle`, etc.

## 🔧 Advanced Features

### Conditional Logic
```json
{
  "conditional": {
    "dependsOn": "fieldName",
    "showWhen": "expectedValue"
  }
}
```

### Multi-Column Layouts
```json
{
  "layout": "grid-2",
  "fields": [
    { "name": "firstName", "type": "text" },
    { "name": "lastName", "type": "text" },
    { "name": "email", "type": "email", "colSpan": 2 }
  ]
}
```

### Custom Submit Handler
```json
{
  "customSubmitHandler": "myFunction"
}
```

```javascript
window.myFunction = async (form, formData) => {
  // Your custom logic
};
```

## 💡 Best Practices

✅ **Do:**
- Use conversational, question-style titles
- Break complex forms into logical steps
- Provide helpful placeholder examples
- Use appropriate input types for validation
- Add skip buttons for optional steps
- Test on mobile devices

❌ **Don't:**
- Create overly long forms (keep steps focused)
- Skip validation
- Use generic error messages
- Forget to mark required fields
- Ignore mobile responsiveness

## 🛠️ Tech Stack

- **Astro** - Framework
- **Tailwind CSS** - Styling
- **Flowbite** - UI Components
- **BoxIcons** - Icon library
- **TypeScript** - Type definitions

## 📖 API Reference

See [Full Documentation](./markdowns/json-multi-step-form.md) for complete API reference including:
- All configuration options
- Field type specifications
- Validation rules
- Button configurations
- Component props
- TypeScript types

## 🎯 TypeScript Support

Full TypeScript definitions available:

```typescript
import type { FormConfig } from '@/types/form-config';

const config: FormConfig = {
  // Your config with full type safety and autocomplete
};
```

## 🐛 Troubleshooting

**Form not submitting?**
- Check `action` URL is correct
- Verify API endpoint exists
- Check browser console for errors

**Fields not showing?**
- Verify `type` spelling
- Check conditional logic
- Ensure unique field names

**Validation not working?**
- Use boolean `true`, not string `"true"`
- Set proper `errorMessage`
- Check HTML5 validation attributes

## 📝 License

Part of the Astro Supabase project.

## 🤝 Contributing

Based on patterns from:
- `ContactForm.astro`
- `MultiStepRegisterForm.astro`

Designed to be easily extensible with new field types and features.

## 🎓 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [Flowbite Components](https://flowbite.com)
- [BoxIcons](https://boxicons.com)

---

**Built with ❤️ using Astro, Tailwind CSS, and Flowbite**

*Ready to create beautiful forms with zero code? Check out the examples and start building!* 🚀
