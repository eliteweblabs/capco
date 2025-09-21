# Flowbite Component Examples

This folder contains Flowbite component examples based on the [Flowbite Application UI](https://flowbite.com/application-ui/preview/) that you can use as models for your project.

## Components Included

### 1. `flowbite-navbar.astro`

- **Purpose**: Replace your current header with Flowbite's navbar
- **Features**:
  - Responsive design
  - Mobile hamburger menu
  - Dark mode support
  - Safari 18 compatible

### 2. `flowbite-floating-button.astro`

- **Purpose**: Replace your SpeedDial with Flowbite's floating action button
- **Features**:
  - Fixed positioning (Safari 18 compatible)
  - Drawer integration
  - Quick actions menu

### 3. `flowbite-modal.astro`

- **Purpose**: Replace your SlotMachine modal with Flowbite's modal
- **Features**:
  - Backdrop click to close
  - Keyboard navigation
  - Responsive design

## How to Use

1. **Copy the component code** from these examples
2. **Replace your existing components** with Flowbite versions
3. **Customize the content** to match your app's needs
4. **Test Safari 18 compatibility** - these components handle viewport issues

## Safari 18 Benefits

These Flowbite components are specifically designed to work with Safari 18's viewport changes:

- ✅ **Fixed positioning** works correctly
- ✅ **Sticky headers** stay in place
- ✅ **Modal positioning** is stable
- ✅ **Mobile viewport** handles address bar changes

## Next Steps

1. Replace your `Header.astro` with the navbar example
2. Replace your `SpeedDial.astro` with the floating button example
3. Replace your `SlotMachineModal.astro` with the modal example
4. Test in Safari 18 to confirm viewport issues are resolved

## Installation

Make sure you have Flowbite installed:

```bash
npm install flowbite
npm install flowbite-astro
```

Then add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/flowbite/**/*.js",
  ],
  plugins: [require("flowbite/plugin")],
};
```
