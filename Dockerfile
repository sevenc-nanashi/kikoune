FROM node:22-slim AS base
WORKDIR /app
COPY ./package.json .
COPY ./dist ./dist

EXPOSE 1104
RUN node ./dist/index.js
