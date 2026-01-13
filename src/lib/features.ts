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
export async function featureGate<T>(featureKey: string, component: T): Promise<T | null> {
  return (await baseIsFeatureEnabled(featureKey)) ? component : null;
}

/**
 * Get all enabled features
 */
export async function getEnabledFeatures(): Promise<string[]> {
  const config = await getSiteConfig();
  return Object.entries(config.features)
    .filter(([_, value]) => {
      if (typeof value === 'boolean') {
        return value === true;
      }
      if (value && typeof value === 'object' && 'enabled' in value) {
        return value.enabled === true;
      }
      return false;
    })
    .map(([key]) => key);
}

/**
 * Check if any of the features are enabled
 */
export async function anyFeatureEnabled(...features: string[]): Promise<boolean> {
  const results = await Promise.all(features.map(f => baseIsFeatureEnabled(f)));
  return results.some(r => r);
}

/**
 * Check if all features are enabled
 */
export async function allFeaturesEnabled(...features: string[]): Promise<boolean> {
  const results = await Promise.all(features.map(f => baseIsFeatureEnabled(f)));
  return results.every(r => r);
}

/**
 * Get feature configuration for a specific feature
 */
export async function getFeatureConfig(featureKey: string): Promise<boolean> {
  const config = await getSiteConfig();
  const feature = config.features[featureKey];
  if (typeof feature === 'boolean') {
    return feature;
  }
  if (feature && typeof feature === 'object' && 'enabled' in feature) {
    return feature.enabled;
  }
  return false;
}

/**
 * Check if feature is explicitly disabled (not just missing)
 */
export async function isFeatureDisabled(featureKey: string): Promise<boolean> {
  const config = await getSiteConfig();
  const feature = config.features[featureKey];
  if (typeof feature === 'boolean') {
    return feature === false;
  }
  if (feature && typeof feature === 'object' && 'enabled' in feature) {
    return !feature.enabled;
  }
  return false;
}

