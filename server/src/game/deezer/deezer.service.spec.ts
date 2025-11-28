import { Test, TestingModule } from '@nestjs/testing';
import { DeezerService } from './deezer.service';

describe('DeezerService', () => {
  let service: DeezerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeezerService],
    }).compile();

    service = module.get<DeezerService>(DeezerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
