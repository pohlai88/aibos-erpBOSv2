import { DEFAULT_FLAGS, type FeatureFlags } from '@aibos/config';

export function getFlags(): FeatureFlags {
  return {
    M01: (process.env.NEXT_PUBLIC_FEATURE_M01 as FeatureFlags['M01']) || DEFAULT_FLAGS.M01,
    M02: (process.env.NEXT_PUBLIC_FEATURE_M02 as FeatureFlags['M02']) || DEFAULT_FLAGS.M02,
    M03: (process.env.NEXT_PUBLIC_FEATURE_M03 as FeatureFlags['M03']) || DEFAULT_FLAGS.M03,
  };
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFlags();
  return flags[feature] === "on";
}

export function isFeatureBeta(feature: keyof FeatureFlags): boolean {
  const flags = getFlags();
  return flags[feature] === "beta";
}

export function isFeatureOff(feature: keyof FeatureFlags): boolean {
  const flags = getFlags();
  return flags[feature] === "off";
}
