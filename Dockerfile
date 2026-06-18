# Build stage for Frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

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
COPY --from=frontend-build /app/client/dist ./static

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["python", "-m", "app.main"]
