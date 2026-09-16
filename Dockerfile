# Build compatível com Docker e Podman (podman build -t siab-frontend .)

# ---- Estágio 1: dependências ----
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# ---- Estágio 2: build ----
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# ---- Estágio 3: runtime ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
