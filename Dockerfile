# Use the latest Node.js image
FROM node:latest

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Make the server executable
RUN chmod +x build/index.js

# Expose any necessary ports (if needed)
# EXPOSE 3000

# Set the entry point
ENTRYPOINT ["node", "build/index.js"]
