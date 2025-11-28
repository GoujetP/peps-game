# 1. On part d'une image Node
FROM node:20-alpine

# 2. Installer les dépendances système (OpenSSL pour Prisma)
RUN apk add --no-cache openssl

# 3. On crée le dossier de travail
WORKDIR /app

# 3. On copie les dépendances et on installe
COPY package*.json ./
RUN npm install

# 3.5. On copie Prisma et on génère les types
COPY prisma ./prisma
RUN npx prisma generate

# 4. On copie le reste du code
COPY . .

# 5. On build l'application
RUN npm run build

# 6. On expose le port (par défaut 3000 chez Nest)
EXPOSE 3000

# 7. La commande de démarrage
CMD ["node", "dist/main"]