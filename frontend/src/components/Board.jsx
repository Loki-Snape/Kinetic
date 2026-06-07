import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Column from './Column';
import { LayoutDashboard, Bell, Search, Settings, LogOut } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';
import api from '../api';
import toast from 'react-hot-toast';
import SettingsModal from './SettingsModal';
import { useNavigate } from 'react-router-dom';

const API_URL = ''; // not used, api handles baseURL

const Board = () => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoard();
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket || !board) return;
    const handleTaskMoved = ({ task }) => {
      const currentBoard = JSON.parse(JSON.stringify(board));
      let foundTask = null;
      let sourceColIndex = -1;
      let taskIndex = -1;
      for (let i = 0; i < currentBoard.columns.length; i++) {
        const col = currentBoard.columns[i];
        const idx = col.tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          foundTask = col.tasks[idx];
          sourceColIndex = i;
          taskIndex = idx;
          break;
        }
      }
      if (foundTask) {
        if (foundTask.columnId === task.columnId && foundTask.orderIndex === task.orderIndex) return;
        currentBoard.columns[sourceColIndex].tasks.splice(taskIndex, 1);
        const destColIndex = currentBoard.columns.findIndex(c => c.id === task.columnId);
        if (destColIndex !== -1) {
          const updatedTask = { ...foundTask, ...task };
          currentBoard.columns[destColIndex].tasks.splice(task.orderIndex, 0, updatedTask);
          setBoard(currentBoard);
          toast.success('Task moved remotely!');
        }
      }
    };
    socket.on('task-moved', handleTaskMoved);
    socket.on('task-created', ({ task }) => {
      // Add new task to its column in state
      setBoard(prev => {
        if (!prev) return prev;
        const newBoard = JSON.parse(JSON.stringify(prev));
        const col = newBoard.columns.find(c => c.id === task.columnId);
        if (col) col.tasks.splice(task.orderIndex, 0, task);
        return newBoard;
      });
    });
    socket.on('task-deleted', ({ taskId }) => {
      setBoard(prev => {
        if (!prev) return prev;
        const newBoard = JSON.parse(JSON.stringify(prev));
        newBoard.columns.forEach(col => {
          const idx = col.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) col.tasks.splice(idx, 1);
        });
        return newBoard;
      });
    });
    socket.on('board-updated', ({ board: updated }) => {
      setBoard(updated);
    });
    return () => {
      socket.off('task-moved', handleTaskMoved);
      socket.off('task-created');
      socket.off('task-deleted');
      socket.off('board-updated');
    };
  }, [socket, board]);

  const fetchBoard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await api.get('/boards');
      console.log("API Response:", res.data);
      if (res.data && res.data.length > 0) {
        setBoard(res.data[0]);
      } else {
        console.warn('No boards returned from API');
      }
    } catch (error) {
      console.error('Error fetching board:', error?.response?.status, error?.message);
      // 401/403 are handled by the api interceptor (auto-redirect to /login)
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newBoard = JSON.parse(JSON.stringify(board));
    const sourceColIdx = newBoard.columns.findIndex(c => c.id === source.droppableId);
    const destColIdx = newBoard.columns.findIndex(c => c.id === destination.droppableId);
    const sourceCol = newBoard.columns[sourceColIdx];
    const destCol = newBoard.columns[destColIdx];
    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    movedTask.columnId = destination.droppableId;
    movedTask.orderIndex = destination.index;
    destCol.tasks.splice(destination.index, 0, movedTask);
    setBoard(newBoard);
    try {
      await api.put(`/tasks/${draggableId}`, {
        columnId: destination.droppableId,
        orderIndex: destination.index
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to save move');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-textMuted font-medium">Loading Kinetic...</p>
      </div>
    );
  }
  if (!board) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-textMuted bg-background">
        No board found. Did the seed script run?
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primaryHover to-primary bg-clip-text text-transparent">
            {board.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surfaceHighlight text-sm text-textMain rounded-full pl-10 pr-4 py-2 border border-white/5 focus:outline-none focus:border-primary/50 transition-colors w-64"
            />
          </div>
          <button className="text-textMuted hover:text-textMain transition-colors relative" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
          <button className="text-textMuted hover:text-textMain transition-colors" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {board.columns.map(col => (
              <Column key={col.id} column={col} searchTerm={searchTerm} onRefresh={fetchBoard} />
            ))}
          </div>
        </DragDropContext>
      </main>

      {showSettings && <SettingsModal board={board} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Board;
