import express from 'express';
import path from 'path';
import fs from 'fs';
import { db } from './server/db.js';

// Since node runs with ESM, import.meta.url is available, but process.cwd() is perfect.
const app = express();
const PORT = 3000;

// Set up body parsers with limits for base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists safely (handling read-only filesystems on Vercel)
let UPLOADS_DIR = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err: any) {
  console.warn("Failed to create UPLOADS_DIR in process.cwd(), falling back to /tmp/uploads:", err.message);
  UPLOADS_DIR = '/tmp/uploads';
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (tmpErr: any) {
    console.error("Failed to create /tmp/uploads:", tmpErr.message);
  }
}

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple Captcha In-Memory Store
// Keys are challengeId, values are the math answer (string)
const captchaStore = new Map<string, string>();

// Simple IP Rate Limiting In-Memory Store
// Keys are IP addresses, values are timestamps of last vote
const ipRateLimitStore = new Map<string, number>();

// Admin auth tokens store
const ADMIN_EMAIL = "admin@ringintunggal.desa.id";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "desa2026";
const ADMIN_TOKEN = "token_ringintunggal_admin_secure_2026";

// Auth middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: "Sesi tidak valid atau telah berakhir. Silakan login kembali." });
  }
}

// ==========================================
// API ROUTES (Must go BEFORE Vite Middleware)
// ==========================================

// 1. Get captcha challenge
app.get('/api/captcha', (req, res) => {
  const challengeId = 'cap_' + Math.random().toString(36).substr(2, 9);
  
  // Create random simple math question
  const num1 = Math.floor(Math.random() * 9) + 1; // 1 to 9
  const num2 = Math.floor(Math.random() * 9) + 1; // 1 to 9
  const isAdd = Math.random() > 0.5;
  
  let question = "";
  let answer = 0;
  
  if (isAdd) {
    question = `${num1} + ${num2} = ?`;
    answer = num1 + num2;
  } else {
    // ensure positive result
    const max = Math.max(num1, num2);
    const min = Math.min(num1, num2);
    question = `${max} - ${min} = ?`;
    answer = max - min;
  }
  
  captchaStore.set(challengeId, String(answer));
  
  // Clean up old captchas after 5 minutes
  setTimeout(() => {
    captchaStore.delete(challengeId);
  }, 5 * 60 * 1000);

  res.json({ challengeId, question });
});

// 2. Public API - List all programs
app.get('/api/programs', async (req, res) => {
  try {
    const programs = await db.getPrograms();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar program" });
  }
});

// 3. Public API - Detail program by slug
app.get('/api/programs/:slug', async (req, res) => {
  try {
    const program = await db.getProgramBySlug(req.params.slug);
    if (!program) {
      return res.status(404).json({ error: "Program tidak ditemukan" });
    }
    const votes = await db.getVotes(program.id);
    res.json({ program, votes });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil detail program" });
  }
});

// 4. Public API - Vote support
app.post('/api/programs/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { voterName, voterRt, captchaId, captchaAnswer } = req.body;
    
    // Get voter IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    // 1. Basic validation
    if (!voterName || !voterRt || !captchaId || !captchaAnswer) {
      return res.status(400).json({ error: "Semua kolom wajib diisi." });
    }
    
    // 2. Captcha verification
    const correctAnswer = captchaStore.get(captchaId);
    if (!correctAnswer) {
      return res.status(400).json({ error: "Captcha sudah kedaluwarsa. Silakan muat ulang captcha." });
    }
    
    if (captchaAnswer.trim() !== correctAnswer) {
      return res.status(400).json({ error: "Jawaban captcha salah. Silakan coba lagi." });
    }
    
    // Consume captcha
    captchaStore.delete(captchaId);
    
    // 3. Rate Limit by IP (10 seconds)
    const lastVoteTime = ipRateLimitStore.get(ip);
    const now = Date.now();
    if (lastVoteTime && (now - lastVoteTime) < 10000) {
      const remaining = Math.ceil((10000 - (now - lastVoteTime)) / 1000);
      return res.status(429).json({ error: `Tunggu ${remaining} detik lagi sebelum memberikan dukungan kembali.` });
    }
    
    // 4. Record vote in DB (handles unique constraint check internally)
    const result = await db.addVote(id, voterName, voterRt, ip);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    // Update rate limit timestamp
    ipRateLimitStore.set(ip, now);
    
    res.json({ success: true, message: result.message, vote: result.vote });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Gagal mengirimkan dukungan" });
  }
});

// 5. Admin Auth - Login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: "Email atau Password admin salah." });
  }
});

// 6. Admin API - Create program
app.post('/api/admin/programs', requireAdmin, async (req, res) => {
  try {
    const { title, description, short_description, location, image_url, status } = req.body;
    
    if (!title || !description || !short_description || !location || !image_url || !status) {
      return res.status(400).json({ error: "Semua kolom wajib diisi." });
    }
    
    // Generate unique slug
    let baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    let slug = baseSlug;
    let count = 1;
    while (await db.getProgramBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    
    const program = await db.createProgram({
      title,
      slug,
      description,
      short_description: short_description.substr(0, 150),
      location,
      image_url,
      status
    });
    
    res.json({ success: true, program });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat program baru" });
  }
});

// 7. Admin API - Update program
app.put('/api/admin/programs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, short_description, location, image_url, status } = req.body;
    
    const updates: any = {};
    if (title) {
      updates.title = title;
      // Also update slug if title changes
      let baseSlug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      let slug = baseSlug;
      let count = 1;
      const existing = await db.getProgramBySlug(slug);
      if (existing && existing.id !== id) {
        while (await db.getProgramBySlug(slug)) {
          slug = `${baseSlug}-${count}`;
          count++;
        }
      }
      updates.slug = slug;
    }
    if (description) updates.description = description;
    if (short_description) updates.short_description = short_description.substr(0, 150);
    if (location) updates.location = location;
    if (image_url) updates.image_url = image_url;
    if (status) updates.status = status;
    
    const updated = await db.updateProgram(id, updates);
    if (!updated) {
      return res.status(404).json({ error: "Program tidak ditemukan" });
    }
    
    res.json({ success: true, program: updated });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui program" });
  }
});

// 8. Admin API - Delete program
app.delete('/api/admin/programs/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteProgram(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Program tidak ditemukan" });
    }
    res.json({ success: true, message: "Program berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus program" });
  }
});

// 9. Admin API - Upload image (base64)
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  try {
    const { image, fileName } = req.body;
    
    if (!image || !fileName) {
      return res.status(400).json({ error: "Data gambar tidak lengkap" });
    }
    
    // Extract base64 format and raw data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Format gambar tidak valid" });
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Make safe unique filename
    const ext = path.extname(fileName) || '.png';
    const cleanName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${cleanName}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    
    fs.writeFileSync(filePath, buffer);
    
    // Return relative URL path
    res.json({ url: `/uploads/${uniqueFileName}` });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengunggah gambar" });
  }
});

// 10. Admin API - Get Stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat statistik" });
  }
});

// 11. Admin API - Get All Votes (Support list with searching & filtering)
app.get('/api/admin/votes', requireAdmin, async (req, res) => {
  try {
    const { search, rt, programId } = req.query;
    let votes = await db.getVotes(programId as string);
    
    if (search) {
      const q = (search as string).toLowerCase();
      votes = votes.filter(v => v.voter_name.toLowerCase().includes(q));
    }
    
    if (rt && rt !== "Semua") {
      votes = votes.filter(v => v.voter_rt === rt);
    }
    
    // Enrich votes with program details
    const enrichedVotes = await Promise.all(votes.map(async (v) => {
      const prog = await db.getProgramById(v.program_id);
      return {
        ...v,
        program_title: prog ? prog.title : "Program Dihapus"
      };
    }));
    
    res.json(enrichedVotes);
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat daftar pendukung" });
  }
});

// 12. Admin API - Delete vote (Spam removal)
app.delete('/api/admin/votes/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteVote(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Dukungan tidak ditemukan" });
    }
    res.json({ success: true, message: "Dukungan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus dukungan" });
  }
});

// ==========================================
// VITE MIDDLEWARE & FRONTEND SERVING
// ==========================================

export { app };

async function startServer() {
  // If running on Vercel, we don't start the standalone express server or Vite dev server
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SUARA WARGA DESA] Server running on http://localhost:${PORT}`);
  });
}

startServer();
