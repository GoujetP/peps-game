import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuzzerModule } from './socket/buzzer/buzzer.module';

@Module({
  imports: [BuzzerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
