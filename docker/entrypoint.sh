#!/bin/bash
set -e

# This script allows runtime configuration of Azure AD settings
# Environment variables can be passed at container runtime to override build-time values

echo "Excalidraw SSO - Starting container..."

# If runtime environment variables are provided, inject them into the built JavaScript
# This searches for the placeholder values and replaces them with runtime values
if [ -n "$VITE_AZURE_CLIENT_ID" ] || [ -n "$VITE_AZURE_TENANT_ID" ] || [ -n "$VITE_AZURE_REDIRECT_URI" ]; then
    echo "Runtime environment variables detected. Injecting configuration..."

    # Find all JavaScript files in the build directory
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i \
        -e "s|VITE_AZURE_CLIENT_ID:\s*\"[^\"]*\"|VITE_AZURE_CLIENT_ID:\"${VITE_AZURE_CLIENT_ID}\"|g" \
        -e "s|VITE_AZURE_TENANT_ID:\s*\"[^\"]*\"|VITE_AZURE_TENANT_ID:\"${VITE_AZURE_TENANT_ID}\"|g" \
        -e "s|VITE_AZURE_REDIRECT_URI:\s*\"[^\"]*\"|VITE_AZURE_REDIRECT_URI:\"${VITE_AZURE_REDIRECT_URI}\"|g" \
        {} \;

    echo "Configuration injected successfully."
else
    echo "Using build-time configuration (no runtime environment variables provided)."
fi

# Display configuration (without sensitive data)
echo "Azure AD Configuration:"
echo "  Client ID: ${VITE_AZURE_CLIENT_ID:-[not set]}"
echo "  Tenant ID: ${VITE_AZURE_TENANT_ID:-[not set]}"
echo "  Redirect URI: ${VITE_AZURE_REDIRECT_URI:-[not set]}"
echo ""
echo "Local Login Credentials:"
echo "  Username: admin"
echo "  Password: password"
echo ""
echo "Starting nginx..."

# Execute the main container command (nginx)
exec "$@"
