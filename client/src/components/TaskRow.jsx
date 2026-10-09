import { useRef, useState } from 'react';
import { Check, Eye, Pencil, Trash2 } from 'lucide-react';
import { formatTaskDate, formatTaskTime } from '../utils/dates.js';
import './TaskRow.css';

export default function TaskRow({ task, onToggle, onEdit, onDelete, onView }) {
  const startX = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const completed = task.status === 'completed';

  function handlePointerDown(event) {
    if (event.pointerType === 'touch') startX.current = event.clientX;
  }

  function handlePointerUp(event) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    if (distance < -48) setRevealed(true);
    if (distance > 35) setRevealed(false);
    startX.current = null;
  }

  return (
    <div
      className={`task-swipe-wrap${revealed ? ' is-revealed' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        startX.current = null;
      }}
    >
      <button
        className="swipe-delete"
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 size={17} />
        <span>Delete</span>
      </button>
      <article className="task-row">
        <button
          className={`task-check${completed ? ' checked' : ''}`}
          type="button"
          onClick={() => onToggle(task)}
          aria-label={completed ? `Mark ${task.title} in progress` : `Mark ${task.title} completed`}
          aria-pressed={completed}
        >
          {completed && <Check size={16} strokeWidth={2.5} />}
        </button>
        <button className="task-copy" type="button" onClick={() => onView(task)}>
          <span className={`task-title${completed ? ' is-complete' : ''}`}>{task.title}</span>
          <span className="task-subline">
            <span>
              {formatTaskDate(task.dueAt)} · {formatTaskTime(task.dueAt)}
            </span>
            {task.priority && (
              <span className={`priority-badge priority-${task.priority}`}>
                <span className="priority-dot" />
                {task.priority}
              </span>
            )}
          </span>
        </button>
        <div className="task-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => onView(task)}
            aria-label={`View ${task.title}`}
            title="View"
          >
            <Eye size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            title="Edit"
          >
            <Pencil size={17} />
          </button>
          <button
            className="icon-button delete-icon"
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Delete ${task.title}`}
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </article>
    </div>
  );
}
