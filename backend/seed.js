const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (order matters — tasks → columns → boards → users → activities)
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  // Create default user with a REAL bcrypt hash
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      username: 'kineticuser',
      email: 'dev@kinetic.app',
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email} / password123`);

  // Create board
  const board = await prisma.board.create({
    data: {
      title: 'Kinetic Development',
      ownerId: user.id,
    },
  });

  // Create columns
  const colNames = ['Backlog', 'In Progress', 'Review', 'Done'];
  const columns = [];
  for (let i = 0; i < colNames.length; i++) {
    const col = await prisma.column.create({
      data: {
        title: colNames[i],
        orderIndex: i,
        boardId: board.id,
      },
    });
    columns.push(col);
  }

  // Seed some starter tasks
  const tasks = [
    {
      title: 'Design Database Schema',
      description: 'Create Prisma schema for the Kanban board.',
      columnId: columns[0].id,
      orderIndex: 0,
      priority: 'High',
      tags: ['database', 'prisma'],
    },
    {
      title: 'Setup WebSockets',
      description: 'Implement real-time sync with Socket.io',
      codeSnippet: 'const io = new Server(server);',
      columnId: columns[0].id,
      orderIndex: 1,
      priority: 'Medium',
      tags: ['backend', 'realtime'],
    },
    {
      title: 'Build React UI',
      description: 'Create Board, Column, and Card components.',
      columnId: columns[1].id,
      orderIndex: 0,
      priority: 'High',
      tags: ['frontend', 'react'],
    },
    {
      title: 'Add Drag & Drop',
      description: 'Implement @hello-pangea/dnd for task reordering.',
      columnId: columns[1].id,
      orderIndex: 1,
      priority: 'Medium',
      tags: ['frontend', 'ux'],
    },
    {
      title: 'Write API Tests',
      description: 'Test all REST endpoints with Jest or Supertest.',
      columnId: columns[2].id,
      orderIndex: 0,
      priority: 'Low',
      tags: ['testing'],
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({ data: taskData });
  }

  console.log('✅ Seeding finished.');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email:    dev@kinetic.app');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
