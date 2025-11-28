import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls $connect on onModuleInit', async () => {
    const connectSpy = jest
      .spyOn(PrismaService.prototype as any, '$connect')
      .mockResolvedValue(undefined as any);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
  });

  it('calls $disconnect on onModuleDestroy', async () => {
    const disconnectSpy = jest
      .spyOn(PrismaService.prototype as any, '$disconnect')
      .mockResolvedValue(undefined as any);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
