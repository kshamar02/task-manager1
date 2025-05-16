const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

let tasks = [];

app.use(cors());
app.use(express.json());

// Get all tasks
app.get('/tasks', (req, res) => {
  // Sort tasks by order property before sending
  tasks.sort((a, b) => a.order - b.order);
  res.json(tasks);
});

// Add a new task
app.post('/tasks', (req, res) => {
  const { task, priority, dueDate, category } = req.body;
  const date = new Date();
  const newTask = {
    id: Date.now(),
    task,
    priority,
    timestamp: date.toLocaleString(),
    completed: false,
    dueDate: dueDate || null,
    category: category || 'General',
    order: tasks.length > 0 ? tasks[tasks.length - 1].order + 1 : 0
  };
  tasks.push(newTask);
  res.json({ message: 'Task added!', task: newTask });
});

// Update an existing task (edit text, priority, completed, dueDate, category, order)
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ message: 'Task not found' });

  const updatedFields = req.body;
  tasks[index] = { ...tasks[index], ...updatedFields };
  res.json({ message: 'Task updated!', task: tasks[index] });
});

// Delete a task by id
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.json({ message: 'Task deleted!' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
