FROM node:20-slim AS builder

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source
COPY server/src ./src

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -s /bin/bash -g "Node.js" -G nodejs
USER nextjs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
