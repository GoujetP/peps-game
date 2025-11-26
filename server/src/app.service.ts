import { Injectable } from '@nestjs/common';
import { PrismaService } from './services/prisma/prisma.service';

@Injectable()
export class AppService {

  constructor(private prisma: PrismaService) {} 

  async getUsers() {
    return this.prisma.user.findMany();
  }
  getHello(): string {
    return 'Hello World!';
  }
}
