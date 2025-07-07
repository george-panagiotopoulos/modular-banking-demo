# Stage 1: Build the React Frontend
FROM node:16-alpine AS frontend-builder

WORKDIR /app/frontend
COPY modular-banking-frontend/package*.json ./
RUN npm ci
COPY modular-banking-frontend/ ./
RUN npm run build

# Stage 2: Build the Node.js Backend
FROM node:16-alpine AS backend-builder

WORKDIR /app/backend
COPY demoflow-backend/package*.json ./
RUN npm ci --only=production
COPY demoflow-backend/ ./

# Stage 3: Create the Final Production Image
FROM node:16-alpine

WORKDIR /app

# Copy backend from the backend-builder stage
COPY --from=backend-builder /app/backend ./

# Copy frontend build from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/build ./frontend-build

# Expose the port the server listens on
EXPOSE 5011

# Set the project root environment variable so the server knows where to find files
ENV PROJECT_ROOT=/app

# Start the Node.js server
CMD ["node", "src/server.js"] 