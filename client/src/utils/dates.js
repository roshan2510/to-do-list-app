import { addDays, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';

export function weekKey(date) {
  return format(startOfWeek(new Date(date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function groupTasksByWeek(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    const start = startOfWeek(new Date(task.dueAt), { weekStartsOn: 1 });
    const key = format(start, 'yyyy-MM-dd');
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        start,
        end: endOfWeek(start, { weekStartsOn: 1 }),
        tasks: [],
      });
    }
    groups.get(key).tasks.push(task);
  }

  return [...groups.values()].sort((left, right) => left.start - right.start);
}

export function getWeekDays(date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function isSameLocalDay(left, right) {
  return isSameDay(new Date(left), new Date(right));
}

export function toDateTimeLocal(value) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function formatTaskDate(value) {
  return format(new Date(value), 'EEE, MMM d');
}

export function formatTaskTime(value) {
  return format(new Date(value), 'h:mm a');
}
