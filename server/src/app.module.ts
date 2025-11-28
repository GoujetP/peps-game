import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma/prisma.service';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    GameModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
