const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'apice_secret_key_2025';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
app.use((req, res, next) => {
  const forbidden = ['server.js', 'package.json', 'package-lock.json', 'data', '.env', '.git'];
  if (forbidden.some(file => req.path.includes(file))) {
    return res.status(403).send('Access Denied');
  }
  next();
});
app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const album = req.body.album || 'general';
    return {
      folder: `apice/${album}`,
      tags: [album],
      resource_type: 'auto'
    };
  },
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

// GET Images by album (using Cloudinary tags)
app.get('/api/images/:album', async (req, res) => {
  const { album } = req.params;
  try {
    const { resources } = await cloudinary.api.resources_by_tag(album, {
      max_results: 100
    });
    res.json(resources.map(file => file.secure_url));
  } catch (error) { 
    console.error('Cloudinary fetch error:', error);
    res.status(500).json({ error: 'Error' }); 
  }
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
  const photo = req.file ? req.file.path : null;
  const public_id = req.file ? req.file.filename : null;
  
  try {
    const team = await fs.readJson(TEAM_DATA_PATH);
    const newMember = { id: Date.now(), name, desc, photo, public_id };
    team.push(newMember);
    await fs.writeJson(TEAM_DATA_PATH, team);
    res.json({ success: true, member: newMember });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// DELETE Team Member
app.delete('/api/team/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    let team = await fs.readJson(TEAM_DATA_PATH);
    const member = team.find(m => m.id == id);
    if (member && member.public_id) {
        await cloudinary.uploader.destroy(member.public_id);
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

// Generic Delete by URL (Helper needed to parse Public ID)
app.delete('/api/images', authenticateToken, async (req, res) => {
  const { imageUrl } = req.body;
  try {
    // Extract public_id from Cloudinary URL (assuming standard format)
    // Format: .../upload/v12345/folder/id.jpg
    const parts = imageUrl.split('/');
    const fileWithExt = parts.pop();
    const id = fileWithExt.split('.')[0];
    const folder = parts.pop();
    const album = parts.pop();
    const publicId = `${album}/${folder}/${id}`; // This depends on your 'folder' config in CloudinaryStorage
    
    // Simpler: Just rely on the tags for listing, but deletion needs public_id.
    // For now, let's just delete by searching the resource first or extracting it better.
    // Actually, req.file.filename in multer-storage-cloudinary IS the public_id.
    
    // We'll use a regex for safety
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    if (match) {
      await cloudinary.uploader.destroy(match[1]);
    }
    res.json({ success: true });
  } catch (error) { 
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error' }); 
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Ápice en http://localhost:${PORT}`);
});
