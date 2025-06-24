# Use official Node.js LTS image
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx tsc

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/index.js"]