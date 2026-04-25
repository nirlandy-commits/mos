export const MOS_ADMIN_SECTIONS = Object.freeze([
  { id: "users", label: "Usuários" },
  { id: "plans", label: "Planos" },
  { id: "metrics", label: "Métricas" },
  { id: "content", label: "Conteúdo" },
]);

export function createAdminAccessMap(overrides = {}) {
  return {
    sections: overrides.sections || MOS_ADMIN_SECTIONS,
    allowlist: overrides.allowlist || [],
    roles: overrides.roles || [],
  };
}

export function canAccessAdminFeature(context = {}, sectionId = "") {
  const allowlist = context.allowlist || [];
  const email = String(context.email || "").toLowerCase();
  return Boolean(sectionId) && allowlist.includes(email);
}
