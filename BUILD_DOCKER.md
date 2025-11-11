# How to Build the Docker Image

## Prerequisites

You need Docker installed on your system:
- **Linux:** `sudo apt-get install docker.io docker-compose` or `yum install docker docker-compose`
- **macOS:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Build Commands

### Quick Build (Recommended)

```bash
# Using Docker Compose (builds and runs)
docker-compose up -d --build

# The app will be available at http://localhost
```

### Manual Build

```bash
# Build the image
docker build -t excalidraw-sso:latest .

# Run the container
docker run -d \
  --name excalidraw-sso \
  -p 80:80 \
  --restart unless-stopped \
  excalidraw-sso:latest

# Check if it's running
docker ps

# View logs
docker logs -f excalidraw-sso

# Open http://localhost in your browser
```

### Build with Azure AD Configuration

```bash
# Build with Azure AD settings
docker build \
  --build-arg VITE_AZURE_CLIENT_ID=your-client-id \
  --build-arg VITE_AZURE_TENANT_ID=your-tenant-id \
  --build-arg VITE_AZURE_REDIRECT_URI=http://localhost \
  -t excalidraw-sso:latest .

# Run it
docker run -d \
  --name excalidraw-sso \
  -p 80:80 \
  excalidraw-sso:latest
```

## What Gets Built

The Docker build process:
1. ✅ Installs all Node.js dependencies
2. ✅ Compiles the TypeScript code
3. ✅ Builds the React app with Vite
4. ✅ Bundles everything for production
5. ✅ Creates an optimized nginx image (~50MB)
6. ✅ Includes SSO authentication (Azure AD + Local Login)

## Build Time

- **First build:** ~5-10 minutes (downloads dependencies)
- **Subsequent builds:** ~2-5 minutes (uses cache)

## Login Options After Build

### 1. Local Login (Always Works)
- Username: `admin`
- Password: `password`

### 2. Azure AD SSO (If Configured)
- Requires valid Azure AD credentials
- Configured via environment variables

## Troubleshooting

### Build fails with "command not found"
Install Docker:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install docker.io docker-compose

# Enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### Port 80 already in use
Change the port mapping:
```bash
docker run -d -p 8080:80 --name excalidraw-sso excalidraw-sso:latest
# Then access at http://localhost:8080
```

### Build is slow
Docker caches layers. First build is always slower. Use `--no-cache` only when needed:
```bash
docker build --no-cache -t excalidraw-sso:latest .
```

## Next Steps

After building:
1. Test locally: `http://localhost`
2. Login with `admin`/`password`
3. Deploy to production (see DOCKER_DEPLOYMENT.md)
4. Configure Azure AD for real SSO (optional)

## Files Created

All the Docker configuration files are ready:
- ✅ `Dockerfile` - Multi-stage build configuration
- ✅ `docker-compose.yml` - Easy deployment orchestration
- ✅ `docker/nginx.conf` - Nginx web server config
- ✅ `docker/entrypoint.sh` - Runtime configuration script
- ✅ `.dockerignore` - Build optimization
- ✅ `.env.docker.example` - Environment variable template
- ✅ `DOCKER_DEPLOYMENT.md` - Complete deployment guide
- ✅ `BUILD_DOCKER.md` - This file

## Summary

You're all set! The Docker configuration is complete. Just run:

```bash
docker-compose up -d --build
```

And your SSO-protected Excalidraw will be running at `http://localhost`!
