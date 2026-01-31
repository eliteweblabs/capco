# Use Node.js 22.18.0 to address security vulnerabilities
FROM node:22.18.0-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S astro -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Ensure the production startup script has execute permissions and verify it exists
RUN ls -la scripts/start-production.sh && chmod +x scripts/start-production.sh && ls -la scripts/start-production.sh

# Make content init scripts executable
RUN chmod +x scripts/init-persistent-content.sh 2>/dev/null || true
RUN chmod +x scripts/init-content.sh 2>/dev/null || true

# Initialize persistent content volume (runs at build time, but volume persists at runtime)
# Note: Volume must be mounted at /data/content in Railway
RUN mkdir -p /data/content/pages && \
    if [ -f "scripts/init-persistent-content.sh" ]; then \
      ./scripts/init-persistent-content.sh || true; \
    fi

# Change ownership of all files to non-root user
RUN chown -R astro:nodejs /app

# Switch to non-root user
USER astro

# Build the application with environment variables
# Accept build-time arguments (Railway passes these automatically)

# Campfire Chat Widget
ARG PUBLIC_CAMPFIRE_URL
ARG PUBLIC_CAMPFIRE_WIDGET_ID

# VAPI Voice Assistant
ARG PUBLIC_VAPI_KEY
ARG PUBLIC_VAPI_ASSISTANT_ID

# Company Branding
ARG GLOBAL_COMPANY_LOGO_SVG
ARG GLOBAL_COMPANY_LOGO_SVG_LIGHT
ARG GLOBAL_COMPANY_LOGO_SVG_DARK
ARG GLOBAL_COMPANY_ICON_SVG
ARG GLOBAL_COMPANY_ICON_SVG_LIGHT
ARG GLOBAL_COMPANY_ICON_SVG_DARK
ARG GLOBAL_COMPANY_SLOGAN
ARG GLOBAL_COLOR_PRIMARY
ARG GLOBAL_COLOR_SECONDARY
ARG RAILWAY_PROJECT_NAME
ARG YEAR

# Email Configuration
ARG EMAIL_API_KEY
ARG EMAIL_PROVIDER
ARG FROM_EMAIL
ARG FROM_NAME
ARG RESEND_WEBHOOK_SECRET

# Supabase
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_PUBLISHABLE
ARG SUPABASE_SECRET

# Google APIs
ARG GOOGLE_MAPS_API_KEY
ARG GOOGLE_PLACES_API_KEY

# Stripe
ARG STRIPE_PUBLISHABLE_KEY
ARG STRIPE_SECRET_KEY

# AI
ARG ANTHROPIC_API_KEY

# Railway
ARG RAILWAY_PUBLIC_DOMAIN

# Set environment variables for build (required for Astro build)

# Email
ENV EMAIL_API_KEY=$EMAIL_API_KEY
ENV EMAIL_PROVIDER=$EMAIL_PROVIDER
ENV FROM_EMAIL=$FROM_EMAIL
ENV FROM_NAME=$FROM_NAME
ENV RESEND_WEBHOOK_SECRET=$RESEND_WEBHOOK_SECRET

# Company Branding
ENV RAILWAY_PROJECT_NAME=$RAILWAY_PROJECT_NAME
ENV GLOBAL_COMPANY_SLOGAN=$GLOBAL_COMPANY_SLOGAN
ENV GLOBAL_COMPANY_LOGO_SVG=$GLOBAL_COMPANY_LOGO_SVG
ENV GLOBAL_COMPANY_LOGO_SVG_LIGHT=$GLOBAL_COMPANY_LOGO_SVG_LIGHT
ENV GLOBAL_COMPANY_LOGO_SVG_DARK=$GLOBAL_COMPANY_LOGO_SVG_DARK
ENV GLOBAL_COMPANY_ICON_SVG=$GLOBAL_COMPANY_ICON_SVG
ENV GLOBAL_COMPANY_ICON_SVG_LIGHT=$GLOBAL_COMPANY_ICON_SVG_LIGHT
ENV GLOBAL_COMPANY_ICON_SVG_DARK=$GLOBAL_COMPANY_ICON_SVG_DARK
ENV GLOBAL_COLOR_PRIMARY=$GLOBAL_COLOR_PRIMARY
ENV GLOBAL_COLOR_SECONDARY=$GLOBAL_COLOR_SECONDARY
ENV YEAR=$YEAR

# Google APIs
ENV GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY
ENV GOOGLE_PLACES_API_KEY=$GOOGLE_PLACES_API_KEY

# Stripe
ENV STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

# Supabase
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_PUBLISHABLE=$PUBLIC_SUPABASE_PUBLISHABLE
ENV SUPABASE_SECRET=$SUPABASE_SECRET

# AI
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Railway
ENV RAILWAY_PUBLIC_DOMAIN=$RAILWAY_PUBLIC_DOMAIN

# Campfire variables - Must be available at BUILD time (PUBLIC_ vars get embedded in JS)
ENV PUBLIC_CAMPFIRE_URL=$PUBLIC_CAMPFIRE_URL
ENV PUBLIC_CAMPFIRE_WIDGET_ID=$PUBLIC_CAMPFIRE_WIDGET_ID

# VAPI variables - Must be available at BUILD time (PUBLIC_ vars get embedded in JS)
ENV PUBLIC_VAPI_KEY=$PUBLIC_VAPI_KEY
ENV PUBLIC_VAPI_ASSISTANT_ID=$PUBLIC_VAPI_ASSISTANT_ID

# Build the application with Railway-specific settings
RUN npm run build:railway

# Expose ports (Railway uses dynamic PORT at runtime)
# Note: Railway ignores EXPOSE and uses PORT env var
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Note: PORT is provided by Railway at runtime, do not set it here

# Start both the Astro application and Socket.io server
CMD ["/bin/sh", "./scripts/start-production.sh"] 