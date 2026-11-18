export const DEFAULT_SETTINGS = {
  visibleProfile: true,
  withdrawalActivity: true,
  weeklyReport: false,
  passwordChange: true,
  dataUsageAlert: false,
  notifyComments: true,
  notifyPostActivity: true,
  notifyEmail: true,
  notifyDesktop: false,
  deactivated: false,
};

const LOCKED_SETTINGS = new Set(["deactivated"]);

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

export function readSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return SETTING_KEYS.reduce((settings, key) => {
    settings[key] = typeof source[key] === "boolean" ? source[key] : DEFAULT_SETTINGS[key];
    return settings;
  }, {});
}

export function publicAuthorName(user, hiddenLabel = "GrowWise member") {
  if (!user) return "GrowWise";
  if (!readSettings(user.settings).visibleProfile) return hiddenLabel;
  return user.name?.trim() || "GrowWise";
}

export function applySettingsPatch(current, body) {
  const next = { ...current };
  for (const key of Object.keys(current)) {
    if (LOCKED_SETTINGS.has(key) || !(key in body)) continue;
    if (typeof body[key] !== "boolean") return { error: "Invalid settings." };
    next[key] = body[key];
  }
  return { settings: next };
}