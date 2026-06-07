const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Log an activity in the database and emit via Socket.io.
 * @param {Object} params - Activity details
 * @param {string} params.type - Type of activity (e.g., 'MOVE_TASK', 'CREATE_TASK')
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.taskId - ID of the task involved
 * @param {string} [params.columnId] - Current column ID (if applicable)
 * @param {string} [params.oldColumnId] - Previous column ID (if moved)
 * @param {number} [params.oldOrder] - Previous order index
 * @param {number} [params.newOrder] - New order index
 * @param {string} params.description - Human‑readable description
 * @param {Object} io - Socket.io server instance
 */
async function logActivity({ type, userId, taskId, columnId, oldColumnId, oldOrder, newOrder, description }, io) {
  try {
    const activity = await prisma.activity.create({
      data: {
        type,
        userId,
        taskId,
        columnId,
        oldColumnId,
        oldOrder,
        newOrder,
        description,
      },
    });
    // Broadcast to all connected clients
    if (io) {
      io.emit('activity-created', { activity });
    }
    return activity;
  } catch (err) {
    console.error('Failed to log activity:', err);
    // Swallow errors to avoid breaking primary flow
  }
}

module.exports = { logActivity };
