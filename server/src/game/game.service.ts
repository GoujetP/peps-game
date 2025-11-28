import { Injectable, NotFoundException } from '@nestjs/common';
import { GameStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async createGame(hostUserId: string) {
    // Génère code 4 lettres
    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    return this.prisma.game.create({
      data: {
        joinCode,
        hostId: hostUserId,
        status: GameStatus.WAITING,
        players: {
          create: {
            nickname: 'Host',
            isHost: true,
            score: 0
          }
        }
      },
      include: { players: true }
    });
  }

  async joinGame(joinCode: string, nickname: string, socketId: string) {
    const game = await this.prisma.game.findUnique({
      where: { joinCode },
      include: { players: true }
    });

    if (!game) throw new NotFoundException('Partie introuvable');
    if (game.status !== GameStatus.WAITING) throw new Error('Partie déjà commencée');

    // Vérifie si pseudo déjà pris
    const pseudoTaken = game.players.some(p => p.nickname === nickname);
    if (pseudoTaken) throw new Error('Pseudo déjà pris !');

    return this.prisma.player.create({
      data: {
        nickname,
        socketId,
        isHost: false,
        gameId: game.id
      }
    });
  }
}