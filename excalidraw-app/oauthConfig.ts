import type { OAuthConfig } from "./lib/oauth";

/**
 * OAuth configuration for custom company SSO
 *
 * Configure these environment variables in .env.local:
 * - VITE_OAUTH_CLIENT_ID: Your OAuth client ID
 * - VITE_OAUTH_AUTHORIZATION_ENDPOINT: Authorization server URL
 * - VITE_OAUTH_TOKEN_ENDPOINT: Token exchange URL
 * - VITE_OAUTH_REDIRECT_URI: Where users return after login
 * - VITE_OAUTH_SCOPES: Comma-separated list of scopes (optional)
 */

export const oauthConfig: OAuthConfig = {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || "",
  authorizationEndpoint:
    import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT || "",
  tokenEndpoint: import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT || "",
  redirectUri:
    import.meta.env.VITE_OAUTH_REDIRECT_URI || window.location.origin,
  scopes: import.meta.env.VITE_OAUTH_SCOPES
    ? import.meta.env.VITE_OAUTH_SCOPES.split(",").map((s: string) => s.trim())
    : ["openid", "profile", "email"],
};

// Debug logging
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("OAuth Config:", {
    clientId: oauthConfig.clientId ? "***set***" : "NOT SET",
    authorizationEndpoint: oauthConfig.authorizationEndpoint || "NOT SET",
    tokenEndpoint: oauthConfig.tokenEndpoint || "NOT SET",
    redirectUri: oauthConfig.redirectUri || "NOT SET",
  });
}
