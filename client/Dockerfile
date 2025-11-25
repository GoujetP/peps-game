# Etape 1 : Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etape 2 : Nginx
FROM nginx:alpine

# --- LA CORRECTION EST ICI ---
# On copie le contenu de dist/client vers le dossier HTML de Nginx
COPY --from=build /app/dist/client /usr/share/nginx/html

# (Optionnel) Copie d'une config Nginx personnalisée (voir étape bonus)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]