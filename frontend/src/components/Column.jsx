import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { MoreHorizontal, Plus, X } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import api from '../api';
import toast from 'react-hot-toast';

const Column = ({ column, searchTerm, onRefresh }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.post('/tasks', {
        title: newTitle,
        description: newDesc,
        columnId: column.id,
        priority,
        tags,
      });
      const createdTask = res.data;
      column.tasks.push(createdTask);
      setNewTitle('');
      setNewDesc('');
      setPriority('Medium');
      setTags([]);
      setShowAdd(false);
      toast.success('Task added');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      const idx = column.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) column.tasks.splice(idx, 1);
      toast.success('Task deleted');
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  };
  // Dropdown menu state and refs

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear all tasks in this column
  const handleClearAllTasks = async () => {
    try {
      if (!column.tasks || column.tasks.length === 0) return;
      await Promise.all(column.tasks.map((t) => api.delete(`/tasks/${t.id}`)));
      column.tasks = [];
      setMenuOpen(false);
      onRefresh && onRefresh();
      toast.success('All tasks cleared');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear tasks');
    }
  };

  // Delete the column itself
  const handleDeleteColumn = async () => {
    try {
      await api.delete(`/columns/${column.id}`);
      setMenuOpen(false);
      onRefresh && onRefresh();
      toast.success('Column deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete column');
    }
  };
  return (
    <div className="flex flex-col bg-surface rounded-2xl w-[350px] min-w-[350px] max-h-full overflow-hidden border border-white/5 shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-textMain tracking-wide">
            {column.title}
          </h3>
          <span className="bg-surfaceHighlight text-textMuted text-xs font-medium px-2 py-0.5 rounded-full">
            {column.tasks?.length || 0}
          </span>
        </div>
          <div className="relative" ref={menuRef}>
            <button
              className="text-textMuted hover:text-textMain transition-colors p-1 rounded-md hover:bg-surfaceHighlight"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surfaceHighlight border border-white/10 rounded-md shadow-lg z-20">
                <button
                  className="block w-full text-left px-4 py-2 text-textMain hover:bg-surfaceHover"
                  onClick={handleClearAllTasks}
                >
                  Clear All Tasks
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-danger hover:bg-surfaceHover"
                  onClick={handleDeleteColumn}
                >
                  Delete Column
                </button>
              </div>
            )}
          </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-4 custom-scrollbar transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-surfaceHighlight/20' : ''
              }`}
          >
            {column.tasks &&
            column.tasks
              .filter((task) => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  (task.title && task.title.toLowerCase().includes(term)) ||
                  (task.description && task.description.toLowerCase().includes(term))
                );
              })
              .map((task, index) => (
                <Card key={task.id} task={task} index={index} onDeleteTask={handleDeleteTask} />
              ))}
            {provided.placeholder}

            {showAdd ? (
              <form onSubmit={handleAddTask} className="mt-2 p-2 bg-surfaceHighlight rounded-md">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mb-1 bg-background text-textMain rounded px-2 py-1 border border-white/5 focus:outline-none"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full mb-1 bg-background text-textMain rounded px-2 py-1 border border-white/5 focus:outline-none"
                />
                {/* Priority selector */}
                <div className="mb-1">
                  <label className="text-textMuted text-sm mr-2">Priority:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="bg-background text-textMain rounded border border-white/5 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                {/* Tags input */}
                <div className="mb-1 flex flex-wrap items-center gap-1 bg-background/30 rounded p-1">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center bg-surfaceHighlight text-textMain text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <X size={12} className="ml-1 cursor-pointer hover:text-danger" onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="flex-1 bg-transparent text-textMain text-xs outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button type="submit" className="bg-primary hover:bg-primaryHover text-white px-3 py-1 rounded">
                    Add
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="text-textMuted hover:text-textMain">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="w-full flex items-center justify-center gap-2 text-textMuted hover:text-textMain hover:bg-surfaceHighlight p-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 transition-all group mt-2"
                onClick={() => setShowAdd(true)}
              >
                <Plus size={18} className="group-hover:text-primary transition-colors" />
                <span className="font-medium text-sm group-hover:text-primary transition-colors">Add Task</span>
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
