import { stackClientApp } from "./stack";

// Cache for auth header to prevent excessive API calls
let authHeaderCache: { value: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const auth = {
  getAuthHeaderValue: async (): Promise<string> => {
    // Check cache first
    if (authHeaderCache && (Date.now() - authHeaderCache.timestamp) < CACHE_DURATION) {
      return authHeaderCache.value;
    }

    const user = await stackClientApp.getUser();

    if (!user) {
      authHeaderCache = { value: "", timestamp: Date.now() };
      return "";
    }

    try {
      const authJson = await user.getAuthJson();
      const { accessToken } = authJson;
      const headerValue = `Bearer ${accessToken}`;

      // Cache the result
      authHeaderCache = { value: headerValue, timestamp: Date.now() };
      return headerValue;
    } catch (error) {
      authHeaderCache = { value: "", timestamp: Date.now() };
      return "";
    }
  },
  getAuthToken: async (): Promise<string> => {
    const user = await stackClientApp.getUser();

    if (!user) {
      return "";
    }

    const { accessToken } = await user.getAuthJson();
    return accessToken ?? "";
  }
}
