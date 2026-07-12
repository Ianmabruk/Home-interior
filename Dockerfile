FROM node:20-slim AS builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev && npm install prisma --no-save

COPY server/prisma ./prisma
RUN npx prisma generate --schema ./prisma/schema.prisma

COPY server/src ./src

EXPOSE 5000

ENV NODE_ENV=production

# Regenerate the Prisma client and apply pending migrations at container start
# (not only at build time). This guarantees the in-memory client matches
# schema.prisma even if the image was built from an older schema, preventing
# stale-client errors such as "PrismaClientValidationError: Unknown argument".
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node src/index.js"]
