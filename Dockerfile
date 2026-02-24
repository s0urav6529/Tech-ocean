# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install OS-level build tools needed by native addons (e.g., bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Use 'node' directly (not npm) to receive SIGTERM properly
CMD ["node", "src/server.js"]
