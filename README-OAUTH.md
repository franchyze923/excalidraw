# Custom OAuth 2.0 Implementation with PKCE

This guide explains how to set up custom OAuth 2.0 authentication with PKCE (Proof Key for Code Exchange) for your company's SSO.

## Overview

The implementation uses the **Authorization Code Flow with PKCE**, which is the recommended OAuth flow for Single-Page Applications (SPAs) as per OAuth 2.0 Security Best Current Practices.

### Why PKCE?

PKCE was designed specifically to secure OAuth flows in applications where you cannot safely store a client secret (like browsers). It prevents authorization code interception attacks without requiring a client secret.

## Architecture

### Files

- **`excalidraw-app/lib/oauth.ts`** - Core OAuth client with PKCE implementation
- **`excalidraw-app/oauthConfig.ts`** - OAuth configuration from environment variables
- **`excalidraw-app/components/OAuthAuthProvider.tsx`** - React component for authentication
- **`excalidraw-app/.env.local.oauth.template`** - Environment variables template

### Flow Diagram

```
1. User clicks "Sign in with Company SSO"
   ↓
2. Frontend generates PKCE parameters (code_verifier, code_challenge)
   ↓
3. Frontend redirects to authorization endpoint with code_challenge
   ↓
4. User authenticates with OAuth provider (enters credentials)
   ↓
5. OAuth provider redirects back with authorization code
   ↓
6. Frontend exchanges code + code_verifier for access token
   (PKCE proves the code wasn't intercepted)
   ↓
7. Frontend stores access token securely
   ↓
8. User is logged in
```

## Setup Instructions

### 1. Get OAuth Credentials from Your Company

Contact your OAuth provider (IT/Security team) and request:

- **Client ID**: Your application's unique identifier
- **Authorization Endpoint**: URL where users authenticate (e.g., `https://auth.company.com/oauth/authorize`)
- **Token Endpoint**: URL to exchange code for token (e.g., `https://auth.company.com/oauth/token`)
- **Scopes**: Available permissions (e.g., `openid profile email`)
- **Redirect URI**: Where to send users after login (e.g., `http://localhost:5173` for dev, `https://excalidraw.company.com` for prod)

**Important**: When registering your Redirect URI, it must match exactly (including protocol and port).

### 2. Configure Environment Variables

Copy the template file:

```bash
cp excalidraw-app/.env.local.oauth.template excalidraw-app/.env.local
```

Fill in your OAuth provider's details:

```env
VITE_OAUTH_CLIENT_ID=your-client-id-from-provider
VITE_OAUTH_AUTHORIZATION_ENDPOINT=https://auth.company.com/oauth/authorize
VITE_OAUTH_TOKEN_ENDPOINT=https://auth.company.com/oauth/token
VITE_OAUTH_REDIRECT_URI=http://localhost:5173
VITE_OAUTH_SCOPES=openid,profile,email
```

### 3. Update App Entry Point

In `excalidraw-app/index.tsx`, replace the MSAL provider with the OAuth provider:

```tsx
import { OAuthAuthProvider } from "./components/OAuthAuthProvider";

// Replace:
// import { AuthProvider } from "./components/AuthProvider";
// <AuthProvider msalInstance={msalInstance}>

// With:
<OAuthAuthProvider>
  <App />
</OAuthAuthProvider>
```

### 4. Update Menu Logout (if needed)

Update `excalidraw-app/components/AppMainMenu.tsx` to use the new auth hook:

```tsx
import { useAuth } from "./OAuthAuthProvider";

// In your component:
const { logout } = useAuth();

// In your menu:
<button onClick={() => logout()}>Logout</button>
```

## Implementation Details

### OAuth Client (`lib/oauth.ts`)

The `OAuthClient` class handles:

- **PKCE Generation**: Creates random `code_verifier` and SHA256 hash as `code_challenge`
- **Authorization**: Redirects user to OAuth provider with PKCE parameters
- **Callback Handling**: Exchanges authorization code for access token
- **Token Management**: Stores, retrieves, and validates tokens
- **Token Expiration**: Checks if token expired before using
- **Token Refresh**: Implements refresh token flow if available
- **Logout**: Clears all stored tokens

### Key Methods

```typescript
// Start login flow
await oauthClient.initiateLogin();

// Handle OAuth callback (on redirect_uri page)
await oauthClient.handleCallback(code, state);

// Get current access token (null if expired)
const token = oauthClient.getAccessToken();

// Check if authenticated
oauthClient.isAuthenticated();

// Refresh token
await oauthClient.refreshToken();

// Logout
oauthClient.logout();
```

### Token Storage

- **Access Token**: Stored in `localStorage` (persists across sessions)
- **Code Verifier/State**: Stored in `sessionStorage` (cleared after use)
- **Token Expiration**: Checked before use; cleared if expired

## PKCE Security Details

### What Happens

1. **Code Verifier Generation**
   - 128 random characters from unreserved characters (A-Z, a-z, 0-9, `-`, `.`, `_`, `~`)
   - Enough entropy to prevent guessing

2. **Code Challenge Creation**
   - SHA256 hash of code_verifier
   - Base64URL encoded
   - Sent to authorization server

3. **Authorization Code Exchange**
   - Code verifier sent in token request
   - Server verifies: `code_challenge == SHA256(code_verifier)`
   - Proves the same client made both requests

### Protection Against

- **Authorization Code Interception**: Even if code is stolen, without the verifier, it's useless
- **Cross-Site Request Forgery**: State parameter prevents CSRF attacks
- **Credential Exposure**: Access token never in URL, only in secure token response

## Token Usage in API Requests

To use the access token when making API requests:

```typescript
import { useAuth } from "./components/OAuthAuthProvider";

function MyComponent() {
  const { accessToken } = useAuth();

  const fetchData = async () => {
    const response = await fetch("/api/data", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Handling Client Secrets

If your OAuth provider **requires a client secret** for token exchange, you have two options:

### Option 1: Backend Proxy (Recommended)

Create a backend endpoint that handles token exchange:

```typescript
// Backend endpoint: POST /api/oauth/token
app.post("/api/oauth/token", async (req, res) => {
  const { code, codeVerifier } = req.body;

  const tokenResponse = await fetch("https://auth.company.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET, // Never in frontend!
      code,
      code_verifier: codeVerifier,
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
    }).toString(),
  });

  const token = await tokenResponse.json();
  res.json(token);
});
```

Update `lib/oauth.ts` `handleCallback()` to call your backend:

```typescript
const response = await fetch("/api/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code, codeVerifier }),
});
```

### Option 2: Public Client (No Secret)

If your OAuth provider supports public clients (PKCE without secret), use the current implementation as-is.

## Testing

### Local Development

1. Start the app:
   ```bash
   cd excalidraw-app
   yarn install
   yarn dev
   ```

2. Navigate to `http://localhost:5173`

3. Click "Sign in with Company SSO"

4. You'll be redirected to your OAuth provider

5. After authentication, you'll be redirected back to the app

6. Check browser console for any errors

### Debugging

Enable debug logging in `lib/oauth.ts`:

```typescript
// Add to handleCallback():
console.log("Authorization code received:", code);
console.log("State parameter:", state);
console.log("Code verifier length:", codeVerifier.length);
```

### Common Issues

**"State mismatch" error**
- OAuth provider returned different state than sent
- Check if cookies/sessionStorage is disabled in browser

**"Code verifier not found" error**
- Browser cleared sessionStorage before callback
- Check if redirect_uri exactly matches registered URI

**CORS errors**
- Token endpoint must allow cross-origin requests from your app domain
- Or implement backend proxy (see above)

**Infinite redirect loop**
- Token not being stored in localStorage
- Check browser storage permissions
- Verify token endpoint response format

## Migration from Microsoft Entra

If migrating from MSAL:

1. Keep the existing `AuthProvider.tsx` for reference
2. Update `index.tsx` to use `OAuthAuthProvider` instead of MSAL provider
3. Remove `@azure/msal-browser` and `@azure/msal-react` from `package.json`
4. Update any components using `useMsal()` to use `useAuth()` instead
5. Test all authentication flows

## Production Checklist

- [ ] Redirect URI registered with OAuth provider
- [ ] Client ID configured in environment
- [ ] SSL/HTTPS enabled for all OAuth endpoints
- [ ] Token endpoint accessible from production domain
- [ ] Verify PKCE parameters included in requests (Network tab)
- [ ] Test with actual OAuth provider in staging
- [ ] Implement backend proxy if client secret required
- [ ] Monitor token expiration and refresh logic
- [ ] Logout flow clears all tokens
- [ ] Error handling for failed authentication

## Troubleshooting

### OAuth provider doesn't support PKCE

If your OAuth provider doesn't support PKCE, you must implement a backend proxy (see "Handling Client Secrets" section). Do NOT remove PKCE from frontend code - always send it for security.

### Authorization code expires

OAuth codes typically expire in 10 minutes. The implementation handles callback immediately, so this shouldn't be an issue. If it is, check network latency.

### Refresh token not working

Your OAuth provider may not issue refresh tokens by default. Add `offline_access` scope if available:

```env
VITE_OAUTH_SCOPES=openid,profile,email,offline_access
```

### Multiple login attempts required

Check if state parameter is being preserved across redirects. Some proxies or CDNs might strip query parameters.

## Additional Resources

- [OAuth 2.0 Security Best Current Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OAuth 2.0 PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- [OWASP OAuth 2.0 Security](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_Cheat_Sheet.html)

## Support

For issues with:

- **OAuth Client Implementation**: Check `lib/oauth.ts` comments and types
- **Configuration**: Verify all environment variables in `.env.local`
- **OAuth Provider**: Contact your company's IT/Security team
- **Excalidraw Integration**: Check `OAuthAuthProvider.tsx` and `AppMainMenu.tsx`
