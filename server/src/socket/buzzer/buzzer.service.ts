import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BuzzerService {
  // On injecte PrismaService ici. NestJS attendra que l'app soit prête (et le .env chargé)
  constructor(private prisma: PrismaService) {}

  // --- MÉTHODES POUR LE CONTROLLER HTTP ---

  async getAllRooms() {
    // On utilise "this.prisma" au lieu de "prisma"
    return await this.prisma.room.findMany({
      include: { _count: { select: { players: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRoomById(roomId: string) {
    return await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true }
    });
  }

  // --- MÉTHODES POUR LE JEU (WEBSOCKETS) ---

  async createRoom(client: Socket, hostName: string) {
    const room = await this.prisma.room.create({
      data: {
        hostSocketId: client.id,
        isGameActive: false,
      },
    });
    return room;
  }

  async joinRoom(client: Socket, roomId: string, playerName: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error('Salle introuvable');

    const player = await this.prisma.player.create({
      data: {
        socketId: client.id,
        name: playerName,
        roomId: room.id,
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
    const player = await this.prisma.player.findUnique({ where: { socketId: client.id } });
    if (player) {
      await this.prisma.player.delete({ where: { id: player.id } });
      return { roomId: player.roomId, name: player.name };
    }
    return null;
  }
}