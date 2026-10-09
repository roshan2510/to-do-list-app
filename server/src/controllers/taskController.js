import mongoose from 'mongoose';
import Task from '../models/Task.js';

function checkId(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Task id is not valid.' });
    return false;
  }
  return true;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listTasks(req, res) {
  const filter = {};
  if (req.query.status && ['in_progress', 'completed'].includes(req.query.status))
    filter.status = req.query.status;
  if (req.query.q) {
    const query = new RegExp(escapeRegex(String(req.query.q).slice(0, 120)), 'i');
    filter.$or = [{ title: query }, { description: query }];
  }
  if (req.query.from || req.query.to) {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return res.status(400).json({ message: 'Date range is not valid.' });
    }
    if (from || to) filter.dueAt = {};
    if (from) filter.dueAt.$gte = from;
    if (to) filter.dueAt.$lte = to;
  }
  const tasks = await Task.find(filter).sort({ dueAt: 1, createdAt: -1 }).lean();
  return res.json(tasks);
}

export async function getTask(req, res) {
  if (!checkId(req.params.id, res)) return;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  return res.json(task);
}

export async function createTask(req, res) {
  const task = await Task.create(req.body);
  return res.status(201).json(task);
}

export async function updateTask(req, res) {
  if (!checkId(req.params.id, res)) return;
  const changes = { ...req.body };
  if (changes.status) changes.completedAt = changes.status === 'completed' ? new Date() : null;
  const task = await Task.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  });
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  return res.json(task);
}

export async function updateStatus(req, res) {
  if (!checkId(req.params.id, res)) return;
  const completed = req.body.status === 'completed';
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      completedAt: completed ? new Date() : null,
    },
    { new: true, runValidators: true },
  );
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  return res.json(task);
}

export async function deleteTask(req, res) {
  if (!checkId(req.params.id, res)) return;
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  return res.status(204).end();
}
