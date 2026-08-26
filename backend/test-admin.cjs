const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const admins = await prisma.admin.findMany({ select: { email: true } });
  console.log('Admins:', admins.map(a => a.email).join(', '));
  
  // Test circular tabs
  const tabs = await prisma.circularTab.findMany({ orderBy: { displayOrder: 'asc' } });
  console.log('Circular tabs count:', tabs.length);
  
  process.exit(0);
}
test();
