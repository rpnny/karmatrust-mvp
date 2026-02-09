/**
 * Prisma Database Client
 * Singleton pattern for connection pooling
 * 
 * NOTE: Prisma is optional for the MVP.
 * Backend works without PostgreSQL (in-memory state for now).
 * When you're ready to add persistence:
 *   1. Set DATABASE_URL in .env
 *   2. Run: npx prisma migrate dev --name init
 *   3. Run: npx prisma generate
 *   4. Import this client in your services
 */

let prisma: any = null;

try {
  // Dynamic import - won't crash if Prisma isn't generated yet
  const { PrismaClient } = require('@prisma/client');
  
  const globalForPrisma = global as unknown as { prisma: any };
  
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  
  // Graceful shutdown
  process.on('beforeExit', async () => {
    if (prisma) await prisma.$disconnect();
  });
  
  console.log('[DB] Prisma client initialized');
} catch {
  console.log('[DB] Prisma not available - using in-memory state (run npx prisma generate to enable)');
}

export { prisma };

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return prisma !== null;
}
