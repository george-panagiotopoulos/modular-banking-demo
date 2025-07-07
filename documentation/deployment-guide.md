# Deployment Guide - Modular Banking Demo

## Overview

This guide provides step-by-step instructions for deploying the Modular Banking Demo application using Docker and Docker Compose.

## Prerequisites

### System Requirements
- **Docker**: Version 20.0 or higher
- **Docker Compose**: Version 2.0 or higher
- **Node.js**: Version 16+ (for local development)
- **RAM**: Minimum 4GB available
- **Disk Space**: Minimum 2GB free space

### Network Requirements
- Access to Azure Event Hub (for event streaming)
- Access to Temenos Banking APIs
- Ports 3011 (frontend) and 5011 (backend) available

## Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd modular-banking-demo

# Copy environment configuration
cp demoflow-backend/.env.example demoflow-backend/.env
```

### 2. Configure Environment
Edit `demoflow-backend/.env` with your actual values:

```bash
# Required: Azure Event Hub Configuration
BOOTSTRAP_SERVERS=your-eventhub-namespace.servicebus.windows.net:9093
CONNECTION_STRING=Endpoint=sb://your-eventhub-namespace.servicebus.windows.net/;SharedAccessKeyName=your-key-name;SharedAccessKey=your-shared-access-key

# Required: Temenos API Configuration
TEMENOS_BASE_URL=http://your-temenos-host.com
REACT_APP_PARTY_API_URL=http://your-temenos-host.com/ms-party-api/api
REACT_APP_DEPOSITS_API_URL=http://your-deposits-host.com/irf-TBC-accounts-container/api
REACT_APP_LENDING_API_URL=http://your-lending-host.com/irf-TBC-lending-container/api
REACT_APP_HOLDINGS_API_URL=http://your-temenos-host.com/ms-holdings-api/api

# Optional: Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-openai-instance.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT=your-gpt-deployment-name
```

### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3011
- **Backend API**: http://localhost:5011
- **Health Check**: http://localhost:5011/health

## Manual Docker Deployment

### Backend Service
```bash
# Navigate to backend directory
cd demoflow-backend

# Build the image
docker build -t modular-banking-backend .

# Run the container
docker run -d \
  --name banking-backend \
  --env-file .env \
  -p 5011:5011 \
  -v $(pwd)/logs:/app/logs \
  modular-banking-backend
```

### Frontend Service
```bash
# Navigate to frontend directory
cd modular-banking-frontend

# Build the image
docker build -t modular-banking-frontend .

# Run the container
docker run -d \
  --name banking-frontend \
  -p 3011:80 \
  -e REACT_APP_BACKEND_URL=http://localhost:5011 \
  modular-banking-frontend
```

## Local Development Setup

### Backend Development
```bash
cd demoflow-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configurations

# Start development server
npm run dev

# Run tests
npm test
```

### Frontend Development
```bash
cd modular-banking-frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Configuration Details

### Environment Variables

#### Core Configuration
- `PORT`: Backend server port (default: 5011)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_PORT`: Frontend port (default: 3011)

#### Azure Event Hub
- `BOOTSTRAP_SERVERS`: Event Hub bootstrap servers
- `CONNECTION_STRING`: Azure Event Hub connection string

#### Temenos Banking APIs
- `TEMENOS_BASE_URL`: Base URL for Temenos APIs
- `REACT_APP_PARTY_API_URL`: Party management API
- `REACT_APP_DEPOSITS_API_URL`: Deposits management API
- `REACT_APP_LENDING_API_URL`: Lending management API
- `REACT_APP_HOLDINGS_API_URL`: Holdings management API

#### CORS Configuration
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

### Docker Compose Services

#### Frontend Service
- **Build Context**: `./modular-banking-frontend`
- **Port Mapping**: `3011:80`
- **Dependencies**: backend service
- **Base Image**: nginx:alpine

#### Backend Service
- **Build Context**: `./demoflow-backend`
- **Port Mapping**: `5011:5011`
- **Environment**: Loaded from `.env` file
- **Volume**: Logs directory mounted
- **Base Image**: node:16-alpine

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3011
lsof -i :5011

# Stop conflicting services
docker-compose down
```

#### Environment Configuration
```bash
# Verify environment file exists
ls -la demoflow-backend/.env

# Check environment variables
docker-compose config
```

#### Container Logs
```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f
```

#### Network Connectivity
```bash
# Test backend health
curl http://localhost:5011/health

# Test frontend accessibility
curl http://localhost:3011

# Check container networks
docker network ls
docker network inspect modular-banking-demo_default
```

### Performance Optimization

#### Docker Build Optimization
```bash
# Use Docker build cache
docker-compose build --no-cache

# Prune unused images
docker image prune

# Check image sizes
docker images | grep modular-banking
```

#### Memory Usage
```bash
# Monitor container resources
docker stats

# Set memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Production Deployment

### Security Considerations
1. **Environment Variables**: Never commit `.env` files with real credentials
2. **HTTPS**: Use reverse proxy (nginx/traefik) with SSL certificates
3. **Firewall**: Restrict access to necessary ports only
4. **Updates**: Regularly update base images and dependencies

### Scaling Considerations
1. **Load Balancing**: Use multiple backend instances
2. **Database**: Consider external database for session storage
3. **Logging**: Implement centralized logging (ELK stack)
4. **Monitoring**: Add health checks and metrics collection

### Example Production docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: ./modular-banking-frontend
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 256M
    
  backend:
    build: ./demoflow-backend
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
    env_file:
      - .env
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
```

## Support and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up --build -d
```

### Backup and Recovery
```bash
# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz demoflow-backend/logs/

# Backup environment configuration
cp demoflow-backend/.env .env.backup
```

### Health Monitoring
- Backend health endpoint: `GET /health`
- Frontend accessibility: HTTP 200 response
- Log monitoring: Check application and container logs
- Resource monitoring: CPU and memory usage

For additional support, refer to the project documentation or contact the development team. 