# Excalidraw SSO - Quick Start Guide

This is Excalidraw with Microsoft Entra ID (Azure AD) SSO authentication added. Users must sign in with a Microsoft account before accessing the app.

## Quick Setup (5 minutes)

### 1. Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**:
   - Name: `Excalidraw SSO`
   - Account type: Choose based on your needs
   - Redirect URI: **Single-page application (SPA)** - `http://localhost:5173`
3. Note the **Client ID** and **Tenant ID** from the Overview page

### 2. Configure Environment

```bash
cd excalidraw-app
cp .env.local.template .env.local
```

Edit `.env.local`:
```env
VITE_AZURE_CLIENT_ID=<your-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id-or-common>
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

### 3. Install & Run

```bash
# Install dependencies (requires Node.js 18+)
yarn install

# Start the app
yarn start
```

Open `http://localhost:5173` - you should see a login screen!

## What Was Added

- **Azure AD authentication wrapper** that protects the entire app
- **Login screen** shown to unauthenticated users
- **Automatic token management** via MSAL (Microsoft Authentication Library)
- **Session persistence** across browser sessions

## Files Added/Modified

```
excalidraw-app/
├── authConfig.ts                      # Azure AD configuration
├── components/
│   └── AuthProvider.tsx               # Authentication wrapper
├── index.tsx                          # Modified to use AuthProvider
├── package.json                       # Added MSAL dependencies
└── .env.local.template                # Environment variable template
```

## Production Deployment

1. Update redirect URI in Azure AD to your production domain
2. Update `.env.local` with production values
3. Build: `yarn build`
4. Deploy the `dist` directory

## Need Help?

See [SSO_SETUP_INSTRUCTIONS.md](./SSO_SETUP_INSTRUCTIONS.md) for detailed setup guide and troubleshooting.

## How It Works

```
┌─────────────────┐
│   User visits   │
│   Excalidraw    │
└────────┬────────┘
         │
    Not Authenticated?
         │
         ↓
┌─────────────────┐
│  Login Screen   │──→ Redirects to Microsoft
└─────────────────┘
         │
    User signs in
         │
         ↓
┌─────────────────┐
│  Excalidraw App │──→ Full access!
└─────────────────┘
```

No user data is stored - SSO is used purely as an access control mechanism.
