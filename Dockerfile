FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG BASE_PATH=/demos/http-request-studio
ENV BASE_PATH=$BASE_PATH

RUN npm run build

FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["serve", "build", "-s", "-l", "3000"]
