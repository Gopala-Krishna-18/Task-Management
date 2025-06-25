import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import fetch from 'node-fetch';
import { tasks, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
const tasksRoute = new Hono();
tasksRoute.use('*', clerkMiddleware());
// Middleware to check for user and create if not exists
tasksRoute.use('*', async (c, next) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({ message: 'Unauthorized' }, 401);
    }
    let user = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.userId)
    });
    if (!user) {
        const [newUser] = await db.insert(users).values({
            clerkId: auth.userId,
            // Note: Clerk's session doesn't always have primary email.
            // You might need to fetch it from the Clerk User API if needed.
            email: ''
        }).returning();
        user = newUser;
    }
    c.set('user', user);
    await next();
});
// POST /tasks/generate - Generate tasks using Google Gemini API
// POST /tasks - Create a new task
// GET /tasks - Get all tasks for the user
// PUT /tasks/:id - Update a task
// DELETE /tasks/:id - Delete a task
// PATCH /tasks/:id/complete - Mark task as complete/incomplete
tasksRoute.post('/tasks/generate', async (c) => {
    const user = c.get('user');
    const { topic } = await c.req.json();
    if (!topic || typeof topic !== 'string') {
        return c.json({ message: 'Missing or invalid topic' }, 400);
    }
    const prompt = `Generate a list of 5 concise, actionable tasks to learn about ${topic}. Return only the tasks, no numbering or formatting.`;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_GEMINI_API_KEY is not set');
        return c.json({ message: 'Google Gemini API key not set' }, 500);
    }
    try {
        console.log('Attempting to generate tasks for topic:', topic);
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gemini API request failed with status ${response.status}:`, errorBody);
            return c.json({ message: 'Failed to generate tasks' }, 500);
        }
        const data = await response.json();
        console.log('Gemini API response data:', JSON.stringify(data, null, 2));
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            console.error('Could not extract text from Gemini response.');
        }
        const tasks = text.split('\n').map((t) => t.trim()).filter(Boolean);
        console.log('Generated tasks:', tasks);
        return c.json({ tasks });
    }
    catch (error) {
        console.error('Error calling Gemini API:', error);
        return c.json({ message: 'Failed to generate tasks due to an internal error.' }, 500);
    }
});
// POST /tasks - Create a new task
// Body: { content: string, category?: string }
tasksRoute.post('/tasks', async (c) => {
    const user = c.get('user');
    const { content, category } = await c.req.json();
    if (!content || typeof content !== 'string') {
        return c.json({ message: 'Missing or invalid content' }, 400);
    }
    const result = await db.insert(tasks).values({ userId: user.id, content, category }).returning();
    return c.json({ task: result[0] });
});
// GET /tasks - Get all tasks for the user, with optional ?category= param
tasksRoute.get('/tasks', async (c) => {
    const user = c.get('user');
    const category = c.req.query('category');
    let allTasks;
    if (category) {
        allTasks = await db.select().from(tasks).where(and(eq(tasks.userId, user.id), eq(tasks.category, category)));
    }
    else {
        allTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
    }
    return c.json({ tasks: allTasks });
});
// PUT /tasks/:id - Update a task
// Body: { content?: string, category?: string }
tasksRoute.put('/tasks/:id', async (c) => {
    const user = c.get('user');
    const id = Number(c.req.param('id'));
    const { content, category } = await c.req.json();
    if (!content && !category) {
        return c.json({ message: 'Missing content or category' }, 400);
    }
    const updateObj = {};
    if (content)
        updateObj.content = content;
    if (category)
        updateObj.category = category;
    const updated = await db.update(tasks)
        .set(updateObj)
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning();
    if (!updated[0])
        return c.json({ message: 'Task not found' }, 404);
    return c.json({ task: updated[0] });
});
// DELETE /tasks/:id - Delete a task
tasksRoute.delete('/tasks/:id', async (c) => {
    const user = c.get('user');
    const id = Number(c.req.param('id'));
    const deleted = await db.delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning();
    if (!deleted[0])
        return c.json({ message: 'Task not found' }, 404);
    return c.json({ success: true });
});
// PATCH /tasks/:id/complete - Mark task as complete/incomplete
// Body: { completed: boolean }
tasksRoute.patch('/tasks/:id/complete', async (c) => {
    const user = c.get('user');
    const id = Number(c.req.param('id'));
    const { completed } = await c.req.json();
    if (typeof completed !== 'boolean') {
        return c.json({ message: 'Missing or invalid completed status' }, 400);
    }
    const updated = await db.update(tasks)
        .set({ completed })
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning();
    if (!updated[0])
        return c.json({ message: 'Task not found' }, 404);
    return c.json({ task: updated[0] });
});
// GET /tasks/progress - Get completion progress for the user
tasksRoute.get('/tasks/progress', async (c) => {
    const user = c.get('user');
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return c.json({ total, completed, percent });
});
tasksRoute.delete("/:id", async (c) => {
    const user = c.get("user");
    const taskId = c.req.param("id");
    try {
        await db.delete(tasks).where(and(eq(tasks.id, parseInt(taskId)), eq(tasks.userId, user.id)));
        return c.json({ message: "Task deleted successfully" }, 200);
    }
    catch (error) {
        console.error("Error deleting task:", error);
        return c.json({ error: "Failed to delete task" }, 500);
    }
});
export default tasksRoute;
