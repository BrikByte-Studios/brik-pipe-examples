// Centralised route helpers to avoid scattering hard-coded paths.
//
// This allows us to change paths in one place and keeps tests readable.

export const routes = {
  login: "/login",
  dashboard: "/dashboard"
} as const;
