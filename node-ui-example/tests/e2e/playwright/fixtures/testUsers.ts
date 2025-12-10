// Simple fixture file for non-secret test users.
// In a real repo, this might be generated or fetched from a safer source.

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Default UI test user for staging/local environment.
 * NOTE:
 * - Credentials here are placeholders for a demo environment.
 * - Do not commit real passwords or production credentials.
 */
export const defaultStagingUser: TestUser = {
  email: "test.user@brikbyteos.local",
  password: "password123!",
  displayName: "Test User"
};
