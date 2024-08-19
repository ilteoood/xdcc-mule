FROM node:lts-alpine

WORKDIR /app

COPY ./packages/server/dist .
COPY ./packages/server/package.json .
COPY ./packages/client/dist ./public

RUN npm install --omit=dev && rm -rf ~/.npm

EXPOSE 3000

ENTRYPOINT ["node", "index.js"]