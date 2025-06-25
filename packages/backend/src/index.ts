import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import tasksRoute from './routes/tasks.js'
import { cors } from 'hono/cors'

const app = new Hono()

console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

app.use('*', cors({
  origin: '*', // TEMP: Allow all origins for debugging
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api', tasksRoute)

// Add a global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ message: 'An internal error occurred' }, 500);
});

serve({
  fetch: app.fetch,
  port: 3001,
}, () => {
  console.log('Server running on http://localhost:3001')
})

export default app 