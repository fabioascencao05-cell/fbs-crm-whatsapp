FROM node:18-alpine

# Instala OpenSSL exigido pelo Prisma na imagem Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copia package.json primeiro para cache das dependências
COPY package*.json ./
RUN npm install

# Copia os arquivos do Prisma e gera o client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia o restante do código
COPY . .

EXPOSE 3000

# Push no banco de dados garantindo a criação da tabela na VPS e depois roda o server
CMD npx prisma db push --accept-data-loss && node server.js
