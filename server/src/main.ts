// LIGNE CRUCIALE : On utilise 'path' pour trouver le fichier .env à coup sûr
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// On force le chargement du fichier .env situé à la racine du projet
dotenv.config({ path: resolve(process.cwd(), '.env') , override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // DEBUG : On vérifie immédiatement si la variable est là
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERREUR CRITIQUE : DATABASE_URL est introuvable ! Vérifiez que le fichier .env est bien à la racine.');
  } else {
    console.log('✅ SUCCÈS : DATABASE_URL chargée avec succès.', process.env.DATABASE_URL); // On n'affiche pas toute l'URL pour des raisons de sécurité
  }

  const app = await NestFactory.create(AppModule);
  
  // Active les CORS pour que ton frontend (React/Vue/etc) puisse se connecter
  app.enableCors();
  // Validation globale des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();