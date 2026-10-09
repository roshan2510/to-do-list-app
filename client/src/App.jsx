import { useEffect, useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import './App.css';
import { createTask, getTasks, removeTask, updateTask, updateTaskStatus } from './api/tasks.js';
import TaskForm from './components/TaskForm.jsx';
import TaskRow from './components/TaskRow.jsx';
import { formatTaskDate, getWeekDays, groupTasksByWeek, weekKey } from './utils/dates.js';

const today = new Date();

function TaskDetails({ task, onClose, onEdit }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="task-modal details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Task details</span>
            <h2 id="details-title">{task.title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={19} />
          </button>
        </div>
        <p className="detail-date">
          {formatTaskDate(task.dueAt)} at {format(new Date(task.dueAt), 'h:mm a')}
        </p>
        <div className="detail-status">
          <span className={`status-dot ${task.status === 'completed' ? 'status-done' : ''}`} />
          {task.status === 'completed' ? 'Completed' : 'In progress'}
          {task.priority && (
            <span className={`priority-badge priority-${task.priority}`}>
              <span className="priority-dot" />
              {task.priority} priority
            </span>
          )}
        </div>
        <p className="detail-description">{task.description || 'No description added.'}</p>
        <div className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>
            Close
          </button>
          <button className="button button-primary" type="button" onClick={() => onEdit(task)}>
            Edit task
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onAdd, search = false }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {search ? <Search size={22} /> : <ClipboardList size={22} />}
      </div>
      <h3>{search ? 'No tasks found' : 'A little room to breathe'}</h3>
      <p>
        {search
          ? 'Try another keyword or check the spelling.'
          : 'Add a task and make a plan that feels doable.'}
      </p>
      {!search && (
        <button className="button button-primary" type="button" onClick={onAdd}>
          <Plus size={17} />
          Add your first task
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [onboarding, setOnboarding] = useState(
    () => localStorage.getItem('WorkWell-onboarding-complete') !== 'true',
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedDay, setSelectedDay] = useState(today);
  const [expandedWeek, setExpandedWeek] = useState(weekKey(today));
  const [editingTask, setEditingTask] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError('');
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults(await getTasks(trimmed));
        setSearchError('');
      } catch (searchFailure) {
        setSearchError(searchFailure.message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const groups = useMemo(() => groupTasksByWeek(tasks), [tasks]);
  const weekDays = useMemo(() => getWeekDays(today), []);
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((task) => isSameDay(new Date(task.dueAt), selectedDay))
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)),
    [tasks, selectedDay],
  );
  const currentWeekTasks = tasks.filter((task) => weekKey(task.dueAt) === weekKey(today));
  const completedCount = currentWeekTasks.filter((task) => task.status === 'completed').length;
  const openCount = currentWeekTasks.length - completedCount;
  const progress = currentWeekTasks.length
    ? Math.round((completedCount / currentWeekTasks.length) * 100)
    : 0;
  const isSearching = Boolean(query.trim());

  async function handleSave(payload) {
    setSaving(true);
    try {
      const savedTask = editingTask
        ? await updateTask(editingTask._id, payload)
        : await createTask(payload);
      setTasks((current) =>
        editingTask
          ? current.map((task) => (task._id === savedTask._id ? savedTask : task))
          : [...current, savedTask],
      );
      setExpandedWeek(weekKey(savedTask.dueAt));
      setSelectedDay(new Date(savedTask.dueAt));
      setFormOpen(false);
      setEditingTask(null);
      setNotice(editingTask ? 'Your changes are saved.' : 'Task added to your week.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task) {
    const status = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      const updated = await updateTaskStatus(task._id, status);
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setNotice(
        status === 'completed' ? 'Nice work. Task completed.' : 'Task moved back to in progress.',
      );
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  async function handleDelete(task) {
    try {
      await removeTask(task._id);
      setTasks((current) => current.filter((item) => item._id !== task._id));
      setSearchResults((current) => current.filter((item) => item._id !== task._id));
      setNotice('Task deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function startEdit(task) {
    setViewingTask(null);
    setEditingTask(task || null);
    setFormOpen(true);
  }

  function taskRow(task) {
    return (
      <TaskRow
        key={task._id}
        task={task}
        onToggle={handleToggle}
        onEdit={startEdit}
        onDelete={handleDelete}
        onView={setViewingTask}
      />
    );
  }

  if (onboarding) {
    return (
      <main className="onboarding-page">
        <section className="onboarding-art" aria-label="WorkWell task planner">
          <span className="onboarding-kicker">A CLEARER KIND OF PRODUCTIVITY</span>
          <div className="onboarding-ring" />
          <div className="onboarding-zigzag zigzag-top" />
          <div className="onboarding-zigzag zigzag-bottom" />
          <span className="onboarding-art-label">
            01 <i /> 03
          </span>
        </section>
        <section className="onboarding-copy">
          <a className="brand onboarding-brand" href="#welcome">
            <span className="brand-mark">
              <CheckCheck size={20} strokeWidth={2.4} />
            </span>
            <span>
              WorkWell<span className="brand-period">.</span>
            </span>
          </a>
          <span className="eyebrow">A LITTLE LESS TO CARRY</span>
          <h1>Manage what you need to do.</h1>
          <p>
            A calmer way to plan your week, keep your promises to yourself, and make space for what
            matters.
          </p>
          <button
            className="button button-primary onboarding-button"
            type="button"
            onClick={() => {
              localStorage.setItem('WorkWell-onboarding-complete', 'true');
              setOnboarding(false);
            }}
          >
            Get started <ChevronRight size={17} />
          </button>
          <span className="onboarding-footnote">One task at a time. You've got this.</span>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="WorkWell home">
          <span className="brand-mark">
            <CheckCheck size={20} strokeWidth={2.4} />
          </span>
          <span>
            WorkWell<span className="brand-period">.</span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="topbar-date">{format(today, 'EEEE, MMMM d')}</span>
          <span className="avatar">W</span>
        </div>
      </header>

      <main className="page-content" id="home">
        <section className="welcome-row">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> YOUR SPACE TO FOCUS
            </span>
            <h1>Make room for what matters.</h1>
            <p>Small steps make a good week.</p>
          </div>
          <button
            className="button button-primary add-task-button"
            type="button"
            onClick={() => startEdit(null)}
          >
            <Plus size={18} />
            Add task
          </button>
        </section>

        <section className="overview-grid" aria-label="Task overview">
          <article className="stat-card stat-open">
            <div className="stat-icon">
              <ArrowUpRight size={18} />
            </div>
            <span className="stat-label">In progress</span>
            <strong>{String(openCount).padStart(2, '0')}</strong>
            <span className="stat-foot">tasks due this week</span>
          </article>
          <article className="stat-card stat-completed">
            <div className="stat-icon">
              <Check size={18} />
            </div>
            <span className="stat-label">Completed</span>
            <strong>{String(completedCount).padStart(2, '0')}</strong>
            <span className="stat-foot">this week</span>
          </article>
          <article className="progress-card">
            <div className="progress-top">
              <div>
                <span className="stat-label">Weekly progress</span>
                <strong>
                  {progress}
                  <small>%</small>
                </strong>
              </div>
              <span className="progress-note">
                {currentWeekTasks.length
                  ? `${completedCount} of ${currentWeekTasks.length} tasks done`
                  : 'Your first step starts here'}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Tasks completed this week"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-caption">
              <span>This week</span>
              <span>
                {progress === 100 && currentWeekTasks.length
                  ? 'All caught up'
                  : `${openCount} left to go`}
              </span>
            </div>
          </article>
        </section>

        <section className="date-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR WEEK AT A GLANCE</span>
              <h2>{format(today, 'MMMM yyyy')}</h2>
            </div>
            <span className="week-range">Monday – Sunday</span>
          </div>
          <div className="date-strip">
            {weekDays.map((day) => {
              const active = isSameDay(day, selectedDay);
              const dayCount = tasks.filter((task) => isSameDay(new Date(task.dueAt), day)).length;
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={`date-cell${active ? ' is-active' : ''}${isSameDay(day, today) ? ' is-today' : ''}`}
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={active}
                >
                  <span>{format(day, 'EEE')}</span>
                  <strong>{format(day, 'dd')}</strong>
                  <i className={dayCount ? 'has-tasks' : ''} />
                </button>
              );
            })}
          </div>
        </section>

        <div className="dashboard-columns">
          <section className="panel today-panel">
            <div className="section-heading panel-heading">
              <div>
                <span className="eyebrow">
                  {isSameDay(selectedDay, today) ? 'YOUR NEXT STEPS' : 'SELECTED DAY'}
                </span>
                <h2>
                  {isSameDay(selectedDay, today)
                    ? 'Tasks today'
                    : format(selectedDay, 'EEEE, MMM d')}
                </h2>
              </div>
              <span className="count-pill">
                {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            {error && (
              <div className="inline-error" role="alert">
                <CircleHelp size={16} />
                {error}
                <button type="button" onClick={loadTasks}>
                  Retry
                </button>
              </div>
            )}
            {loading ? (
              <div className="loading-lines">
                <span />
                <span />
                <span />
              </div>
            ) : todayTasks.length ? (
              <div className="task-list">{todayTasks.map(taskRow)}</div>
            ) : (
              <EmptyState onAdd={() => startEdit(null)} />
            )}
          </section>

          <aside className="side-column">
            <section className="search-panel">
              <div className="search-heading">
                <div>
                  <span className="eyebrow">FIND A TASK</span>
                  <h2>Search</h2>
                </div>
                <Search size={19} />
              </div>
              <label className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title or description"
                  aria-label="Search tasks"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </label>
              {isSearching && (
                <div className="search-results">
                  <div className="result-heading">
                    {searching
                      ? 'Searching...'
                      : `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`}
                  </div>
                  {searchError ? (
                    <p className="result-message" role="alert">
                      {searchError}
                    </p>
                  ) : searching ? (
                    <div className="loading-lines compact">
                      <span />
                      <span />
                    </div>
                  ) : searchResults.length ? (
                    searchResults.map(taskRow)
                  ) : (
                    <p className="result-message">No tasks match “{query.trim()}”.</p>
                  )}
                </div>
              )}
              {!isSearching && (
                <p className="search-hint">Search by a task title or a detail you remember.</p>
              )}
            </section>
          </aside>
        </div>

        <section className="weeks-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PLAN AHEAD</span>
              <h2>Your weeks</h2>
            </div>
            <span className="week-range">Monday – Sunday</span>
          </div>
          {loading ? (
            <div className="loading-lines">
              <span />
              <span />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState onAdd={() => startEdit(null)} />
          ) : (
            <div className="week-list">
              {groups.map((group) => {
                const done = group.tasks.filter((task) => task.status === 'completed').length;
                const open = group.tasks.length - done;
                const current = group.key === weekKey(today);
                const expanded = expandedWeek === group.key;
                return (
                  <article className={`week-card${current ? ' current-week' : ''}`} key={group.key}>
                    <button
                      className="week-card-heading"
                      type="button"
                      onClick={() => setExpandedWeek(expanded ? '' : group.key)}
                      aria-expanded={expanded}
                    >
                      <span className="week-toggle">
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <span className="week-name">
                        <strong>
                          {current ? 'This week' : `Week of ${format(group.start, 'MMM d')}`}
                        </strong>
                        <small>
                          {format(group.start, 'MMM d')} – {format(group.end, 'MMM d, yyyy')}
                        </small>
                      </span>
                      <span className="week-counts">
                        <span className="open-count">{open} open</span>
                        <span className="done-count">
                          <Check size={13} />
                          {done} done
                        </span>
                      </span>
                      <span className="week-progress">
                        <i
                          style={{
                            width: `${group.tasks.length ? (done / group.tasks.length) * 100 : 0}%`,
                          }}
                        />
                      </span>
                    </button>
                    {expanded && (
                      <div className="week-tasks">
                        {[...group.tasks]
                          .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
                          .map(taskRow)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="page-footer">
        <span>
          WorkWell<span className="brand-period">.</span> A clearer week, one task at a time.
        </span>
        <span>Made for the things that matter.</span>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      {formOpen && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditingTask(null);
          }}
          saving={saving}
        />
      )}
      {viewingTask && (
        <TaskDetails task={viewingTask} onClose={() => setViewingTask(null)} onEdit={startEdit} />
      )}
      <button
        className="mobile-add"
        type="button"
        onClick={() => startEdit(null)}
        aria-label="Add task"
      >
        <Plus size={23} />
      </button>
    </div>
  );
}
