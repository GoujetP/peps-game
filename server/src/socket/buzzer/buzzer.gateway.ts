import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BuzzerService } from './buzzer.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class BuzzerGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly buzzerService: BuzzerService, private readonly jwtService: JwtService) {}

  private async getUserFromSocket(client: Socket) {
    // token peut être envoyé dans handshake.auth.token (socket.io recommended) ou header
    const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.replace(/^Bearer\s/, '');
    if (!token) return null;
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET || 'change_this_secret' });
      return payload as any;
    } catch (e) {
      return null;
    }
  }

  @SubscribeMessage('createGame')
  async createGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string },
  ) {
    const user = await this.getUserFromSocket(client);
    const userId = user?.sub || data.userId;
    if (!userId) {
      client.emit('error', { message: 'Unauthorized: missing token' });
      return;
    }
    const room = await this.buzzerService.createRoom(client, userId);
    client.join(room.id);
    client.emit('gameCreated', { roomId: room.id, roomCode: room.code });
  }

  @SubscribeMessage('joinGame')
  async joinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; userId?: string; username: string },
  ) {
    try {
      const user = await this.getUserFromSocket(client);
      const userId = user?.sub || data.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized: missing token' });
        return;
      }

      const { room, player } = await this.buzzerService.joinRoom(
        client,
        data.roomCode,
        userId,
        data.username,
      );
      client.join(room.id);

      client.emit('joined', { playerId: player.id, name: player.name });
      this.server.to(room.id).emit('playerListUpdated', { newPlayer: player.name });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('buzz')
  async handleBuzz(@ConnectedSocket() client: Socket) {
    const result = await this.buzzerService.handleBuzz(client);

    if (result) {
      this.server.to(result.roomId).emit('playerBuzz', { winner: result.winner });
      this.server.to(result.roomId).emit('hostActionRequired', { winner: result.winner });
    }
  }

  @SubscribeMessage('resetRound')
  async resetRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      await this.buzzerService.resetRound(client.id, data.roomId);
      this.server.to(data.roomId).emit('roundReset');
    } catch (e) {
      console.error(e);
    }
  }

  @SubscribeMessage('kickPlayer')
  async kickPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ) {
    try {
      const { roomId, removedSocketId } = await this.buzzerService.kickPlayer(
        client.id,
        data.playerId,
      );

      const playerSocket = this.server.sockets.sockets.get(removedSocketId);
      if (playerSocket) {
        playerSocket.leave(roomId);
        playerSocket.emit('kicked', 'Vous avez été exclu de la partie.');
        playerSocket.disconnect();
      }

      this.server.to(roomId).emit('playerListUpdated', { type: 'remove' });
    } catch (e) {
      client.emit('error', { message: 'Impossible de virer ce joueur' });
    }
  }

  async handleDisconnect(client: Socket) {
    const result = await this.buzzerService.handleDisconnect(client);
    if (result) {
      this.server.to(result.roomId).emit('playerListUpdated', {
        message: `${result.name} a quitté la partie`,
      });
    }
  }
}