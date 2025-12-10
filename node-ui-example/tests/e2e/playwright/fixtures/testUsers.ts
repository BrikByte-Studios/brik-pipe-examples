// Simple fixture file for non-secret test users.
// In a real repo, this might be generated or fetched from a safer source.

export interface TestUser {
  userName: string;
  email: string;
  password: string;
  displayName: string;
}

/**
 * Default UI test user for staging environment.
 * NOTE: Credentials here are placeholders; do not commit real passwords.
 */
export const defaultStagingUser: TestUser = {
  userName: "student"
  email: 'test.user@brikbyteos.local',
  password: 'Password123',
  displayName: 'Test User',
};