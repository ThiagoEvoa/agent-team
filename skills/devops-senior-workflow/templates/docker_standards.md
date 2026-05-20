# Docker Standards

## Base Images
- Use official, minimal base images (e.g., `alpine`, `slim`).
- Pin versions: `node:20-alpine` NOT `node:latest`.

## Multi-Stage Builds
- Separate build environment from runtime.
- Example:
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY . .
  RUN npm install && npm run build

  FROM node:20-alpine
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  USER node
  CMD ["node", "dist/main.js"]
  ```

## Security
- `USER` instruction: Never run as root.
- Scan images for vulnerabilities (e.g., `trivy`).
- Don't include build tools or SSH in production images.

## Performance
- Leverage layer caching: `COPY package.json` before `COPY .`.
- Use `.dockerignore` to exclude `node_modules`, `.git`, etc.
