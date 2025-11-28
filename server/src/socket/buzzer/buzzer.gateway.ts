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

@WebSocketGateway({ cors: { origin: '*' } }) // Active CORS pour que ton front puisse se connecter
export class BuzzerGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly buzzerService: BuzzerService) {}

  // 1. Création de la partie par l'hôte
  @SubscribeMessage('createGame')
  async createGame(@ConnectedSocket() client: Socket, @MessageBody() data: { hostName: string }) {
    const room = await this.buzzerService.createRoom(client, data.hostName);
    client.join(room.id); // L'hôte rejoint la channel socket
    
    // On renvoie l'ID de la salle à l'hôte pour qu'il l'affiche
    client.emit('gameCreated', { roomId: room.id });
  }

  // 2. Les joueurs rejoignent
  @SubscribeMessage('joinGame')
  async joinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; playerName: string },
  ) {
    try {
      const { room, player } = await this.buzzerService.joinRoom(client, data.roomId, data.playerName);
      client.join(room.id);

      // Notifier l'utilisateur qu'il a rejoint
      client.emit('joined', { playerId: player.id, name: player.name });
      
      // Mettre à jour la liste des joueurs pour tout le monde dans la salle (surtout l'hôte)
      this.server.to(room.id).emit('playerListUpdated', { newPlayer: player.name });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // 3. Un joueur Buzz
  @SubscribeMessage('buzz')
  async handleBuzz(@ConnectedSocket() client: Socket) {
    const result = await this.buzzerService.handleBuzz(client);
    
    if (result) {
      // Événement CRUCIAL : On dit à tout le monde "STOP, X a gagné ce round"
      // Le front doit écouter ça pour bloquer les boutons et afficher le gagnant
      this.server.to(result.roomId).emit('playerBuzz', { winner: result.winner });
      
      // On joue un son ou une anim chez l'hôte
      this.server.to(result.roomId).emit('hostActionRequired', { winner: result.winner });
    }
  }

  // 4. L'hôte valide/relance le round
  @SubscribeMessage('resetRound')
  async resetRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      await this.buzzerService.resetRound(client.id, data.roomId);
      // On dit à tout le monde : "C'est reparti, boutons débloqués !"
      this.server.to(data.roomId).emit('roundReset');
    } catch (e) {
      console.error(e);
    }
  }

  // 5. L'hôte vire un joueur
  @SubscribeMessage('kickPlayer')
  async kickPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ) {
    try {
      const { roomId, removedSocketId } = await this.buzzerService.kickPlayer(client.id, data.playerId);
      
      // On déconnecte le socket du joueur viré
      const playerSocket = this.server.sockets.sockets.get(removedSocketId);
      if (playerSocket) {
        playerSocket.leave(roomId);
        playerSocket.emit('kicked', 'Vous avez été exclu de la partie.');
        playerSocket.disconnect();
      }
      
      this.server.to(roomId).emit('playerListUpdated', { type: 'remove' });
    } catch (e) {
      client.emit('error', { message: "Impossible de virer ce joueur" });
    }
  }

  // Gestion de la déconnexion (fermeture d'onglet)
  async handleDisconnect(client: Socket) {
    const result = await this.buzzerService.handleDisconnect(client);
    if (result) {
      this.server.to(result.roomId).emit('playerListUpdated', { 
        message: `${result.name} a quitté la partie` 
      });
    }
  }
}