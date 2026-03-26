FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV API_PORT=8787
EXPOSE 8787

CMD ["npm", "run", "start"]

