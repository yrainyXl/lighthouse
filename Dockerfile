FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY} && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --legacy-peer-deps --no-audit --no-fund --maxsockets 1

COPY . .

# UI 版本：'old' | 'new'，默认 old
ARG VITE_UI_VERSION=old
ENV VITE_UI_VERSION=$VITE_UI_VERSION
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN npm run build

ENV NODE_ENV=production
ENV API_PORT=8787
EXPOSE 8787

CMD ["npm", "run", "start"]
