const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("Checking Database contents...");
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, username: u.username, email: u.email })));
  
  const boards = await prisma.board.findMany();
  console.log("Boards:", boards.map(b => ({ id: b.id, title: b.title, ownerId: b.ownerId })));

  const columns = await prisma.column.findMany();
  console.log("Columns count:", columns.length);

  const tasks = await prisma.task.findMany();
  console.log("Tasks count:", tasks.length);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
