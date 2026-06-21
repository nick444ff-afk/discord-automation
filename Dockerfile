# Build stage for Frontend
FROM node:20-slim AS frontend-build
# Install pnpm for faster and more reliable builds
RUN npm install -g pnpm
WORKDIR /app
# Copy root package.json and lock file
COPY package.json pnpm-lock.yaml ./
# Install dependencies
RUN pnpm install --frozen-lockfile
# Clean pnpm cache to reduce image size and memory usage during build
RUN pnpm store prune
# Copy all source files
COPY client ./client
COPY package.json pnpm-lock.yaml vite.config.ts ./
# Build the frontend using Vite
RUN pnpm run build

# Final stage for Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn uvicorn

# Copy backend code
COPY app/ ./app/

# Copy built frontend from previous stage
# The build output goes to dist/public directory as per vite.config.ts
COPY --from=frontend-build /app/dist/public ./static

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["python", "-m", "app.main"]
