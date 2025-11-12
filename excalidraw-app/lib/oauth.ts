/**
 * Generic OAuth 2.0 client with PKCE support
 * Authorization Code Flow + PKCE for secure OAuth in SPAs
 */

/**
 * Generate a random string for PKCE code_verifier
 * RFC 7636: 43-128 unreserved characters
 */
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate SHA256 hash and convert to base64url
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = String.fromCharCode(...hashArray);
  const base64 = btoa(hashString);
  // Convert to base64url (replace + with -, / with _, remove =)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export interface OAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scopes?: string[];
}

export interface OAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  idToken?: string;
  obtainedAt: number; // Timestamp when token was obtained
}

const STORAGE_KEY_TOKEN = "oauth_token";
const STORAGE_KEY_STATE = "oauth_state";
const STORAGE_KEY_CODE_VERIFIER = "oauth_code_verifier";

/**
 * OAuth 2.0 client with Authorization Code + PKCE flow
 */
export class OAuthClient {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Initiate login flow
   * Generates PKCE parameters and redirects to authorization endpoint
   */
  async initiateLogin(): Promise<void> {
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    // Store for later verification
    sessionStorage.setItem(STORAGE_KEY_CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(STORAGE_KEY_STATE, state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      ...(this.config.scopes && { scope: this.config.scopes.join(" ") }),
    });

    // Redirect to authorization endpoint
    window.location.href = `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   * Exchanges authorization code for access token
   * Should be called from the redirect_uri page
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<OAuthToken | null> {
    try {
      // Verify state parameter
      const storedState = sessionStorage.getItem(STORAGE_KEY_STATE);
      if (state !== storedState) {
        throw new Error("State mismatch - possible CSRF attack");
      }

      // Get stored code verifier
      const codeVerifier = sessionStorage.getItem(STORAGE_KEY_CODE_VERIFIER);
      if (!codeVerifier) {
        throw new Error("Code verifier not found");
      }

      // Exchange authorization code for access token
      const response = await fetch(this.config.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokenData = await response.json();

      // Parse token response
      const token: OAuthToken = {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || "Bearer",
        expiresIn: tokenData.expires_in || 3600,
        refreshToken: tokenData.refresh_token,
        idToken: tokenData.id_token,
        obtainedAt: Date.now(),
      };

      // Store token
      localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(token));

      // Clear session storage
      sessionStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);
      sessionStorage.removeItem(STORAGE_KEY_STATE);

      return token;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("OAuth callback error:", error);
      // Clear session storage on error
      sessionStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);
      sessionStorage.removeItem(STORAGE_KEY_STATE);
      return null;
    }
  }

  /**
   * Get current access token
   * Returns null if no token or token is expired
   */
  getAccessToken(): string | null {
    const tokenStr = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!tokenStr) {
      return null;
    }

    try {
      const token: OAuthToken = JSON.parse(tokenStr);

      // Check if token is expired (with 60 second buffer)
      const expirationTime = token.obtainedAt + token.expiresIn * 1000;
      if (Date.now() > expirationTime - 60000) {
        // Token expired, clear it
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        return null;
      }

      return token.accessToken;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse token:", error);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Refresh access token if refresh token is available
   */
  async refreshToken(): Promise<OAuthToken | null> {
    try {
      const tokenStr = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!tokenStr) {
        return null;
      }

      const token: OAuthToken = JSON.parse(tokenStr);
      if (!token.refreshToken) {
        return null;
      }

      const response = await fetch(this.config.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this.config.clientId,
          refresh_token: token.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const tokenData = await response.json();
      const newToken: OAuthToken = {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || "Bearer",
        expiresIn: tokenData.expires_in || 3600,
        refreshToken: tokenData.refresh_token || token.refreshToken,
        idToken: tokenData.id_token || token.idToken,
        obtainedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(newToken));
      return newToken;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Token refresh error:", error);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      return null;
    }
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEY_STATE);
  }

  /**
   * Get stored token object (for accessing id_token, etc.)
   */
  getToken(): OAuthToken | null {
    const tokenStr = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!tokenStr) {
      return null;
    }

    try {
      return JSON.parse(tokenStr);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse token:", error);
      return null;
    }
  }
}
