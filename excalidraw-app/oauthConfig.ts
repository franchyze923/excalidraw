import type { OAuthConfig } from "./lib/oauth";

/**
 * OAuth configuration for custom company SSO
 *
 * Configuration is loaded from:
 * 1. window.__OAUTH_CONFIG__ (injected at runtime by Docker/Kubernetes entrypoint)
 * 2. import.meta.env (build-time environment variables)
 * 3. Defaults (fallback values)
 *
 * Configure these environment variables:
 * - VITE_OAUTH_CLIENT_ID: Your OAuth client ID
 * - VITE_OAUTH_AUTHORIZATION_ENDPOINT: Authorization server URL
 * - VITE_OAUTH_TOKEN_ENDPOINT: Token exchange URL
 * - VITE_OAUTH_REDIRECT_URI: Where users return after login
 * - VITE_OAUTH_SCOPES: Comma-separated list of scopes (optional)
 */

// Get OAuth config from window (injected at runtime) or fall back to env vars
const windowConfig = typeof window !== "undefined" ? (window as any).__OAUTH_CONFIG__ : null;

const defaultScopes: string[] = ["openid", "profile", "email"];

// Helper to get scopes from config or env
const getScopes = (): string[] => {
  if (windowConfig?.scopes && windowConfig.scopes.length > 0) {
    return windowConfig.scopes.split(",").map((s: string) => s.trim());
  }
  if (
    import.meta.env.VITE_OAUTH_SCOPES &&
    import.meta.env.VITE_OAUTH_SCOPES.length > 0
  ) {
    return import.meta.env.VITE_OAUTH_SCOPES.split(",").map((s: string) =>
      s.trim()
    );
  }
  return defaultScopes;
};

export const oauthConfig: OAuthConfig = {
  clientId:
    windowConfig?.clientId ||
    import.meta.env.VITE_OAUTH_CLIENT_ID ||
    "",
  authorizationEndpoint:
    windowConfig?.authorizationEndpoint ||
    import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT ||
    "",
  tokenEndpoint:
    windowConfig?.tokenEndpoint ||
    import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT ||
    "",
  redirectUri:
    windowConfig?.redirectUri ||
    import.meta.env.VITE_OAUTH_REDIRECT_URI ||
    window.location.origin,
  scopes: getScopes(),
};

// Debug logging
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("OAuth Config (from window.__OAUTH_CONFIG__):", {
    clientId: oauthConfig.clientId ? "***set***" : "NOT SET",
    authorizationEndpoint: oauthConfig.authorizationEndpoint || "NOT SET",
    tokenEndpoint: oauthConfig.tokenEndpoint || "NOT SET",
    redirectUri: oauthConfig.redirectUri || "NOT SET",
    scopes: oauthConfig.scopes.join(", "),
  });
}
