import { useState } from 'react';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { toDateTimeLocal } from '../utils/dates.js';
import './TaskForm.css';

const initialDueAt = () => {
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  return toDateTimeLocal(nextHour);
};

const earliestDueAt = () => {
  const nextMinute = new Date();
  nextMinute.setMinutes(nextMinute.getMinutes() + 1, 0, 0);
  return toDateTimeLocal(nextMinute);
};

export default function TaskForm({ task, onSave, onClose, saving }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueAt, setDueAt] = useState(task ? toDateTimeLocal(task.dueAt) : initialDueAt());
  const [priority, setPriority] = useState(task?.priority || '');
  const [error, setError] = useState('');
  const unchangedOverdueTask = task && new Date(task.dueAt) < new Date();
  const minDueAt = unchangedOverdueTask ? undefined : earliestDueAt();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Add a task title to continue.');
      return;
    }
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
      setError('Choose a valid date and time.');
      return;
    }
    const dueAtChanged = !task || dueAt !== toDateTimeLocal(task.dueAt);
    if (dueAtChanged && new Date(dueAt) <= new Date()) {
      setError('Choose a date and time in the future.');
      return;
    }

    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority: priority || null,
      };
      if (dueAtChanged) payload.dueAt = new Date(dueAt).toISOString();
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">A little progress goes a long way</span>
            <h2 id="task-form-title">{task ? 'Edit task' : 'Add a new task'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="task-title">
            Task title <span>Required</span>
          </label>
          <input
            autoFocus
            id="task-title"
            className="text-field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="What needs to get done?"
            required
          />

          <label className="field-label" htmlFor="task-due">
            Date and time <span>Required</span>
          </label>
          <div className="input-with-icon">
            <CalendarDays size={17} aria-hidden="true" />
            <input
              id="task-due"
              className="text-field"
              type="datetime-local"
              value={dueAt}
              min={minDueAt}
              onChange={(event) => setDueAt(event.target.value)}
              required
            />
          </div>

          <label className="field-label" htmlFor="task-description">
            Description <span>Optional</span>
          </label>
          <textarea
            id="task-description"
            className="text-field description-field"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            placeholder="Add a few helpful details..."
            rows={3}
          />

          <fieldset className="priority-field">
            <legend className="field-label">
              Priority <span>Optional</span>
            </legend>
            <div className="priority-options">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  className={`priority-option priority-${level}${priority === level ? ' is-selected' : ''}`}
                  type="button"
                  key={level}
                  aria-pressed={priority === level}
                  onClick={() => setPriority(priority === level ? '' : level)}
                >
                  <span className="priority-dot" />
                  {level}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={saving}>
              <Clock3 size={16} />
              {saving ? 'Saving...' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
