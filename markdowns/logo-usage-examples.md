# Logo Component Usage Examples

The enhanced Logo component now supports multiple output types and configurations with proper architecture.

## Architecture

- **Logo Component** (`src/components/common/Logo.astro`): The source of truth for the logo
- **Logo Utils** (`src/lib/logo-utils.ts`): Contains the actual SVG content and utility functions
- **Placeholder Utils** (`src/lib/placeholder-utils.ts`): Imports from logo-utils for use in templates

## Basic Usage

```astro
---
import Logo from "../components/common/Logo.astro";
---

<!-- Default: renders as SVG component -->
<Logo />

<!-- With custom link -->
<Logo link="/custom-page" />

<!-- Different sizes -->
<Logo size="sm" />
<Logo size="md" />
<Logo size="lg" />
<Logo size="xl" />
```

## Advanced Usage - Different Output Types

```astro
---
import Logo from "../components/common/Logo.astro";
---

<!-- Get as string for use in utilities -->
<Logo file="string" />

<!-- Get as data URL for use in CSS or img src -->
<Logo file="data-url" />

<!-- Get as base64 for embedding -->
<Logo file="base64" />
```

## Usage in TypeScript/JavaScript

```typescript
// In a utility function - import directly from logo-utils
import { getCapcoLogoSvg } from "../lib/logo-utils";

const logoSvg = getCapcoLogoSvg("md"); // Specify size
// Use the SVG string in your utility functions
```

## Usage in Email Templates

```typescript
// In email-delivery.ts or similar - import from placeholder-utils
import { getCapcoLogoSvg } from "../lib/placeholder-utils";

const placeholderData = {
  svgLogo: getCapcoLogoSvg("md"), // Specify size
  // ... other placeholder data
};
```

## Props Interface

```typescript
interface Props {
  file?: "svg" | "string" | "data-url" | "base64";
  size?: "sm" | "md" | "lg" | "xl";
  link?: string;
  className?: string;
}
```

## Size Configurations

- **sm**: 100x17.2px
- **md**: 155x26.6px (default)
- **lg**: 200x34.3px
- **xl**: 250x42.9px

## Output Types

- **svg**: Renders the full component (default)
- **string**: Returns just the SVG string for utilities
- **data-url**: Returns as `data:image/svg+xml;base64,{encoded}`
- **base64**: Returns just the base64 encoded string

## Benefits of New Architecture

1. **Single Source of Truth**: Logo content is defined once in `logo-utils.ts`
2. **Proper Dependencies**: Placeholder utils imports from logo utils, not the other way around
3. **Maintainability**: Changes to the logo only need to be made in one place
4. **Type Safety**: Proper TypeScript interfaces and imports
5. **Flexibility**: Multiple output formats and sizes supported
