export const MOS_REMINDER_TYPES = Object.freeze({
  WATER: "water",
  TRAINING: "training",
  SUPPLEMENT: "supplement",
  CALORIES: "calories",
});

export function createReminderRule(overrides = {}) {
  return {
    id: overrides.id || "",
    type: overrides.type || MOS_REMINDER_TYPES.WATER,
    enabled: overrides.enabled ?? true,
    schedule: overrides.schedule || "",
    threshold: overrides.threshold ?? null,
    audience: overrides.audience || "self",
  };
}

export function createReminderService() {
  return {
    supportedTypes: Object.values(MOS_REMINDER_TYPES),
    createRule: createReminderRule,
    async preview(rule = {}) {
      return {
        ok: true,
        status: "draft",
        rule: createReminderRule(rule),
      };
    },
    async dispatch() {
      return {
        ok: false,
        status: "not-implemented",
        message: "MOS reminders estão preparados, mas push real será ligado depois.",
      };
    },
  };
}
