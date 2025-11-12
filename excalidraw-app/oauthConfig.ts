import type { OAuthConfig } from "./lib/oauth";

/**
 * OAuth configuration for custom company SSO
 *
 * Configuration is loaded from build-time environment variables:
 * - VITE_OAUTH_CLIENT_ID: Your OAuth client ID
 * - VITE_OAUTH_AUTHORIZATION_ENDPOINT: Authorization server URL
 * - VITE_OAUTH_TOKEN_ENDPOINT: Token exchange URL
 * - VITE_OAUTH_REDIRECT_URI: Where users return after login
 * - VITE_OAUTH_SCOPES: Comma-separated list of scopes (optional)
 *
 * Pass these as Docker build args when building the image:
 *   docker build \
 *     --build-arg VITE_OAUTH_CLIENT_ID="your-client-id" \
 *     --build-arg VITE_OAUTH_AUTHORIZATION_ENDPOINT="https://..." \
 *     --build-arg VITE_OAUTH_TOKEN_ENDPOINT="https://..." \
 *     --build-arg VITE_OAUTH_REDIRECT_URI="https://..." \
 *     -t excalidraw:latest .
 */

const defaultScopes = ["openid", "profile", "email"];

const getScopeString = (): string => {
  return import.meta.env.VITE_OAUTH_SCOPES || defaultScopes.join(",");
};

export const oauthConfig: OAuthConfig = {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || "",
  authorizationEndpoint:
    import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT || "",
  tokenEndpoint: import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT || "",
  redirectUri:
    import.meta.env.VITE_OAUTH_REDIRECT_URI ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  scopes: getScopeString()
    .split(",")
    .map((s: string) => s.trim()) as string[],
};

// Debug logging
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("OAuth Config:", {
    clientId: oauthConfig.clientId || "NOT SET",
    authorizationEndpoint: oauthConfig.authorizationEndpoint || "NOT SET",
    tokenEndpoint: oauthConfig.tokenEndpoint || "NOT SET",
    redirectUri: oauthConfig.redirectUri || "NOT SET",
    scopes: oauthConfig.scopes ? oauthConfig.scopes.join(", ") : "NOT SET",
  });
}
