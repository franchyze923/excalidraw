#!/bin/bash
set -e

# This script is minimal since all configuration is handled at Docker build time
echo "Excalidraw - Starting nginx..."

# Execute the main container command (nginx)
exec "$@"
