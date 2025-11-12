#!/bin/bash
set -e

# This script allows runtime configuration of Azure AD settings and Collaboration Server URL
# Environment variables can be passed at container runtime to override build-time values

echo "Excalidraw - Starting container..."

# Track if any configuration was injected
CONFIG_INJECTED=false

# Handle Azure AD SSO configuration
if [ -n "$VITE_AZURE_CLIENT_ID" ] || [ -n "$VITE_AZURE_TENANT_ID" ] || [ -n "$VITE_AZURE_REDIRECT_URI" ]; then
    echo "Runtime Azure AD configuration detected. Injecting configuration..."

    # Find all JavaScript files in the build directory
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i \
        -e "s|VITE_AZURE_CLIENT_ID:\s*\"[^\"]*\"|VITE_AZURE_CLIENT_ID:\"${VITE_AZURE_CLIENT_ID}\"|g" \
        -e "s|VITE_AZURE_TENANT_ID:\s*\"[^\"]*\"|VITE_AZURE_TENANT_ID:\"${VITE_AZURE_TENANT_ID}\"|g" \
        -e "s|VITE_AZURE_REDIRECT_URI:\s*\"[^\"]*\"|VITE_AZURE_REDIRECT_URI:\"${VITE_AZURE_REDIRECT_URI}\"|g" \
        {} \;

    echo "Azure AD configuration injected successfully."
    CONFIG_INJECTED=true
else
    echo "Using build-time Azure AD configuration (no runtime environment variables provided)."
fi

# Handle Collaboration Server URL customization
if [ -n "$APP_WS_OLD_SERVER_URL" ] && [ -n "$APP_WS_NEW_SERVER_URL" ]; then
    echo "Runtime collaboration server configuration detected. Replacing $APP_WS_OLD_SERVER_URL with $APP_WS_NEW_SERVER_URL"

    # Find all JavaScript files containing the old server URL and replace it
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i \
        "s|${APP_WS_OLD_SERVER_URL}|${APP_WS_NEW_SERVER_URL}|g" {} \;

    echo "Collaboration server URL replaced successfully."
    CONFIG_INJECTED=true
else
    echo "Using build-time collaboration server configuration (no runtime environment variables provided)."
fi

# Display configuration (without sensitive data)
echo ""
echo "=== Excalidraw Configuration ==="
echo "Azure AD Configuration:"
echo "  Client ID: ${VITE_AZURE_CLIENT_ID:-[not set]}"
echo "  Tenant ID: ${VITE_AZURE_TENANT_ID:-[not set]}"
echo "  Redirect URI: ${VITE_AZURE_REDIRECT_URI:-[not set]}"
echo ""
echo "Collaboration Server:"
echo "  Old URL: ${APP_WS_OLD_SERVER_URL:-[default: https://oss-collab.excalidraw.com]}"
echo "  New URL: ${APP_WS_NEW_SERVER_URL:-[not customized]}"
echo ""
echo "Local Login Credentials:"
echo "  Username: admin"
echo "  Password: password"
echo "===================================="
echo ""
echo "Starting nginx..."

# Execute the main container command (nginx)
exec "$@"
