FROM node:18-alpine

# Instala dependências do sistema necessárias
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# ─── PASSO 1: Build do Frontend React ───────────────────────────────
COPY cloned_frontend/package*.json ./cloned_frontend/
RUN cd cloned_frontend && npm install

COPY cloned_frontend ./cloned_frontend/
RUN cd cloned_frontend && npm run build

# ─── PASSO 2: Instalar dependências do Backend ───────────────────────
COPY package*.json ./
RUN npm install

# ─── PASSO 3: Copiar Prisma e gerar client ───────────────────────────
COPY prisma ./prisma/
RUN npx prisma generate

# ─── PASSO 4: Copiar restante do código ─────────────────────────────
COPY . .

EXPOSE 3000

# Push no banco + start do servidor
CMD npx prisma db push --accept-data-loss && node server.js
