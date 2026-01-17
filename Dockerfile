FROM node:24-slim AS base
WORKDIR /app
COPY ./package.json .
COPY ./dist ./dist

EXPOSE 1104
ENV NODE_ENV=production
CMD ["npm", "start"]
