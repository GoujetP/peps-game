import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game.service';
import { DeezerService } from '../deezer/deezer.service';


// CORS true permet à ton Angular (port 80 ou 4200) de se connecter au Nest (port 3000)
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly deezerService: DeezerService
  ) {}

  // 1. Connexion (Logique technique)
  handleConnection(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté : ${client.id}`);
    // TODO: Gérer la suppression du joueur dans la DB si besoin
  }

  // 2. Créer une partie
  @SubscribeMessage('create_game')
  async handleCreateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string } // On suppose qu'on reçoit l'ID du User
  ) {
    try {
      const game = await this.gameService.createGame(data.userId);
      
      // On fait rejoindre la "Room" socket à l'organisateur
      client.join(game.id);
      
      // On renvoie l'info au créateur
      client.emit('game_created', { gameId: game.id, joinCode: game.joinCode });
      console.log(`Partie créée : ${game.joinCode} par ${data.userId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // 3. Rejoindre une partie
  @SubscribeMessage('join_game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { joinCode: string; nickname: string }
  ) {
    try {
      const player = await this.gameService.joinGame(data.joinCode, data.nickname, client.id);
      
      // Le joueur rejoint le canal de communication de cette partie
      client.join(player.gameId);
      
      // On prévient tout le monde dans la partie qu'un nouveau est arrivé
      this.server.to(player.gameId).emit('player_joined', { nickname: player.nickname });
      
      console.log(`${player.nickname} a rejoint la room ${player.gameId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // 4. Test Rapide Deezer (Pour vérifier ton P0)
 @SubscribeMessage('test_music')
  async handleTestMusic(@ConnectedSocket() client: Socket) {
    console.log('1. Reçu demande test_music de ' + client.id); // <-- Mouchard 1
    
    try {
      const track = await this.deezerService.getRandomTrack('Disney');
      console.log('2. Deezer a répondu :', track.title); // <-- Mouchard 2
      
      client.emit('music_preview', track);
      console.log('3. Réponse envoyée au client'); // <-- Mouchard 3
    } catch (error) {
      console.error('❌ ERREUR DEEZER :', error); // <-- Mouchard d'erreur
      client.emit('error', { message: "Erreur côté serveur : " + error.message });
    }
  }
}