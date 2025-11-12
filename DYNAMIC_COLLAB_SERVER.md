# Dynamic Collaboration Server Branch

Welcome to the `dynamic-collab-server` branch of Excalidraw!

This branch combines the main Excalidraw application with Docker containerization capabilities and a unique feature: the ability to dynamically customize the collaboration server URL at runtime.

## What's Different About This Branch?

This branch builds upon the main Excalidraw repository with:

1. **Docker Integration** - Complete Docker setup for containerized deployment
2. **Dynamic Collab Server URL** - Point to your own collaboration server without rebuilding
3. **Azure AD SSO Support** - Optional Single Sign-On authentication
4. **Runtime Configuration** - Configure the app at container startup without code changes

## Key Features

### 1. Docker Support

- **Multi-stage Dockerfile** optimized for minimal image size (~50MB)
- **Nginx configuration** for serving static assets efficiently
- **Docker Compose** setup for easy local development
- **Health checks** included

### 2. Dynamic Collaboration Server

Replace the default OSS Excalidraw collaboration server with your own:

```bash
docker run -d \
  -e APP_WS_OLD_SERVER_URL=https://oss-collab.excalidraw.com \
  -e APP_WS_NEW_SERVER_URL=http://my-collab-server:3002 \
  excalidraw:latest
```

This is perfect for:
- Self-hosted deployments
- Private collaboration infrastructure
- Custom collaboration server implementations
- Air-gapped environments

### 3. Azure AD SSO

Optional authentication via Azure AD:

```bash
docker run -d \
  -e VITE_AZURE_CLIENT_ID=your-client-id \
  -e VITE_AZURE_TENANT_ID=your-tenant-id \
  -e VITE_AZURE_REDIRECT_URI=https://your-domain.com \
  excalidraw:latest
```

Local fallback credentials always available:
- Username: `admin`
- Password: `password`

## Quick Start

### Development

```bash
# Clone and install
git clone https://github.com/franchyze923/excalidraw.git
cd excalidraw
git checkout dynamic-collab-server
yarn install

# Development server
yarn start

# Build for Docker
yarn build:app:docker

# Build Docker image
docker build -t excalidraw:latest .

# Run with custom collab server
docker run -d \
  -p 80:80 \
  -e APP_WS_OLD_SERVER_URL=https://oss-collab.excalidraw.com \
  -e APP_WS_NEW_SERVER_URL=http://localhost:3002 \
  excalidraw:latest
```

### Docker Compose

```bash
# Copy environment template
cp .env.docker.example .env

# Edit .env with your configuration
vim .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Architecture

### Files Added/Modified for Docker Support

```
excalidraw/
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose configuration
├── docker/
│   ├── entrypoint.sh              # Runtime configuration injection
│   └── nginx.conf                 # Nginx static file serving
├── nginx-init-scripts/
│   └── hack_it.sh                 # Collab server URL replacement
├── DOCKER_DEPLOYMENT.md           # Comprehensive Docker guide
└── DYNAMIC_COLLAB_SERVER.md       # This file
```

### How Runtime Configuration Works

1. **Build Stage**
   - Node.js builds the React application
   - Collab server URL is hardcoded in the built JS files
   - Azure AD config is embedded with default values

2. **Runtime Stage**
   - Nginx serves the static files
   - `entrypoint.sh` runs on container startup
   - Environment variables are injected:
     - Collab server URL replacement via `sed`
     - Azure AD config replacement via `sed`
   - Nginx starts and serves the configured application

## Configuration

### Environment Variables

**Collaboration Server:**
- `APP_WS_OLD_SERVER_URL` - Original URL to find (default: `https://oss-collab.excalidraw.com`)
- `APP_WS_NEW_SERVER_URL` - URL to replace with (default: `http://localhost:3002`)

**Azure AD SSO:**
- `VITE_AZURE_CLIENT_ID` - Your Azure AD Client ID
- `VITE_AZURE_TENANT_ID` - Your Azure AD Tenant ID or "common"
- `VITE_AZURE_REDIRECT_URI` - OAuth redirect URI (must match Azure AD configuration)

See `DOCKER_DEPLOYMENT.md` for detailed configuration examples.

## Examples

### Example 1: Self-Hosted with Custom Collab Server

```bash
# docker-compose.yml
version: '3.8'
services:
  excalidraw:
    build: .
    ports:
      - "80:80"
    environment:
      APP_WS_OLD_SERVER_URL: https://oss-collab.excalidraw.com
      APP_WS_NEW_SERVER_URL: http://collab-server:3002
    depends_on:
      - collab-server

  collab-server:
    image: my-collab-server:latest
    ports:
      - "3002:3002"
```

### Example 2: Kubernetes Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: excalidraw-config
data:
  APP_WS_OLD_SERVER_URL: "https://oss-collab.excalidraw.com"
  APP_WS_NEW_SERVER_URL: "http://collab-server.internal:3002"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: excalidraw
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: excalidraw
        image: excalidraw:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: excalidraw-config
```

### Example 3: Azure AD + Custom Collab Server

```bash
docker run -d \
  --name excalidraw \
  -p 80:80 \
  -e VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012 \
  -e VITE_AZURE_TENANT_ID=common \
  -e VITE_AZURE_REDIRECT_URI=https://excalidraw.company.com \
  -e APP_WS_OLD_SERVER_URL=https://oss-collab.excalidraw.com \
  -e APP_WS_NEW_SERVER_URL=http://internal-collab:3002 \
  excalidraw:latest
```

## Development Workflow

### Making Changes

1. Make code changes in the main Excalidraw codebase
2. Changes in Docker-specific files:
   - Edit `Dockerfile` for build process changes
   - Edit `docker/entrypoint.sh` for runtime configuration logic
   - Edit `docker/nginx.conf` for nginx settings
   - Edit `DOCKER_DEPLOYMENT.md` for documentation

### Testing Docker Changes

```bash
# Build the image
docker build -t excalidraw:test .

# Run with test configuration
docker run -d \
  --name test-excalidraw \
  -p 8080:80 \
  -e APP_WS_NEW_SERVER_URL=http://test-server:3002 \
  excalidraw:test

# Check logs
docker logs test-excalidraw

# Clean up
docker stop test-excalidraw
docker rm test-excalidraw
```

### Running Tests

```bash
# Type checking
yarn test:typecheck

# All tests
yarn test:all

# Tests with coverage
yarn test:coverage
```

## Merging Back to Main

When this branch is ready for production and merged back:

1. All Docker functionality becomes available in the main branch
2. Users can optionally use Docker or run the app directly
3. The dynamic collab server feature benefits the entire community
4. The submodule architecture is eliminated

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs excalidraw

# Check if image built correctly
docker images | grep excalidraw
```

### Collab server URL not being replaced

```bash
# Verify environment variables are set
docker inspect <container-id> | grep -A 20 Env

# Check that APP_WS_OLD_SERVER_URL matches what's in the built JS
docker exec <container-id> grep -r "oss-collab" /usr/share/nginx/html/
```

### Azure AD login not working

1. Verify redirect URI in Azure AD matches exactly
2. Check Client ID and Tenant ID
3. Use local login as fallback (admin/password)
4. Check browser console for errors

## Related Documentation

- `DOCKER_DEPLOYMENT.md` - Complete Docker deployment guide
- `README.md` - Main Excalidraw documentation
- `SSO_SETUP_INSTRUCTIONS.md` - Detailed SSO setup
- `QUICKSTART.md` - Quick start guide

## Support & Issues

For issues specific to this branch:
1. Check the troubleshooting section above
2. Review logs: `docker-compose logs -f`
3. Test with both local login and SSO
4. Verify network connectivity to collab server

## License

Same as main Excalidraw repository (MIT/Apache 2.0)
