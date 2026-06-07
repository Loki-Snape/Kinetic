require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { logActivity } = require('./src/middleware/activityLogger');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - Auth Header: ${req.headers['authorization'] ? 'Present' : 'None'}`);
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[HTTP] Response for ${req.method} ${req.url}: Status ${res.statusCode}`);
    return originalSend.apply(this, arguments);
  };
  next();
});

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    try {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
      req.user = user;
      next();
    } catch (dbErr) {
      console.error(dbErr);
      return res.status(500).json({ error: 'Database verification failed' });
    }
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    });
    
    const board = await prisma.board.create({
      data: {
        title: `${username}'s Board`,
        ownerId: user.id
      }
    });
    
    const colNames = ['Backlog', 'In Progress', 'Review', 'Done'];
    for (let i = 0; i < colNames.length; i++) {
      await prisma.column.create({
        data: { title: colNames[i], orderIndex: i, boardId: board.id }
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Kinetic Backend is running' });
});

// --- PROTECTED ROUTES ---
app.get('/api/boards', authenticateToken, async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: { ownerId: req.user.id },
      include: {
        columns: {
          include: {
            tasks: { orderBy: { orderIndex: 'asc' } }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

app.post('/api/boards', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const board = await prisma.board.create({
      data: { title, ownerId: req.user.id }
    });
    res.status(201).json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

app.put('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const board = await prisma.board.findUnique({ where: { id } });
    if (board.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.board.update({
      where: { id },
      data: { title }
    });
    
    // Broadcast board update
    io.emit('board-updated', { board: updated });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// Columns
app.post('/api/columns', authenticateToken, async (req, res) => {
  try {
    const { title, orderIndex, boardId } = req.body;
    const column = await prisma.column.create({
      data: { title, orderIndex, boardId }
    });
    // Log activity for column creation
    logActivity({
      type: 'CREATE_COLUMN',
      userId: req.user.id,
      columnId: column.id,
      description: `Created column "${title}"`
    }, io);
    res.status(201).json(column);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create column' });
  }
});

app.put('/api/columns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, orderIndex } = req.body;
    const column = await prisma.column.update({
      where: { id },
      data: { title, orderIndex }
    });
    // Log activity for column rename/update
    logActivity({
      type: 'UPDATE_COLUMN',
      userId: req.user.id,
      columnId: column.id,
      description: `Updated column "${title}"`
    }, io);
    res.json(column);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update column' });
  }
});

app.delete('/api/columns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.column.delete({ where: { id } });
    // Log activity for column deletion
    logActivity({
      type: 'DELETE_COLUMN',
      userId: req.user.id,
      columnId: id,
      description: `Deleted column with id ${id}`
    }, io);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete column' });
  }
});

// Tasks
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, codeSnippet, columnId, priority, tags } = req.body;
    
    const highestTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { orderIndex: 'desc' }
    });
    const orderIndex = highestTask ? highestTask.orderIndex + 1 : 0;

    const task = await prisma.task.create({
      data: { 
        title, 
        description, 
        codeSnippet, 
        orderIndex, 
        columnId, 
        assignedUserId: req.user.id,
        priority: priority || undefined,
        tags: tags ? tags : []
      }
    });
    
    // Log activity for task creation
    logActivity({
      type: 'CREATE_TASK',
      userId: req.user.id,
      taskId: task.id,
      columnId: columnId,
      description: `Created task "${title}"`
    }, io);
    
    io.emit('task-created', { task });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, codeSnippet, orderIndex, columnId, assignedUserId, priority, tags } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: { title, description, codeSnippet, orderIndex, columnId, assignedUserId, priority, tags }
    });
    
    // Log activity for task update/move
    logActivity({
      type: 'UPDATE_TASK',
      userId: req.user.id,
      taskId: task.id,
      columnId: task.columnId,
      description: `Updated task "${title}"`
    }, io);
    
    io.emit('task-moved', { task });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    
    // Log activity for task deletion
    logActivity({
      type: 'DELETE_TASK',
      userId: req.user.id,
      taskId: id,
      description: `Deleted task with id ${id}`
    }, io);
    
    io.emit('task-deleted', { taskId: id });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Users
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { username }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

server.listen(PORT, () => {
  console.log(`Server with Auth & Socket.io is running on port ${PORT}`);
});
