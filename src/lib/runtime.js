import { createMosBrainEngine } from "./mos-brain-engine.js";
import { createAdminAccessMap } from "./future/admin.js";
import { createMosImportService } from "./future/imports.js";
import { createMonetizationSlot } from "./future/monetization.js";
import { createReminderService } from "./future/reminders.js";

export function createMosRuntime() {
  return {
    brain: createMosBrainEngine(),
    imports: createMosImportService(),
    reminders: createReminderService(),
    admin: createAdminAccessMap(),
    monetization: {
      createSlot: createMonetizationSlot,
    },
  };
}

export const mosRuntime = createMosRuntime();
