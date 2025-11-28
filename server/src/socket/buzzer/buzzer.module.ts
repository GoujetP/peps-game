import { Module } from '@nestjs/common';
import { BuzzerService } from './buzzer.service';
import { BuzzerGateway } from './buzzer.gateway';
import { BuzzerController } from './buzzer.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
	controllers: [BuzzerController],
	providers: [BuzzerService, BuzzerGateway, PrismaService],
	exports: [BuzzerService],
})
export class BuzzerModule {}
