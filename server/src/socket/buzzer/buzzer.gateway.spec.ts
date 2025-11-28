import { BuzzerGateway } from './buzzer.gateway';
import { BuzzerService } from './buzzer.service';

describe('BuzzerGateway', () => {
  let gateway: BuzzerGateway;
  let service: Partial<Record<keyof BuzzerService, jest.Mock>>;
  let mockServer: any;
  let client: any;

  beforeEach(() => {
    service = {
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      handleBuzz: jest.fn(),
      resetRound: jest.fn(),
      kickPlayer: jest.fn(),
      handleDisconnect: jest.fn(),
    } as any;

    // minimal mock of socket.io Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: { sockets: new Map() },
    };

    client = {
      id: 'socket1',
      join: jest.fn(),
      emit: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    };

    gateway = new BuzzerGateway(service as any);
    gateway.server = mockServer;
  });

  it('createGame should create room and emit gameCreated', async () => {
    (service.createRoom as jest.Mock).mockResolvedValue({ id: 'room1' });

    await gateway.createGame(client, { hostName: 'host' });

    expect(service.createRoom).toHaveBeenCalledWith(client, 'host');
    expect(client.join).toHaveBeenCalledWith('room1');
    expect(client.emit).toHaveBeenCalledWith('gameCreated', { roomId: 'room1' });
  });

  it('joinGame should join and notify', async () => {
    const room = { id: 'room1' } as any;
    const player = { id: 'p1', name: 'Alice' } as any;
    (service.joinRoom as jest.Mock).mockResolvedValue({ room, player });

    await gateway.joinGame(client, { roomId: 'room1', playerName: 'Alice' });

    expect(service.joinRoom).toHaveBeenCalledWith(client, 'room1', 'Alice');
    expect(client.join).toHaveBeenCalledWith('room1');
    expect(client.emit).toHaveBeenCalledWith('joined', { playerId: 'p1', name: 'Alice' });
    expect(mockServer.to).toHaveBeenCalledWith('room1');
    expect(mockServer.emit).toHaveBeenCalled();
  });

  it('joinGame should emit error on failure', async () => {
    (service.joinRoom as jest.Mock).mockRejectedValue(new Error('nope'));

    await gateway.joinGame(client, { roomId: 'roomX', playerName: 'Bob' });

    expect(client.emit).toHaveBeenCalledWith('error', { message: 'nope' });
  });

  it('handleBuzz should emit playerBuzz and hostActionRequired when result', async () => {
    (service.handleBuzz as jest.Mock).mockResolvedValue({ roomId: 'room1', winner: 'p1' });

    await gateway.handleBuzz(client);

    expect(service.handleBuzz).toHaveBeenCalledWith(client);
    expect(mockServer.to).toHaveBeenCalledWith('room1');
    // to(...).emit called twice (playerBuzz and hostActionRequired)
    expect(mockServer.emit).toHaveBeenCalled();
  });

  it('resetRound should call service and emit roundReset', async () => {
    (service.resetRound as jest.Mock).mockResolvedValue(undefined);

    await gateway.resetRound(client, { roomId: 'room1' });

    expect(service.resetRound).toHaveBeenCalledWith(client.id, 'room1');
    expect(mockServer.to).toHaveBeenCalledWith('room1');
    expect(mockServer.emit).toHaveBeenCalledWith('roundReset');
  });

  it('kickPlayer should disconnect target and notify', async () => {
    const playerSocket = { leave: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
    mockServer.sockets.sockets.set('removedSocket', playerSocket);

    (service.kickPlayer as jest.Mock).mockResolvedValue({ roomId: 'room1', removedSocketId: 'removedSocket' });

    await gateway.kickPlayer(client, { playerId: 'p1' });

    expect(service.kickPlayer).toHaveBeenCalledWith(client.id, 'p1');
    expect(playerSocket.leave).toHaveBeenCalledWith('room1');
    expect(playerSocket.emit).toHaveBeenCalledWith('kicked', 'Vous avez été exclu de la partie.');
    expect(playerSocket.disconnect).toHaveBeenCalled();
    expect(mockServer.to).toHaveBeenCalledWith('room1');
    expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdated', { type: 'remove' });
  });

  it('handleDisconnect should notify when result', async () => {
    (service.handleDisconnect as jest.Mock).mockResolvedValue({ roomId: 'room1', name: 'Alice' });

    await gateway.handleDisconnect({ id: 'socket1' } as any);

    expect(service.handleDisconnect).toHaveBeenCalledWith({ id: 'socket1' });
    expect(mockServer.to).toHaveBeenCalledWith('room1');
    expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdated', expect.objectContaining({ message: expect.any(String) }));
  });
});
