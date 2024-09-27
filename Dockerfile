FROM node:22-slim AS base
WORKDIR /app
COPY ./package.json .
COPY ./dist ./dist

RUN node ./dist/index.js
