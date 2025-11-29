import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuzzerModule } from './socket/buzzer/buzzer.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [BuzzerModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
