import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BuzzerService {
  constructor(private prisma: PrismaService) {}

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getAllRooms() {
    return await this.prisma.room.findMany({
      include: { 
        _count: { select: { players: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoomByCode(code: string) {
    return await this.prisma.room.findUnique({
      where: { code },
      include: { players: true },
    });
  }

  async createRoom(client: Socket, userId: string) {
    let code: string = '';
    let isUnique = false;

    // Générer un code unique
    while (!isUnique) {
      code = this.generateRoomCode();
      const existing = await this.prisma.room.findUnique({ where: { code } });
      if (!existing) isUnique = true;
    }

    const room = await this.prisma.room.create({
      data: {
        code,
        hostSocketId: client.id,
        isGameActive: false,
      },
    });
    return room;
  }

  async joinRoom(client: Socket, code: string, userId: string, username: string) {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) throw new Error('Salle introuvable');

    // Vérifier la limite de 16 joueurs
    const playerCount = await this.prisma.player.count({
      where: { roomId: room.id },
    });
    if (playerCount >= 16) {
      throw new Error('La salle est pleine (16 joueurs max)');
    }

    const player = await this.prisma.player.create({
      data: {
        socketId: client.id,
        name: username,
        roomId: room.id,
        userId,
      },
    });

    return { room, player };
  }

  async handleBuzz(client: Socket) {
    const player = await this.prisma.player.findUnique({
      where: { socketId: client.id },
      include: { room: true },
    });

    if (!player || !player.room) return null;

    if (!player.room.isGameActive || player.room.buzzLocked) {
      return null;
    }

    await this.prisma.room.update({
      where: { id: player.room.id },
      data: {
        buzzLocked: true,
        buzzedPlayer: player.name,
      },
    });

    return { roomId: player.room.id, winner: player.name };
  }

  async kickPlayer(hostSocketId: string, playerIdToKick: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerIdToKick },
      include: { room: true },
    });

    if (!player || player.room.hostSocketId !== hostSocketId) {
      throw new Error('Non autorisé');
    }

    await this.prisma.player.delete({ where: { id: playerIdToKick } });
    return { roomId: player.room.id, removedSocketId: player.socketId };
  }

  async resetRound(hostSocketId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });

    if (!room || room.hostSocketId !== hostSocketId) {
      throw new Error('Non autorisé');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        isGameActive: true,
        buzzLocked: false,
        buzzedPlayer: null,
      },
    });

    return updatedRoom;
  }

  async handleDisconnect(client: Socket) {
    const player = await this.prisma.player.findUnique({ 
      where: { socketId: client.id } 
    });
    if (player) {
      await this.prisma.player.delete({ where: { id: player.id } });
      return { roomId: player.roomId, name: player.name };
    }
    return null;
  }
}