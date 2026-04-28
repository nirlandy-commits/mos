export function getMosAppMode() {
  const explicitMode = String(globalThis.MOS_APP_MODE || "").trim().toLowerCase();
  if (explicitMode === "public" || explicitMode === "real" || explicitMode === "demo") {
    return explicitMode;
  }
  return globalThis.MOS_LOCAL_DEMO ? "demo" : "real";
}

export function isMosDemoMode() {
  return getMosAppMode() === "demo";
}

export function isMosPublicMode() {
  return getMosAppMode() === "public";
}

export function isMosRealMode() {
  return getMosAppMode() === "real";
}
