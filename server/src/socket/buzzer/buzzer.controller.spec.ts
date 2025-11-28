
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BuzzerController } from './buzzer.controller';
import { BuzzerService } from './buzzer.service';

describe('BuzzerController', () => {
    let controller: BuzzerController;
    let service: Partial<Record<keyof BuzzerService, jest.Mock>>;
    
    // Mock the service module before importing the controller so Jest doesn't try
    // to load `src/prisma/prisma.service` (path mapping not configured in Jest).
    jest.mock('./buzzer.service', () => ({
      BuzzerService: jest.fn().mockImplementation(() => ({
        getAllRooms: jest.fn(),
        getRoomById: jest.fn(),
      })),
    }));
  beforeEach(async () => {
    service = {
      getAllRooms: jest.fn(),
      getRoomById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuzzerController],
      providers: [
        {
          provide: BuzzerService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BuzzerController>(BuzzerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllRooms', () => {
    it('should return an array of rooms', async () => {
      const rooms = [
        { id: 'room1', players: [], isGameActive: false },
        { id: 'room2', players: [], isGameActive: true },
      ];
      (service.getAllRooms as jest.Mock).mockResolvedValue(rooms);

      const result = await controller.getAllRooms();

      expect(service.getAllRooms).toHaveBeenCalled();
      expect(result).toBe(rooms);
    });
  });

  describe('getRoom', () => {
    it('should return a room when found', async () => {
      const room = { id: 'room1', players: [], isGameActive: false };
      (service.getRoomById as jest.Mock).mockResolvedValue(room);

      const result = await controller.getRoom('room1');

      expect(service.getRoomById).toHaveBeenCalledWith('room1');
      expect(result).toBe(room);
    });

    it('should throw NotFoundException when room not found', async () => {
      (service.getRoomById as jest.Mock).mockResolvedValue(null);

      await expect(controller.getRoom('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(service.getRoomById).toHaveBeenCalledWith('missing');
    });
  });
});
