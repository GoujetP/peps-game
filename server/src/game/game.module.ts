import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GameService } from './game.service';
import { GameGateway } from './game/game.gateway';
import { DeezerService } from './deezer/deezer.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  imports: [HttpModule],
  providers: [GameService, GameGateway, DeezerService, PrismaService],
})
export class GameModule {}
