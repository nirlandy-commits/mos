export function normalizeMosPath(pathname = globalThis.location?.pathname || "/") {
  return pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
}

export function getMosRoute(pathname = globalThis.location?.pathname || "/") {
  const normalizedPath = normalizeMosPath(pathname);
  return normalizedPath.endsWith("/app") ? "app" : "landing";
}

export function buildMosPath(route = "landing") {
  const pathname = normalizeMosPath(globalThis.location?.pathname || "/");
  const segments = pathname.split("/").filter(Boolean);
  const baseSegments = segments[segments.length - 1] === "app" ? segments.slice(0, -1) : segments;
  const basePath = `/${baseSegments.join("/")}`.replace(/\/+/g, "/");
  if (route === "app") return `${basePath === "/" ? "" : basePath}/app`;
  return basePath === "" ? "/" : basePath;
}

export function navigateMosRoute(route = "landing", { replace = false } = {}) {
  const nextPath = buildMosPath(route);
  const method = replace ? "replaceState" : "pushState";
  globalThis.history?.[method]?.({}, "", nextPath);
}
