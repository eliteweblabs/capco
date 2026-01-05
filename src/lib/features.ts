/**
 * Feature Flags Utilities
 * 
 * Helper functions for working with feature flags from site-config.json
 */

import { isFeatureEnabled as baseIsFeatureEnabled, getSiteConfig } from './content';

// Re-export the base function
export { baseIsFeatureEnabled as isFeatureEnabled };

/**
 * Feature gate - returns component or null based on feature flag
 */
export function featureGate<T>(featureKey: string, component: T): T | null {
  return baseIsFeatureEnabled(featureKey) ? component : null;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  const config = getSiteConfig();
  return Object.entries(config.features)
    .filter(([_, value]) => value === true)
    .map(([key]) => key);
}

/**
 * Check if any of the features are enabled
 */
export function anyFeatureEnabled(...features: string[]): boolean {
  return features.some(f => baseIsFeatureEnabled(f));
}

/**
 * Check if all features are enabled
 */
export function allFeaturesEnabled(...features: string[]): boolean {
  return features.every(f => baseIsFeatureEnabled(f));
}

/**
 * Get feature configuration for a specific feature
 */
export function getFeatureConfig(featureKey: string): boolean {
  const config = getSiteConfig();
  return config.features[featureKey] ?? false;
}

/**
 * Check if feature is explicitly disabled (not just missing)
 */
export function isFeatureDisabled(featureKey: string): boolean {
  const config = getSiteConfig();
  return config.features[featureKey] === false;
}

