const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'apice_secret_key_2025';

// Database Paths
const TEAM_DATA_PATH = path.join(__dirname, 'data', 'team.json');

// Ensure data exists
fs.ensureFileSync(TEAM_DATA_PATH);
if (fs.readFileSync(TEAM_DATA_PATH).length === 0) {
  fs.writeJsonSync(TEAM_DATA_PATH, []);
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const album = req.body.album || 'general';
    const dest = path.join(__dirname, 'uploads', album);
    fs.ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Admin Credentials
const ADMIN_USER = {
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin123', 10)
};

// --- API ROUTES ---

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER.username && bcrypt.compareSync(password, ADMIN_USER.passwordHash)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// GET Images by album (for non-structured sections)
app.get('/api/images/:album', async (req, res) => {
  const { album } = req.params;
  const albumPath = path.join(__dirname, 'uploads', album);
  try {
    if (!(await fs.pathExists(albumPath))) return res.json([]);
    const files = await fs.readdir(albumPath);
    res.json(files.map(file => `/uploads/${album}/${file}`));
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// GET Team Data
app.get('/api/team', async (req, res) => {
  try {
    const data = await fs.readJson(TEAM_DATA_PATH);
    res.json(data);
  } catch (err) { res.status(500).json([]); }
});

// POST Add Team Member
app.post('/api/team', authenticateToken, upload.single('photo'), async (req, res) => {
  const { name, desc } = req.body;
  const photo = req.file ? `/uploads/equipo/${req.file.filename}` : null;
  
  console.log('--- Intentando guardar integrante ---');
  console.log('Body:', req.body);
  console.log('File:', req.file);

  try {
    const team = await fs.readJson(TEAM_DATA_PATH);
    const newMember = { id: Date.now(), name, desc, photo };
    team.push(newMember);
    await fs.writeJson(TEAM_DATA_PATH, team);
    console.log('Guardado exitoso:', newMember);
    res.json({ success: true, member: newMember });
  } catch (err) { 
    console.error('Error al guardar integrante:', err);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// DELETE Team Member
app.delete('/api/team/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    let team = await fs.readJson(TEAM_DATA_PATH);
    const member = team.find(m => m.id == id);
    if (member && member.photo) {
        await fs.remove(path.join(__dirname, member.photo));
    }
    team = team.filter(m => m.id != id);
    await fs.writeJson(TEAM_DATA_PATH, team);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Generic Upload
app.post('/api/upload', authenticateToken, upload.array('images'), (req, res) => {
  res.json({ success: true });
});

// Generic Delete
app.delete('/api/images', authenticateToken, async (req, res) => {
  const { imageUrl } = req.body;
  try {
    await fs.remove(path.join(__dirname, imageUrl));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.listen(PORT, () => {
  console.log(`Servidor Ápice en http://localhost:${PORT}`);
});
