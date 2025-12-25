import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691603b4bc551518bad307de",
  requiresAuth: false // Authentication disabled for local development
});
