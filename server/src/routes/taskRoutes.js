import { Router } from 'express';
import { z } from 'zod';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateStatus,
  updateTask,
} from '../controllers/taskController.js';
import { asyncRoute, validate } from '../middleware/validate.js';

const router = Router();
const dueAtSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => new Date(value).getTime() > Date.now(), {
    message: 'Due date and time must be in the future.',
  });

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  dueAt: dueAtSchema,
  priority: z.enum(['low', 'medium', 'high']).nullable().optional().default(null),
});
const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    dueAt: dueAtSchema.optional(),
    priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
    status: z.enum(['in_progress', 'completed']).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update.');
const statusSchema = z.object({ status: z.enum(['in_progress', 'completed']) });

router.get('/', asyncRoute(listTasks));
router.get('/:id', asyncRoute(getTask));
router.post('/', validate(createSchema), asyncRoute(createTask));
router.patch('/:id', validate(updateSchema), asyncRoute(updateTask));
router.patch('/:id/status', validate(statusSchema), asyncRoute(updateStatus));
router.delete('/:id', asyncRoute(deleteTask));

export default router;
