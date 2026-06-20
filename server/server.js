const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initialize database file and folder if not present
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], tasks: [] }, null, 2));
  }
}

// Read database
function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, resetting:", error);
    return { users: [], tasks: [] };
  }
}

// Write database
function writeDb(data) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Ensure database is initialized at start
initDb();

// --- Auth Endpoints ---

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = readDb();
  const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password // Stored in plain text since this is a local sandbox app, making inspection easier
  };

  db.users.push(newUser);
  writeDb(db);

  res.json({ id: newUser.id, username: newUser.username });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = readDb();
  const user = db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  res.json({ id: user.id, username: user.username });
});


// --- Task Endpoints ---

// Get tasks for a user
app.get('/api/tasks', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const db = readDb();
  const userTasks = db.tasks.filter(t => t.userId === userId);
  res.json(userTasks);
});

// Add or update task
app.post('/api/tasks', (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const { id, title, description, timeBlock, priority, date, completed } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const db = readDb();
  let taskIndex = -1;

  if (id) {
    taskIndex = db.tasks.findIndex(t => t.id === id && t.userId === userId);
  }

  const taskData = {
    id: id || Date.now().toString(),
    userId,
    title,
    description: description || '',
    timeBlock: timeBlock || '09:00', // Format: "HH:MM"
    priority: priority || 'medium', // 'high' | 'medium' | 'low'
    date: date || new Date().toISOString().split('T')[0], // YYYY-MM-DD
    completed: completed !== undefined ? completed : false
  };

  if (taskIndex > -1) {
    db.tasks[taskIndex] = taskData;
  } else {
    db.tasks.push(taskData);
  }

  writeDb(db);
  res.json(taskData);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const userId = req.headers['user-id'];
  const taskId = req.params.id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const db = readDb();
  const initialLength = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === taskId && t.userId === userId));

  if (db.tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found or unauthorized' });
  }

  writeDb(db);
  res.json({ message: 'Task deleted successfully' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Local TimeBlock API server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
