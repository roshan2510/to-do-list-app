const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Could not reach the API. Check that the server is running.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export function getTasks(query = '') {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  const suffix = params.size ? `?${params.toString()}` : '';
  return request(`/tasks${suffix}`);
}

export function createTask(task) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(task) });
}

export function updateTask(id, task) {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(task) });
}

export function updateTaskStatus(id, status) {
  return request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function removeTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
