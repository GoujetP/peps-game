# Etape 1 : Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etape 2 : Nginx
FROM nginx:alpine

# --- CORRECTION ICI ---
# Ajoute "/browser" à la fin du chemin source
COPY --from=build /app/dist/client/browser /usr/share/nginx/html

# Copie ta config Nginx (si tu as créé le fichier nginx.conf comme vu avant)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]