import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import app from './app.js';

let server;
let apiUrl;

test.before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  apiUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  if (server?.listening)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

test('health endpoint reports the API is available', async () => {
  const response = await fetch(`${apiUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('invalid task input returns a validation error without using the database', async () => {
  const response = await fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '' }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.message, 'Please check the task details.');
  assert.ok(body.errors.length > 0);
});

test('creating a task with a past due date is rejected', async () => {
  const response = await fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Past task',
      dueAt: new Date(Date.now() - 60_000).toISOString(),
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.ok(
    body.errors.some((error) => error.message === 'Due date and time must be in the future.'),
  );
});

test('updating a task to a past due date is rejected', async () => {
  const response = await fetch(`${apiUrl}/tasks/507f1f77bcf86cd799439011`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Updated task',
      dueAt: new Date(Date.now() - 60_000).toISOString(),
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.ok(
    body.errors.some((error) => error.message === 'Due date and time must be in the future.'),
  );
});

test('malformed task IDs return 400', async () => {
  const response = await fetch(`${apiUrl}/tasks/not-an-id`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Task id is not valid.' });
});
