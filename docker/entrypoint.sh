#!/bin/bash
set -e

# This script allows runtime configuration of OAuth settings and Collaboration Server URL
# Environment variables can be passed at container runtime to override build-time values

echo "Excalidraw - Starting container..."

# Track if any configuration was injected
CONFIG_INJECTED=false

# Handle OAuth SSO configuration (generic OAuth 2.0)
if [ -n "$VITE_OAUTH_CLIENT_ID" ] || [ -n "$VITE_OAUTH_AUTHORIZATION_ENDPOINT" ] || [ -n "$VITE_OAUTH_TOKEN_ENDPOINT" ] || [ -n "$VITE_OAUTH_REDIRECT_URI" ]; then
    echo "Runtime OAuth configuration detected. Injecting configuration..."
    echo "  Client ID: ${VITE_OAUTH_CLIENT_ID}"
    echo "  Auth Endpoint: ${VITE_OAUTH_AUTHORIZATION_ENDPOINT}"
    echo "  Token Endpoint: ${VITE_OAUTH_TOKEN_ENDPOINT}"
    echo "  Redirect URI: ${VITE_OAUTH_REDIRECT_URI}"

    # Create a config script that will be injected into the HTML
    cat > /usr/share/nginx/html/oauth-config.js << 'OAUTH_CONFIG_EOF'
window.__OAUTH_CONFIG__ = {
  clientId: "OAUTH_CLIENT_ID_PLACEHOLDER",
  authorizationEndpoint: "OAUTH_AUTH_ENDPOINT_PLACEHOLDER",
  tokenEndpoint: "OAUTH_TOKEN_ENDPOINT_PLACEHOLDER",
  redirectUri: "OAUTH_REDIRECT_URI_PLACEHOLDER",
  scopes: "OAUTH_SCOPES_PLACEHOLDER"
};
OAUTH_CONFIG_EOF

    # Replace placeholders with actual values
    # Escape special characters in values for sed
    CLIENT_ID_ESCAPED=$(echo "${VITE_OAUTH_CLIENT_ID}" | sed 's/[&/\]/\\&/g')
    AUTH_ENDPOINT_ESCAPED=$(echo "${VITE_OAUTH_AUTHORIZATION_ENDPOINT}" | sed 's/[&/\]/\\&/g')
    TOKEN_ENDPOINT_ESCAPED=$(echo "${VITE_OAUTH_TOKEN_ENDPOINT}" | sed 's/[&/\]/\\&/g')
    REDIRECT_URI_ESCAPED=$(echo "${VITE_OAUTH_REDIRECT_URI}" | sed 's/[&/\]/\\&/g')
    SCOPES_ESCAPED=$(echo "${VITE_OAUTH_SCOPES:-openid,profile,email}" | sed 's/[&/\]/\\&/g')

    sed -i \
        -e "s|OAUTH_CLIENT_ID_PLACEHOLDER|${CLIENT_ID_ESCAPED}|g" \
        -e "s|OAUTH_AUTH_ENDPOINT_PLACEHOLDER|${AUTH_ENDPOINT_ESCAPED}|g" \
        -e "s|OAUTH_TOKEN_ENDPOINT_PLACEHOLDER|${TOKEN_ENDPOINT_ESCAPED}|g" \
        -e "s|OAUTH_REDIRECT_URI_PLACEHOLDER|${REDIRECT_URI_ESCAPED}|g" \
        -e "s|OAUTH_SCOPES_PLACEHOLDER|${SCOPES_ESCAPED}|g" \
        /usr/share/nginx/html/oauth-config.js

    # Debug: show the generated oauth-config.js
    echo "Generated oauth-config.js content:"
    cat /usr/share/nginx/html/oauth-config.js
    echo ""

    # Inject the config script into the main index.html (before closing head or at start of body)
    if grep -q "</head>" /usr/share/nginx/html/index.html; then
        sed -i "/<\/head>/i\\  <script src=\"/oauth-config.js\"><\/script>" /usr/share/nginx/html/index.html
    else
        sed -i "/<body/a\\  <script src=\"/oauth-config.js\"><\/script>" /usr/share/nginx/html/index.html
    fi

    echo "OAuth configuration injected successfully."
    CONFIG_INJECTED=true
else
    echo "Using build-time OAuth configuration (no runtime environment variables provided)."
    echo "  VITE_OAUTH_CLIENT_ID: [${VITE_OAUTH_CLIENT_ID}]"
    echo "  VITE_OAUTH_AUTHORIZATION_ENDPOINT: [${VITE_OAUTH_AUTHORIZATION_ENDPOINT}]"
    echo "  VITE_OAUTH_TOKEN_ENDPOINT: [${VITE_OAUTH_TOKEN_ENDPOINT}]"
    echo "  VITE_OAUTH_REDIRECT_URI: [${VITE_OAUTH_REDIRECT_URI}]"
fi

# Handle Azure AD SSO configuration (legacy)
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
echo "OAuth Configuration:"
echo "  Client ID: ${VITE_OAUTH_CLIENT_ID:-[not set]}"
echo "  Authorization Endpoint: ${VITE_OAUTH_AUTHORIZATION_ENDPOINT:-[not set]}"
echo "  Token Endpoint: ${VITE_OAUTH_TOKEN_ENDPOINT:-[not set]}"
echo "  Redirect URI: ${VITE_OAUTH_REDIRECT_URI:-[not set]}"
echo "  Scopes: ${VITE_OAUTH_SCOPES:-[default: openid,profile,email]}"
echo ""
echo "Azure AD Configuration (Legacy):"
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
