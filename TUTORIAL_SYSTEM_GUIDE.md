# Tutorial System Guide

A comprehensive walk-through tutorial system with masking, popovers, and user progress tracking.

## Features

- 🎯 **Element Highlighting**: Highlights specific elements with masking
- 💬 **Smart Popovers**: Positioned popovers with arrows pointing to elements
- 🧭 **Navigation**: Previous/Next/Finish/Skip controls
- 💾 **Progress Tracking**: Saves user progress and preferences
- 🍪 **Cookie Persistence**: Remembers if tutorial was completed/dismissed
- ⌨️ **Keyboard Navigation**: Arrow keys, Escape to close
- 📱 **Responsive**: Works on all screen sizes
- 🌙 **Dark Mode**: Supports light and dark themes

## Quick Start

### 1. Run Database Migration

```bash
./run-tutorial-migration.sh
```

### 2. Add TutorialOverlay to Your Page

```astro
---
import TutorialOverlay from '../components/common/TutorialOverlay.astro';
const currentUserId = "user-123";
---

<TutorialOverlay 
  currentUserId={currentUserId}
  tutorialId="dashboard-tour"
  autoStart={false}
/>
```

### 3. Add Tutorial Steps to Elements

```html
<!-- Dashboard Header -->
<div 
  data-welcome='{"title": "Dashboard", "msg": "This is your main dashboard where you can see all your projects", "position": "bottom", "icon": "bx-home"}'
  class="dashboard-header"
>
  <h1>Dashboard</h1>
</div>

<!-- Project List -->
<div 
  data-welcome='{"title": "Projects", "msg": "Here you can see all your active projects", "position": "right", "icon": "bx-folder"}'
  class="project-list"
>
  <!-- Project items -->
</div>

<!-- Add Project Button -->
<button 
  data-welcome='{"title": "Create Project", "msg": "Click here to create a new project", "position": "top", "icon": "bx-plus", "action": "click"}'
  class="add-project-btn"
>
  Add Project
</button>
```

## Data Welcome Attribute Format

```json
{
  "title": "Step Title",
  "msg": "Step description message",
  "position": "top|bottom|left|right|center",
  "icon": "bx-icon-name",
  "action": "click|focus|scroll"
}
```

### Properties

- **title** (string): The title shown in the popover
- **msg** (string): The description message
- **position** (string): Where to position the popover relative to the element
- **icon** (string): BoxIcons class name for the step icon
- **action** (string): Optional action to perform when step is shown

## API Endpoints

### GET/POST `/api/tutorial-config`
- **GET**: Retrieve tutorial configuration for a user
- **POST**: Create or get tutorial configuration
- **PUT**: Update tutorial progress
- **DELETE**: Reset tutorial progress

### Request Body
```json
{
  "userId": "user-123",
  "tutorialId": "dashboard-tour",
  "completed": false,
  "dismissed": false,
  "lastStep": 0
}
```

## JavaScript API

### Start Tutorial
```javascript
// Start the tutorial
window.tutorialManager.startTutorial();

// Reset tutorial (for testing)
window.tutorialManager.resetTutorial();
```

### Tutorial Events
```javascript
// Listen for tutorial events
document.addEventListener('tutorial-started', (e) => {
  console.log('Tutorial started');
});

document.addEventListener('tutorial-completed', (e) => {
  console.log('Tutorial completed');
});

document.addEventListener('tutorial-dismissed', (e) => {
  console.log('Tutorial dismissed');
});
```

## Styling Customization

### CSS Variables
```css
:root {
  --tutorial-primary-color: #3b82f6;
  --tutorial-bg-color: white;
  --tutorial-text-color: #111827;
  --tutorial-mask-color: rgba(0, 0, 0, 0.7);
}
```

### Custom Classes
```css
.tutorial-highlight {
  /* Custom highlight styles */
  box-shadow: 0 0 0 3px var(--tutorial-primary-color);
}

.tutorial-popover {
  /* Custom popover styles */
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

## Advanced Usage

### Multiple Tutorials
```astro
<!-- Different tutorials for different pages -->
<TutorialOverlay 
  currentUserId={currentUserId}
  tutorialId="dashboard-tour"
/>

<TutorialOverlay 
  currentUserId={currentUserId}
  tutorialId="project-tour"
/>
```

### Conditional Tutorials
```astro
---
// Only show tutorial for new users
const showTutorial = currentUser?.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
---

{showTutorial && (
  <TutorialOverlay 
    currentUserId={currentUserId}
    tutorialId="onboarding"
    autoStart={true}
  />
)}
```

### Custom Actions
```javascript
// In your page script
window.tutorialManager = new TutorialManager(userId, tutorialId);

// Add custom action handlers
window.tutorialManager.executeAction = function(action) {
  switch(action) {
    case 'openModal':
      document.getElementById('example-modal').click();
      break;
    case 'scrollToSection':
      document.getElementById('target-section').scrollIntoView();
      break;
  }
};
```

## Database Schema

### tutorial_configs Table
```sql
CREATE TABLE tutorial_configs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tutorial_id VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  last_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);
```

## Troubleshooting

### Common Issues

1. **Tutorial not starting**
   - Check if `currentUserId` is provided
   - Verify database migration was run
   - Check browser console for errors

2. **Elements not highlighting**
   - Ensure `data-welcome` attribute is valid JSON
   - Check if target elements exist in DOM
   - Verify CSS is loaded

3. **Progress not saving**
   - Check API endpoint is accessible
   - Verify user authentication
   - Check database permissions

### Debug Mode
```javascript
// Enable debug logging
window.tutorialManager.debug = true;
```

## Examples

### Complete Dashboard Tutorial
```html
<!-- Step 1: Welcome -->
<div data-welcome='{"title": "Welcome!", "msg": "Let's take a quick tour of your dashboard", "position": "center", "icon": "bx-smile"}'></div>

<!-- Step 2: Navigation -->
<nav data-welcome='{"title": "Navigation", "msg": "Use this menu to navigate between sections", "position": "bottom", "icon": "bx-menu"}'></nav>

<!-- Step 3: Projects -->
<div data-welcome='{"title": "Your Projects", "msg": "Here are all your active projects", "position": "right", "icon": "bx-folder"}'></div>

<!-- Step 4: Create Button -->
<button data-welcome='{"title": "Create New", "msg": "Click here to create a new project", "position": "top", "icon": "bx-plus", "action": "click"}'></button>
```

### Project Page Tutorial
```html
<!-- Step 1: Project Header -->
<header data-welcome='{"title": "Project Details", "msg": "This shows your project information", "position": "bottom"}'></header>

<!-- Step 2: Status -->
<div data-welcome='{"title": "Project Status", "msg": "Track your project progress here", "position": "right"}'></div>

<!-- Step 3: Files -->
<section data-welcome='{"title": "Project Files", "msg": "Upload and manage your project files", "position": "left"}'></section>
```

## Best Practices

1. **Keep tutorials short** - 3-5 steps maximum
2. **Use clear, concise messages** - Avoid technical jargon
3. **Test on different screen sizes** - Ensure popovers position correctly
4. **Provide skip option** - Always allow users to dismiss
5. **Save progress** - Let users resume where they left off
6. **Use meaningful icons** - Choose icons that represent the action
7. **Position carefully** - Ensure popovers don't cover important content

## Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## Performance

- Lightweight: ~15KB minified
- No external dependencies
- Efficient DOM manipulation
- Minimal memory footprint
