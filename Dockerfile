FROM node:18 AS build

WORKDIR /opt/node_app

COPY . .

# do not ignore optional dependencies:
# Error: Cannot find module @rollup/rollup-linux-x64-gnu
RUN yarn --network-timeout 600000

# Build arguments for Azure AD configuration (optional, can be set at runtime)
ARG VITE_AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
ARG VITE_AZURE_TENANT_ID=common
ARG VITE_AZURE_REDIRECT_URI=http://localhost

ENV VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
ENV VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
ENV VITE_AZURE_REDIRECT_URI=${VITE_AZURE_REDIRECT_URI}

ARG NODE_ENV=production

RUN yarn build:app:docker

FROM nginx:1.27-alpine

# Install bash for the entrypoint script
RUN apk add --no-cache bash

COPY --from=build /opt/node_app/excalidraw-app/build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for runtime environment variable injection
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK CMD wget -q -O /dev/null http://localhost || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
