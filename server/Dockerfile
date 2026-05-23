# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install deps first (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# ── Production stage ──────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=base /app /app

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
