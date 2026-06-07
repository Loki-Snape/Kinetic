import React from 'react';
import { GripVertical, AlignLeft, Code, Trash2 } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

const Card = ({ task, index, onDeleteTask }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-surfaceHighlight hover:bg-surfaceHighlight/80 p-4 rounded-xl border transition-all duration-200 shadow-sm cursor-grab active:cursor-grabbing mb-3 relative ${
            snapshot.isDragging ? 'border-primary/50 shadow-xl opacity-95 scale-105 z-50' : 'border-white/5 hover:shadow-md'
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          {/* Delete Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="absolute top-3 right-3 text-textMuted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>

          <div className="flex items-start gap-2 pr-6">
            <div className="mt-1 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={16} />
            </div>
            <div className="flex-1">
              <h4 className="text-textMain font-medium leading-tight mb-2 break-words">
            {task.title}
          </h4>
          {/* Priority badge */}
          {task.priority && (
            <div className="flex items-center gap-1.5 text-sm text-textMuted mt-1">
              <span className={`w-2 h-2 rounded-full ${task.priority === 'Low' ? 'bg-green-500' : task.priority === 'Medium' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
              <span className="capitalize">{task.priority.toLowerCase()}</span>
            </div>
          )}
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map((tag) => (
                <span key={tag} className="bg-surfaceHighlight/30 text-textMain text-xs px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {(task.description || task.codeSnippet) && (
            <div className="flex flex-col gap-2 mt-3">
                  {task.description && (
                    <div className="flex items-start gap-1.5 text-textMuted text-xs">
                      <AlignLeft size={14} className="mt-0.5 shrink-0" />
                      <p className="line-clamp-2 break-words">{task.description}</p>
                    </div>
                  )}
                  
                  {task.codeSnippet && (
                    <div className="mt-2 bg-background/80 rounded-md p-2 border border-white/5">
                      <div className="flex items-center gap-1.5 text-textMuted mb-1 text-xs">
                        <Code size={12} />
                        <span>Snippet</span>
                      </div>
                      <pre className="text-xs text-primaryHover overflow-x-auto whitespace-pre-wrap font-mono">
                        {task.codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card;
