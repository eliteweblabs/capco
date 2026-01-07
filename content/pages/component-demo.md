---
title: "Component Demo"
description: "Demonstration page showing embedded components in markdown"
lastUpdated: "auto"
template: "default"
---

# Embedded Components Demo

This page demonstrates how to embed Astro components directly in markdown content.

## Google Map

Here's a Google Map showing San Francisco:

<GoogleMap lat="37.7749" lng="-122.4194" zoom="12"/>

## Contact Form

Need to get in touch? Use our contact form:

<ContactForm/>

## Speed Dial

Quick actions are available via our speed dial:

<SpeedDial/>

## Pricing

Check out our pricing:

<PricingCard title="Starter" price="29" features="Basic features,Email support,5 projects"/>

## How It Works

1. Write markdown content normally
2. Embed components using `<ComponentName prop="value"/>`
3. Components are automatically rendered and injected into the page

### Available Components

You can use any component from the registry:

- **Features**: GoogleMap, Testimonials, CalComBooking, VapiChatWidget, etc.
- **Shared**: ContactForm, PricingCard, PDFPreview, SpeedDial
- **Layout**: LandingProduct

Simply use the component name with props:

```html
<GoogleMap lat="37.7749" lng="-122.4194" zoom="12"/>
<ContactForm/>
<Testimonials count="3"/>
```

## More Content

You can continue writing markdown content normally. Components seamlessly integrate with your text, images, and other markdown elements.

---

*Built with Astro and the Markdown Component System*

