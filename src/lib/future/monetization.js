export const MOS_PLAN_TIERS = Object.freeze({
  FREE: "free",
  PRO: "pro",
  PARTNER: "partner",
});

export const MOS_MONETIZATION_ZONES = Object.freeze([
  { id: "landing-hero", label: "Landing hero" },
  { id: "landing-footer", label: "Landing footer" },
  { id: "app-right-rail", label: "App right rail" },
  { id: "app-inline-card", label: "App inline card" },
]);

export function createMonetizationSlot(overrides = {}) {
  return {
    id: overrides.id || "",
    zone: overrides.zone || MOS_MONETIZATION_ZONES[0].id,
    enabled: overrides.enabled ?? false,
    tier: overrides.tier || MOS_PLAN_TIERS.FREE,
    partner: overrides.partner || "",
    payload: overrides.payload || null,
  };
}
