import { PrismaClient } from '@prisma/client';
import { config } from './config';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (config.nodeEnv === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };