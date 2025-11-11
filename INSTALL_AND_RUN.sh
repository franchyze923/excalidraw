#!/bin/bash
# Excalidraw SSO - Installation and Build Script

echo "========================================="
echo "Excalidraw SSO - Docker Installation"
echo "========================================="
echo ""

# Step 1: Install Docker
echo "Step 1: Installing Docker..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Step 2: Start Docker service
echo ""
echo "Step 2: Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Step 3: Add current user to docker group (optional, to run without sudo)
echo ""
echo "Step 3: Adding user to docker group..."
sudo usermod -aG docker $USER

echo ""
echo "⚠️  IMPORTANT: Log out and back in for group changes to take effect"
echo "    Or run: newgrp docker"
echo ""

# Step 4: Verify Docker installation
echo "Step 4: Verifying Docker installation..."
docker --version
docker-compose --version

echo ""
echo "========================================="
echo "Building Excalidraw SSO Docker Image"
echo "========================================="
echo ""

# Step 5: Build the Docker image
echo "Step 5: Building Docker image (this may take 5-10 minutes)..."
cd /home/fran/excalidraw-sso
docker-compose up -d --build

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Your Excalidraw SSO app is now running!"
echo ""
echo "Access it at: http://localhost"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: password"
echo ""
echo "Useful commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop container:   docker-compose down"
echo "  - Restart:          docker-compose restart"
echo "  - Rebuild:          docker-compose up -d --build"
echo ""
