# Excalidraw SSO - Docker Deployment Guide

This guide explains how to build and deploy Excalidraw with SSO authentication using Docker.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The app will be available at `http://localhost`

### Option 2: Using Docker directly

```bash
# Build the image
docker build -t excalidraw-sso:latest .

# Run the container
docker run -d \
  --name excalidraw-sso \
  -p 80:80 \
  excalidraw-sso:latest

# View logs
docker logs -f excalidraw-sso

# Stop the container
docker stop excalidraw-sso
docker rm excalidraw-sso
```

## Authentication Options

The Docker image supports **two authentication methods**:

### 1. Local Login (Always Available)
- **Username:** `admin`
- **Password:** `password`

No additional configuration needed!

### 2. Azure AD SSO (Optional)

To enable Azure AD authentication:

#### At Build Time:

```bash
docker build \
  --build-arg VITE_AZURE_CLIENT_ID=your-client-id \
  --build-arg VITE_AZURE_TENANT_ID=your-tenant-id \
  --build-arg VITE_AZURE_REDIRECT_URI=http://your-domain.com \
  -t excalidraw-sso:latest .
```

#### At Runtime:

Create a `.env` file:
```env
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_TENANT_ID=your-tenant-id-here
VITE_AZURE_REDIRECT_URI=http://localhost
```

Then run:
```bash
docker-compose up -d
```

Or with Docker directly:
```bash
docker run -d \
  --name excalidraw-sso \
  -p 80:80 \
  -e VITE_AZURE_CLIENT_ID=your-client-id \
  -e VITE_AZURE_TENANT_ID=your-tenant-id \
  -e VITE_AZURE_REDIRECT_URI=http://your-domain.com \
  excalidraw-sso:latest
```

## Production Deployment

### 1. Configure Azure AD

1. Create an App Registration in Azure Portal
2. Set redirect URI to your production domain (e.g., `https://excalidraw.yourdomain.com`)
3. Note the Client ID and Tenant ID

### 2. Build for Production

Create `.env` file with production values:
```env
VITE_AZURE_CLIENT_ID=your-production-client-id
VITE_AZURE_TENANT_ID=your-production-tenant-id
VITE_AZURE_REDIRECT_URI=https://excalidraw.yourdomain.com
```

Build and run:
```bash
docker-compose up -d --build
```

### 3. Using a Reverse Proxy (HTTPS)

Example with nginx as reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name excalidraw.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Docker Image Details

### Multi-Stage Build

The Dockerfile uses a multi-stage build:
1. **Build stage:** Uses Node.js 18 to build the React app
2. **Runtime stage:** Uses nginx:alpine to serve static files

### Image Size

- Approximate size: ~50MB (nginx:alpine + built app)

### Health Check

The container includes a health check endpoint at `/health`

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' excalidraw-sso
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_AZURE_CLIENT_ID` | Azure AD Application Client ID | Demo UUID | No |
| `VITE_AZURE_TENANT_ID` | Azure AD Tenant ID or "common" | common | No |
| `VITE_AZURE_REDIRECT_URI` | OAuth redirect URI | http://localhost | No |

## Ports

| Port | Description |
|------|-------------|
| 80 | HTTP (nginx) |

## Volumes

No persistent volumes required. The app is stateless and stores session data in browser localStorage.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs excalidraw-sso

# Or with Docker directly
docker logs excalidraw-sso
```

### Azure AD login fails

1. Verify redirect URI matches exactly in Azure AD
2. Check Client ID and Tenant ID are correct
3. View browser console for errors
4. Use local login as fallback (username: admin, password: password)

### Port already in use

Change the port in docker-compose.yml:
```yaml
ports:
  - "8080:80"  # Use port 8080 instead
```

### Rebuild after code changes

```bash
# With docker-compose
docker-compose up -d --build

# With Docker directly
docker build --no-cache -t excalidraw-sso:latest .
```

## Security Notes

1. **Local Login Credentials:** The credentials (admin/password) are hardcoded. For production:
   - Implement backend authentication
   - Use environment variables for credentials
   - Add rate limiting

2. **HTTPS:** Always use HTTPS in production with a reverse proxy

3. **Firewall:** Restrict access to the container port if needed

4. **Updates:** Regularly update the base images:
   ```bash
   docker pull node:18
   docker pull nginx:1.27-alpine
   docker-compose build --no-cache
   ```

## Kubernetes Deployment

For Kubernetes, see the existing deployment files in your infrastructure. The same environment variables apply.

Example Kubernetes secret:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: excalidraw-sso-config
type: Opaque
stringData:
  VITE_AZURE_CLIENT_ID: "your-client-id"
  VITE_AZURE_TENANT_ID: "your-tenant-id"
  VITE_AZURE_REDIRECT_URI: "https://your-domain.com"
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify configuration in container: `docker exec excalidraw-sso env | grep VITE`
- Test health endpoint: `curl http://localhost/health`
