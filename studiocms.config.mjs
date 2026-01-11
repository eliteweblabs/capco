import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
  // Enable database initialization page (first time setup)
  dbStartPage: true,
  
  // Database configuration - using PostgreSQL (Supabase)
  db: {
    dialect: 'postgres',
  },
  
  // Enable dashboard features
  features: {
    // Enable SDK for API access
    sdk: true,
    
    // Dashboard configuration
    dashboardConfig: {
      // Customize dashboard settings here if needed
    },
  },
  
  // Verbose logging for debugging
  verbose: process.env.NODE_ENV === 'development',
});

