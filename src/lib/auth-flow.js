export function getStateEmail(state) {
  return state?.auth?.email || state?.profile?.email || "";
}

export function resolveInitialScreen({ persistedState, shouldForceLogin = false }) {
  if (shouldForceLogin) return "login";
  return persistedState?.auth?.signedIn ? "home" : "welcome";
}

export function resolveSignedOutScreen({ appRoute = "landing", inRecoveryFlow = false }) {
  if (inRecoveryFlow) return "reset-password";
  return appRoute === "app" ? "login" : "welcome";
}

export function resolveSignedInScreen({ inRecoveryFlow = false }) {
  return inRecoveryFlow ? "reset-password" : "home";
}
