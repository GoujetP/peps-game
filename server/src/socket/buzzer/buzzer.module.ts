import { Module } from '@nestjs/common';
import { BuzzerService } from './buzzer.service';
import { BuzzerGateway } from './buzzer.gateway';
import { BuzzerController } from './buzzer.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [BuzzerController],
	providers: [BuzzerService, BuzzerGateway, PrismaService],
	exports: [BuzzerService],
})
export class BuzzerModule {}
