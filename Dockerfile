# Build stage for Frontend
FROM node:20-slim AS frontend-build
# Install pnpm for faster and more reliable builds
RUN npm install -g pnpm
WORKDIR /app
# Copy root package.json and lock file
COPY package.json pnpm-lock.yaml ./
# Install dependencies
RUN pnpm install --frozen-lockfile
# Copy all source files
COPY . .
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
# The build output goes to dist/ directory by default in Vite
COPY --from=frontend-build /app/dist ./static

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["python", "-m", "app.main"]
