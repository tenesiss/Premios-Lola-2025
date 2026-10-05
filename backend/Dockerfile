FROM node:24-bookworm-slim AS build
WORKDIR /app/backend

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json server.ts ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

COPY --from=build /app/backend/package.json /app/backend/package-lock.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY public ./public

USER node
EXPOSE 8000
CMD ["node", "dist/server.js"]
