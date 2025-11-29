import { Controller, Get, Param, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BuzzerService } from './buzzer.service';

@Controller('buzzer')
export class BuzzerController {
  constructor(private readonly buzzerService: BuzzerService) {}

  @Get('rooms')
  @UseGuards(AuthGuard('jwt'))
  async getAllRooms() {
    return this.buzzerService.getAllRooms();
  }

  @Get('rooms/code/:code')
  @UseGuards(AuthGuard('jwt'))
  async getRoomByCode(@Param('code') code: string) {
    const room = await this.buzzerService.getRoomByCode(code);
    if (!room) {
      throw new NotFoundException('Salle introuvable');
    }
    return room;
  }
}