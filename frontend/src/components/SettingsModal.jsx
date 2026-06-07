import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const SettingsModal = ({ board, onClose }) => {
  const [boardTitle, setBoardTitle] = useState(board.title || '');
  const [username, setUsername] = useState(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored).username || '';
      } catch (_) { return ''; }
    }
    return '';
  });

  const handleBoardSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/boards/${board.id}`, { title: boardTitle });
      toast.success('Board name updated');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update board');
    }
  };

  const handleUsernameSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me', { username });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.username = username;
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Username updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update username');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-surface rounded-xl w-96 p-6 relative shadow-lg border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-textMuted hover:text-textMain"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-textMain mb-4">Settings</h2>
        {/* Board Title */}
        <form onSubmit={handleBoardSave} className="mb-4">
          <label className="block text-sm font-medium text-textMuted mb-1">Board Name</label>
          <input
            type="text"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            className="w-full bg-surfaceHighlight text-textMain rounded px-3 py-1.5 border border-white/5 focus:outline-none focus:border-primary/50"
            required
          />
          <button
            type="submit"
            className="mt-2 w-full bg-primary hover:bg-primaryHover text-white py-1.5 rounded"
          >
            Save Board
          </button>
        </form>
        {/* Username */}
        <form onSubmit={handleUsernameSave}>
          <label className="block text-sm font-medium text-textMuted mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-surfaceHighlight text-textMain rounded px-3 py-1.5 border border-white/5 focus:outline-none focus:border-primary/50"
            required
          />
          <button
            type="submit"
            className="mt-2 w-full bg-primary hover:bg-primaryHover text-white py-1.5 rounded"
          >
            Save Username
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
