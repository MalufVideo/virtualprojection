FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create qr directory for QR code storage
RUN mkdir -p qr

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]