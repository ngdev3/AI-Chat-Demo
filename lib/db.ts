import { PrismaClient } from '@prisma/client';

// This is a standard pattern for creating a singleton Prisma Client instance
// in a Next.js application. It prevents creating too many connections
// during development due to hot-reloading.

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
