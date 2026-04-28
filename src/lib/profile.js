export const DEFAULT_PROFILE = Object.freeze({
  role: "user",
  calorieTarget: 2400,
  waterTargetMl: 3000,
  activeGoal: "",
  planFocus: "",
  planNotes: "",
  name: "",
  email: "",
  city: "",
  birthday: "",
  weight: 0,
  height: 0,
  age: 0,
  targetWeight: 0,
  // Future-ready: keeps avatar metadata in one place before upload/storage flows exist.
  avatar: {
    url: "",
    storagePath: "",
    mimeType: "",
    updatedAt: "",
  },
});

export function createProfile(overrides = {}) {
  return normalizeProfile(overrides, DEFAULT_PROFILE);
}

export function normalizeProfile(rawProfile = {}, fallbackProfile = DEFAULT_PROFILE) {
  const fallback = structuredClone(fallbackProfile);
  return {
    role: rawProfile?.role || fallback.role,
    calorieTarget: Number(rawProfile?.calorieTarget) || fallback.calorieTarget,
    waterTargetMl: Number(rawProfile?.waterTargetMl) || fallback.waterTargetMl,
    activeGoal: rawProfile?.activeGoal || fallback.activeGoal,
    planFocus: rawProfile?.planFocus || fallback.planFocus,
    planNotes: rawProfile?.planNotes || fallback.planNotes,
    name: rawProfile?.name || fallback.name,
    email: rawProfile?.email || fallback.email,
    city: rawProfile?.city || fallback.city,
    birthday: rawProfile?.birthday || fallback.birthday,
    weight: Number(rawProfile?.weight) || fallback.weight,
    height: Number(rawProfile?.height) || fallback.height,
    age: Number(rawProfile?.age) || fallback.age,
    targetWeight: Number(rawProfile?.targetWeight || rawProfile?.target_weight) || fallback.targetWeight,
    avatar: normalizeAvatarProfile(rawProfile, fallback.avatar),
  };
}

export function normalizeAvatarProfile(rawProfile = {}, fallbackAvatar = DEFAULT_PROFILE.avatar) {
  const rawAvatar = rawProfile?.avatar || {};
  return {
    url: rawAvatar.url || rawProfile?.avatarUrl || fallbackAvatar.url,
    storagePath: rawAvatar.storagePath || rawProfile?.avatarStoragePath || fallbackAvatar.storagePath,
    mimeType: rawAvatar.mimeType || rawProfile?.avatarMimeType || fallbackAvatar.mimeType,
    updatedAt: rawAvatar.updatedAt || rawProfile?.avatarUpdatedAt || fallbackAvatar.updatedAt,
  };
}

export function getProfileAvatarLabel(profile = {}) {
  return (profile?.name?.trim()?.[0] || profile?.email?.trim()?.[0] || "M").toUpperCase();
}
