# Build stage for Frontend
2	FROM node:20-slim AS frontend-build
3	# Install pnpm for faster and more reliable builds
4	RUN npm install -g pnpm
5	WORKDIR /app
6	# Copy root package.json and lock file
7	COPY package.json pnpm-lock.yaml ./
8	# Install dependencies
9	RUN pnpm install --frozen-lockfile
10	# Copy all source files
11	COPY . .
12	# Build the frontend using Vite
13	RUN pnpm run build
14	
15	# Final stage for Python Backend
16	FROM python:3.11-slim
17	WORKDIR /app
18	
19	# Install system dependencies
20	RUN apt-get update && apt-get install -y \
21	    libpq-dev \
22	    gcc \
23	    && rm -rf /var/lib/apt/lists/*
24	
25	# Copy requirements and install python dependencies
26	COPY requirements.txt .
27	RUN pip install --no-cache-dir -r requirements.txt
28	RUN pip install gunicorn uvicorn
29	
30	# Copy backend code
31	COPY app/ ./app/
32	
33	# Copy built frontend from previous stage
34	# The build output goes to dist/ directory by default in Vite
35	COPY --from=frontend-build /app/dist ./static
36	
37	# Expose port
38	ENV PORT=8080
39	EXPOSE 8080
40	
41	# Start command
42	CMD ["python", "-m", "app.main"]
43	
