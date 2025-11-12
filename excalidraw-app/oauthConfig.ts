import type { OAuthConfig } from "./lib/oauth";

/**
 * OAuth configuration for custom company SSO
 *
 * Configuration is loaded from build-time environment variables provided
 * to Docker as build arguments. Pass these when building the image:
 *
 *   docker build \
 *     --build-arg VITE_OAUTH_CLIENT_ID="your-client-id" \
 *     --build-arg VITE_OAUTH_AUTHORIZATION_ENDPOINT="https://..." \
 *     --build-arg VITE_OAUTH_TOKEN_ENDPOINT="https://..." \
 *     --build-arg VITE_OAUTH_REDIRECT_URI="https://..." \
 *     -t excalidraw:latest .
 */

const defaultScopes = ["openid", "profile", "email"];

export const oauthConfig: OAuthConfig = {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || "",
  authorizationEndpoint:
    import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT || "",
  tokenEndpoint: import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT || "",
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || "",
  scopes: (import.meta.env.VITE_OAUTH_SCOPES || defaultScopes.join(","))
    .split(",")
    .map((s: string) => s.trim()) as string[],
};
