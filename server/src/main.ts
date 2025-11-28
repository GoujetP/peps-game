import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('DB URL:', process.env.DATABASE_URL);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
