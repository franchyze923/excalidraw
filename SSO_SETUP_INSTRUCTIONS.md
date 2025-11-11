# Excalidraw with Azure AD SSO - Setup Instructions

This guide will help you set up SSO authentication for Excalidraw using Microsoft Entra ID (Azure AD).

## Overview

The SSO implementation protects the Excalidraw app by requiring users to authenticate with their Microsoft account before accessing the application. No user data is stored - it's purely used as an access control mechanism.

## Prerequisites

1. **Node.js 18+** - Required to run the application
2. **Yarn** - Package manager (or npm)
3. **Azure AD tenant** - Microsoft/Azure account with access to Azure Portal

## Step 1: Set up Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click **App registrations** in the left sidebar
4. Click **New registration**
5. Configure your app:
   - **Name**: `Excalidraw SSO` (or any name you prefer)
   - **Supported account types**:
     - Choose "Accounts in this organizational directory only" to restrict to your organization
     - OR choose "Accounts in any organizational directory" for broader access
   - **Redirect URI**:
     - Select "Single-page application (SPA)"
     - For local development: `http://localhost:5173`
     - For production: `https://your-domain.com`
   - Click **Register**

6. After registration, note down:
   - **Application (client) ID** - You'll need this
   - **Directory (tenant) ID** - You'll need this

7. Configure additional redirect URIs (optional):
   - Go to **Authentication** in the left sidebar
   - Under "Single-page application", add more redirect URIs if needed
   - Enable "Access tokens" and "ID tokens" under Implicit grant

8. Configure API permissions (already set by default):
   - Go to **API permissions**
   - Should have `User.Read` permission (Microsoft Graph)
   - This allows the app to read basic user profile

## Step 2: Configure Environment Variables

1. Navigate to the `excalidraw-app` directory:
   ```bash
   cd excalidraw-app
   ```

2. Copy the environment template:
   ```bash
   cp .env.local.template .env.local
   ```

3. Edit `.env.local` and fill in your Azure AD details:
   ```env
   VITE_AZURE_CLIENT_ID=your-application-client-id
   VITE_AZURE_TENANT_ID=your-tenant-id-or-common
   VITE_AZURE_REDIRECT_URI=http://localhost:5173
   ```

   **Notes:**
   - Use `common` for `VITE_AZURE_TENANT_ID` to allow any Microsoft account
   - Use your specific tenant ID to restrict to your organization only
   - Make sure the redirect URI matches what you configured in Azure AD

## Step 3: Install Dependencies

Install Node.js dependencies:

```bash
# If you don't have yarn, install it first
npm install -g yarn

# Install project dependencies
yarn install
```

This will install the required packages including:
- `@azure/msal-browser` - Microsoft Authentication Library for browser
- `@azure/msal-react` - React wrapper for MSAL

## Step 4: Run the Application

Start the development server:

```bash
yarn start
```

The app will be available at `http://localhost:5173`

## Step 5: Test SSO Authentication

1. Open `http://localhost:5173` in your browser
2. You should see a login screen with "Sign in with Microsoft" button
3. Click the button to be redirected to Microsoft login
4. Enter your Microsoft account credentials
5. After successful authentication, you'll be redirected back to Excalidraw
6. The app should now be accessible

## Production Deployment

### Update Environment Variables

For production, update your `.env.local` or set environment variables:

```env
VITE_AZURE_CLIENT_ID=your-application-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-production-domain.com
```

### Build the Application

```bash
yarn build
```

This creates an optimized production build in the `dist` directory.

### Deploy

Deploy the contents of the `dist` directory to your hosting service:

- **Static hosting**: Netlify, Vercel, AWS S3 + CloudFront, etc.
- **Container**: Build a Docker image (Dockerfile already exists)
- **Kubernetes**: Use the existing Kubernetes manifests

**Important**: Make sure to add your production URL as a redirect URI in Azure AD app registration.

## Docker Deployment

If you're using Docker (as suggested by your existing setup):

1. Update the Dockerfile to include the environment variables
2. Build the image:
   ```bash
   docker build -t excalidraw-sso .
   ```

3. Run with environment variables:
   ```bash
   docker run -p 80:80 \
     -e VITE_AZURE_CLIENT_ID=your-client-id \
     -e VITE_AZURE_TENANT_ID=your-tenant-id \
     -e VITE_AZURE_REDIRECT_URI=https://your-domain.com \
     excalidraw-sso
   ```

## Architecture Overview

```
User Browser
    ↓
[Login Screen] ← (not authenticated)
    ↓ (clicks "Sign in")
Microsoft Login Page
    ↓ (authenticates)
[Excalidraw App] ← (authenticated)
```

### How It Works

1. **App loads**: MSAL (Microsoft Authentication Library) initializes
2. **Auth check**: App checks if user has a valid authentication token
3. **Not authenticated**: Shows login screen with "Sign in with Microsoft" button
4. **User clicks login**: Redirects to Microsoft login page
5. **User authenticates**: Microsoft validates credentials
6. **Redirect back**: User is redirected back to your app with auth token
7. **Token stored**: Token is stored in localStorage
8. **App accessible**: User can now access Excalidraw

### Session Management

- Tokens are stored in `localStorage`
- Tokens automatically refresh when they expire
- Users stay logged in across browser sessions
- Tokens expire after 1 hour (configurable in Azure AD)

## Customization

### Change Login Screen Appearance

Edit `excalidraw-app/components/AuthProvider.tsx` to customize:
- Colors and styling
- Login button text
- Messages and branding

### Adjust Token Permissions

Edit `excalidraw-app/authConfig.ts` to modify:
- Scopes (permissions requested)
- Cache settings
- Logging level

## Troubleshooting

### "Failed to acquire token" error

**Cause**: Azure AD configuration mismatch

**Solutions**:
- Verify client ID and tenant ID are correct
- Check redirect URI matches exactly (including http vs https)
- Ensure the app is registered as a "Single-page application" in Azure AD

### "AADSTS50011: Redirect URI mismatch"

**Cause**: Redirect URI in code doesn't match Azure AD configuration

**Solutions**:
- Add the exact redirect URI to Azure AD app registration
- Check for trailing slashes or http vs https mismatches

### Login works but app doesn't load

**Cause**: Authentication succeeds but app rendering fails

**Solutions**:
- Check browser console for errors
- Verify all dependencies are installed (`yarn install`)
- Clear browser cache and localStorage

### "Localhost has been blocked" warning

**Cause**: Azure AD security policy

**Solutions**:
- This is just a warning, usually works anyway
- Add `http://localhost:5173` explicitly in Azure AD redirect URIs
- Use 127.0.0.1 instead of localhost

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (as recommended by Microsoft for SPAs)
2. **HTTPS**: Always use HTTPS in production
3. **Tenant Restriction**: Use specific tenant ID instead of "common" to restrict access
4. **No Backend**: This is purely frontend authentication - consider adding backend validation for sensitive operations

## Additional Resources

- [Microsoft Authentication Library (MSAL) Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL.js React Tutorial](https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)

## Support

If you encounter issues:
1. Check Azure AD app registration configuration
2. Verify environment variables are set correctly
3. Check browser console for error messages
4. Review MSAL.js documentation

## Files Modified

The following files were created/modified to add SSO:

- `excalidraw-app/authConfig.ts` - Azure AD configuration
- `excalidraw-app/components/AuthProvider.tsx` - Authentication wrapper component
- `excalidraw-app/index.tsx` - Updated to use AuthProvider
- `excalidraw-app/package.json` - Added MSAL dependencies
- `excalidraw-app/.env.local.template` - Environment variable template
