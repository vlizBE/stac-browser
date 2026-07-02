# Stage 1: build (for production)
FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

ARG pathPrefix=/
ENV PATH_PREFIX=$pathPrefix

RUN npm run build -- --base $PATH_PREFIX

# Stage 2: runtime
FROM node:20 AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist

RUN npm install -g serve

EXPOSE 28080

CMD ["serve", "-s", "/app/dist", "-l", "28080", "--cors"]
