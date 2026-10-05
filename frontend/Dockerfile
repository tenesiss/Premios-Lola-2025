FROM node:24-bookworm-slim AS build
WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html firebase.ts vite-env.d.ts tsconfig*.json vite.config.ts ./
COPY src ./src
COPY public ./public

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
