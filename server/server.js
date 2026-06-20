const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

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

// Read local database
async function readDb() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const response = await fetch(process.env.KV_REST_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'timeblock_db'])
      });
      const data = await response.json();
      if (data && data.result) {
        return JSON.parse(data.result);
      }
    } catch (error) {
      console.error("Error reading from Vercel KV, falling back to local file:", error);
    }
  }

  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, resetting:", error);
    return { users: [], tasks: [] };
  }
}

// Write local database
async function writeDb(data) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      await fetch(process.env.KV_REST_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'timeblock_db', JSON.stringify(data)])
      });
      return;
    } catch (error) {
      console.error("Error writing to Vercel KV, writing to local file instead:", error);
    }
  }

  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// MongoDB Connection Helper
let mongoDb = null;
const MONGODB_URI = process.env.MONGODB_URI;

async function getDb() {
  if (mongoDb) return mongoDb;
  if (!MONGODB_URI) return null;
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    mongoDb = client.db('timeblock');
    console.log("Connected to MongoDB successfully");
    return mongoDb;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return null;
  }
}

// Ensure local database is initialized at start (fallback)
initDb();

app.get('/api/db-status', async (req, res) => {
  const uriExists = !!process.env.MONGODB_URI;
  let connected = false;
  let connectionError = null;
  let dbType = 'local-file';

  if (uriExists) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const testDb = client.db('timeblock');
      await testDb.command({ ping: 1 });
      connected = true;
      dbType = 'mongodb';
      await client.close();
    } catch (err) {
      connectionError = err.message || String(err);
    }
  }

  res.json({
    dbType,
    envUriExists: uriExists,
    connected,
    connectionError,
    vercelEnv: !!process.env.VERCEL,
    kvEnv: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  });
});

// --- Auth Endpoints ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = await getDb();
  if (db) {
    try {
      const usersCol = db.collection('users');
      const existingUser = await usersCol.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        password // Stored in plain text for local sandbox inspection
      };

      await usersCol.insertOne(newUser);
      return res.json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      console.error("MongoDB signup error:", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Fallback to local files
  const localDb = await readDb();
  const existingUser = localDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password
  };
  localDb.users.push(newUser);
  await writeDb(localDb);

  res.json({ id: newUser.id, username: newUser.username });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = await getDb();
  if (db) {
    try {
      const usersCol = db.collection('users');
      const user = await usersCol.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        password: password
      });
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      return res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("MongoDB login error:", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Fallback to local files
  const localDb = await readDb();
  const user = localDb.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  res.json({ id: user.id, username: user.username });
});


// --- Task Endpoints ---

// Get tasks for a user
app.get('/api/tasks', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const db = await getDb();
  if (db) {
    try {
      const tasksCol = db.collection('tasks');
      const userTasks = await tasksCol.find({ userId: userId }).toArray();
      return res.json(userTasks);
    } catch (error) {
      console.error("MongoDB get tasks error:", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Fallback to local files
  const localDb = await readDb();
  const userTasks = localDb.tasks.filter(t => t.userId === userId);
  res.json(userTasks);
});

// Add or update task
app.post('/api/tasks', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const { id, title, description, timeBlock, duration, priority, date, completed } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const taskData = {
    id: id || Date.now().toString(),
    userId,
    title,
    description: description || '',
    timeBlock: timeBlock || '09:00',
    duration: duration ? Number(duration) : 1,
    priority: priority || 'medium',
    date: date || new Date().toISOString().split('T')[0],
    completed: completed !== undefined ? completed : false
  };

  const db = await getDb();
  if (db) {
    try {
      const tasksCol = db.collection('tasks');
      await tasksCol.updateOne(
        { id: taskData.id, userId: userId },
        { $set: taskData },
        { upsert: true }
      );
      return res.json(taskData);
    } catch (error) {
      console.error("MongoDB save task error:", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Fallback to local files
  const localDb = await readDb();
  let taskIndex = -1;
  if (id) {
    taskIndex = localDb.tasks.findIndex(t => t.id === id && t.userId === userId);
  }

  if (taskIndex > -1) {
    localDb.tasks[taskIndex] = taskData;
  } else {
    localDb.tasks.push(taskData);
  }

  await writeDb(localDb);
  res.json(taskData);
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  const userId = req.headers['user-id'];
  const taskId = req.params.id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID header is required' });
  }

  const db = await getDb();
  if (db) {
    try {
      const tasksCol = db.collection('tasks');
      const result = await tasksCol.deleteOne({ id: taskId, userId: userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
      }
      return res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error("MongoDB delete task error:", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Fallback to local files
  const localDb = await readDb();
  const initialLength = localDb.tasks.length;
  localDb.tasks = localDb.tasks.filter(t => !(t.id === taskId && t.userId === userId));

  if (localDb.tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found or unauthorized' });
  }

  await writeDb(localDb);
  res.json({ message: 'Task deleted successfully' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Local TimeBlock API server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
