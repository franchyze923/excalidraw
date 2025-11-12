FROM node:22 AS build

WORKDIR /opt/node_app

COPY . .

# do not ignore optional dependencies:
# Error: Cannot find module @rollup/rollup-linux-x64-gnu
RUN yarn --network-timeout 600000


# Build arguments for OAuth 2.0 configuration
ARG VITE_OAUTH_CLIENT_ID=
ARG VITE_OAUTH_AUTHORIZATION_ENDPOINT=
ARG VITE_OAUTH_TOKEN_ENDPOINT=
ARG VITE_OAUTH_REDIRECT_URI=http://localhost/auth/callback
ARG VITE_OAUTH_SCOPES=openid,profile,email

# Build arguments for Azure AD configuration (legacy, deprecated)
ARG VITE_AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
ARG VITE_AZURE_TENANT_ID=common
ARG VITE_AZURE_REDIRECT_URI=http://localhost

ENV VITE_OAUTH_CLIENT_ID=${VITE_OAUTH_CLIENT_ID}
ENV VITE_OAUTH_AUTHORIZATION_ENDPOINT=${VITE_OAUTH_AUTHORIZATION_ENDPOINT}
ENV VITE_OAUTH_TOKEN_ENDPOINT=${VITE_OAUTH_TOKEN_ENDPOINT}
ENV VITE_OAUTH_REDIRECT_URI=${VITE_OAUTH_REDIRECT_URI}
ENV VITE_OAUTH_SCOPES=${VITE_OAUTH_SCOPES}
ENV VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
ENV VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
ENV VITE_AZURE_REDIRECT_URI=${VITE_AZURE_REDIRECT_URI}
ARG NODE_ENV=production

RUN yarn build:app:docker

FROM nginx:1.29-alpine

# Install bash for the entrypoint script
RUN apk add --no-cache bash

ENV APP_WS_OLD_SERVER_URL="https://oss-collab.excalidraw.com"
ENV APP_WS_NEW_SERVER_URL="http://localhost:3002"

COPY --from=build /opt/node_app/excalidraw-app/build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for runtime environment variable injection
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY nginx-init-scripts/hack_it.sh /docker-entrypoint.d/99_hack_it.sh
RUN chmod +x /docker-entrypoint.d/99_hack_it.sh

HEALTHCHECK CMD wget -q -O /dev/null http://localhost || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]