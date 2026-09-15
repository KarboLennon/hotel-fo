# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Cache mount keeps the npm download cache between builds, so a lock-file change is cheap.
RUN --mount=type=cache,target=/root/.npm npm ci

# Full toolchain image: also used by the `migrate` and `seed` compose services (Prisma CLI + tsx need
# the complete node_modules, which the slim runtime image deliberately does not carry).
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 TZ=Asia/Jakarta
# Prisma needs a URL to generate the client; the build never connects to it.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
# Next keeps its compiler cache in .next/cache; persisting it across builds cuts rebuild time
# roughly in half on the 1-vCPU server (the build output itself still lands in the image).
RUN --mount=type=cache,target=/app/.next/cache npx prisma generate && npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Prisma client runtime + query engine for the app itself (migrations run in the `migrate` service).
COPY --from=build --chown=app:app /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
USER app
EXPOSE 3000
CMD ["node", "server.js"]
