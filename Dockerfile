FROM node:20-slim

# Install system dependencies (Python3, pip, venv, and FFmpeg)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up python virtual environment in /opt/venv and add to PATH
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install/upgrade yt-dlp inside the virtual environment
RUN pip3 install --no-cache-dir --upgrade pip yt-dlp

WORKDIR /app

# Copy package files first for efficient caching
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
