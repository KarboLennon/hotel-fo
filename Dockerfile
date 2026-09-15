FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma needs a URL to generate the client; the build never connects to it.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate && npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/node_modules/prisma ./node_modules/prisma
COPY --from=build --chown=app:app /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
USER app
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
