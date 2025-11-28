import { BuzzerService } from './buzzer.service';

describe('BuzzerService', () => {
  let service: BuzzerService;
  let prismaMock: any;
  const socketMock = (id = 'socket1') => ({ id });

  beforeEach(() => {
    prismaMock = {
      room: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      player: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    // @ts-ignore inject mock
    service = new BuzzerService(prismaMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getAllRooms calls prisma.room.findMany and returns value', async () => {
    const rooms = [{ id: 'r1' }];
    prismaMock.room.findMany.mockResolvedValue(rooms);

    const result = await service.getAllRooms();

    expect(prismaMock.room.findMany).toHaveBeenCalled();
    expect(result).toBe(rooms);
  });

  it('getRoomById returns room from prisma', async () => {
    const room = { id: 'r1' };
    prismaMock.room.findUnique.mockResolvedValue(room);

    const result = await service.getRoomById('r1');

    expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { id: 'r1' }, include: { players: true } });
    expect(result).toBe(room);
  });

  it('createRoom creates room with host socket id', async () => {
    const client = socketMock('host1');
    const created = { id: 'room1', hostSocketId: 'host1' };
    prismaMock.room.create.mockResolvedValue(created);

    const result = await service.createRoom(client as any, 'host');

    expect(prismaMock.room.create).toHaveBeenCalledWith({ data: { hostSocketId: 'host1', isGameActive: false } });
    expect(result).toBe(created);
  });

  it('joinRoom succeeds when room exists', async () => {
    const client = socketMock('s1');
    const room = { id: 'r1' };
    const player = { id: 'p1', socketId: 's1', name: 'Bob', roomId: 'r1' };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.player.create.mockResolvedValue(player);

    const res = await service.joinRoom(client as any, 'r1', 'Bob');

    expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(prismaMock.player.create).toHaveBeenCalledWith({ data: { socketId: 's1', name: 'Bob', roomId: 'r1' } });
    expect(res).toEqual({ room, player });
  });

  it('joinRoom throws when room missing', async () => {
    const client = socketMock('s2');
    prismaMock.room.findUnique.mockResolvedValue(null);

    await expect(service.joinRoom(client as any, 'nope', 'N')).rejects.toThrow('Salle introuvable');
  });

  it('handleBuzz returns null when player or room missing', async () => {
    const client = socketMock('s3');
    prismaMock.player.findUnique.mockResolvedValue(null);

    const res = await service.handleBuzz(client as any);
    expect(res).toBeNull();
  });

  it('handleBuzz returns null when game inactive or locked', async () => {
    const client = socketMock('s4');
    prismaMock.player.findUnique.mockResolvedValue({ id: 'p', name: 'A', room: { id: 'r', isGameActive: false, buzzLocked: false } });

    const res = await service.handleBuzz(client as any);
    expect(res).toBeNull();

    prismaMock.player.findUnique.mockResolvedValue({ id: 'p', name: 'A', room: { id: 'r', isGameActive: true, buzzLocked: true } });
    const res2 = await service.handleBuzz(client as any);
    expect(res2).toBeNull();
  });

  it('handleBuzz updates room and returns winner when valid', async () => {
    const client = socketMock('s5');
    prismaMock.player.findUnique.mockResolvedValue({ id: 'p', name: 'Winner', room: { id: 'r', isGameActive: true, buzzLocked: false } });
    prismaMock.room.update.mockResolvedValue({ id: 'r', buzzLocked: true, buzzedPlayer: 'Winner' });

    const res = await service.handleBuzz(client as any);

    expect(prismaMock.room.update).toHaveBeenCalledWith({ where: { id: 'r' }, data: { buzzLocked: true, buzzedPlayer: 'Winner' } });
    expect(res).toEqual({ roomId: 'r', winner: 'Winner' });
  });

  it('kickPlayer throws if unauthorized and deletes if authorized', async () => {
    prismaMock.player.findUnique.mockResolvedValue(null);
    await expect(service.kickPlayer('hostX', 'pX')).rejects.toThrow();

    prismaMock.player.findUnique.mockResolvedValue({ id: 'pX', socketId: 'sX', room: { id: 'r1', hostSocketId: 'host1' } });
    prismaMock.player.delete.mockResolvedValue({});

    const res = await service.kickPlayer('host1', 'pX');
    expect(prismaMock.player.delete).toHaveBeenCalledWith({ where: { id: 'pX' } });
    expect(res).toEqual({ roomId: 'r1', removedSocketId: 'sX' });
  });

  it('resetRound throws if unauthorized and updates if authorized', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);
    await expect(service.resetRound('host', 'rX')).rejects.toThrow();

    prismaMock.room.findUnique.mockResolvedValue({ id: 'r1', hostSocketId: 'host1' });
    prismaMock.room.update.mockResolvedValue({ id: 'r1', isGameActive: true, buzzLocked: false, buzzedPlayer: null });

    const res = await service.resetRound('host1', 'r1');
    expect(prismaMock.room.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { isGameActive: true, buzzLocked: false, buzzedPlayer: null } });
    expect(res).toEqual({ id: 'r1', isGameActive: true, buzzLocked: false, buzzedPlayer: null });
  });

  it('handleDisconnect deletes player when found and returns info', async () => {
    const client = socketMock('sD');
    prismaMock.player.findUnique.mockResolvedValue({ id: 'pD', socketId: 'sD', roomId: 'rD', name: 'John' });
    prismaMock.player.delete.mockResolvedValue({});

    const res = await service.handleDisconnect(client as any);
    expect(prismaMock.player.delete).toHaveBeenCalledWith({ where: { id: 'pD' } });
    expect(res).toEqual({ roomId: 'rD', name: 'John' });
  });

  it('handleDisconnect returns null when no player', async () => {
    const client = socketMock('sZ');
    prismaMock.player.findUnique.mockResolvedValue(null);
    const res = await service.handleDisconnect(client as any);
    expect(res).toBeNull();
  });
});
