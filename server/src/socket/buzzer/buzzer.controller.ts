import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { BuzzerService } from './buzzer.service';

@Controller('buzzer')
export class BuzzerController {
  constructor(private readonly buzzerService: BuzzerService) {}

  // GET /buzzer/rooms -> Liste toutes les salles
  @Get('rooms')
  async getAllRooms() {
    return this.buzzerService.getAllRooms();
  }

  // GET /buzzer/rooms/:id -> Détail d'une salle (joueurs, état du buzz, etc.)
  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    const room = await this.buzzerService.getRoomById(id);
    if (!room) {
      throw new NotFoundException('Salle introuvable');
    }
    return room;
  }
}