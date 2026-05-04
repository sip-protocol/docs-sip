# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright Chromium for rehype-mermaid (renders Mermaid diagrams to SVG at build time).
# Required by 7 markdown files (architecture.md, concepts/{stealth-address,viewing-key}.md,
# specs/{fulfillment-proof,funding-proof,validity-proof,zk-architecture}.md). Without this,
# `npm run build` fails with "browserType.launch: Executable doesn't exist". See sip-protocol/docs-sip#89.
RUN npx playwright install --with-deps chromium-headless-shell

# Copy source
COPY . .

# Build Astro site
RUN npm run build

# Production stage - use nginx to serve static files (only dist/ is copied, no Node runtime needed)
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
