import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  location: string;
  image_url: string;
  votes_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  program_id: string;
  voter_name: string;
  voter_rt: string;
  ip_address: string;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Check if we have Supabase Postgres configuration
let usePostgres = !!process.env.DATABASE_URL;
let pool: pg.Pool | null = null;
let initPromise: Promise<void> | null = null;

if (usePostgres) {
  try {
    console.log("[DATABASE] Database URL detected. Initializing Supabase PostgreSQL Connection Pool...");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (err) => {
      console.error("[DATABASE] Unexpected error on idle PostgreSQL client:", err);
    });
  } catch (err) {
    console.error("[DATABASE] Failed to create PostgreSQL pool, falling back to local database:", err);
    usePostgres = false;
    pool = null;
  }
}

// Function to ensure DB is initialized before any queries are run
async function ensureDbInitialized() {
  if (usePostgres && pool) {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await initPostgresDb();
        } catch (err: any) {
          console.error("[DATABASE] Error in lazy initPostgresDb:", err.message);
        }
      })();
    }
    await initPromise;
  } else {
    initLocalDb();
  }
}

// -------------------------------------------------------------
// POSTGRES DB SCHEMAS AND DATA SEEDING
// -------------------------------------------------------------
async function initPostgresDb() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    console.log("[DATABASE] Creating PostgreSQL tables if they do not exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        short_description TEXT NOT NULL,
        location TEXT NOT NULL,
        image_url TEXT NOT NULL,
        votes_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        program_id TEXT REFERENCES programs(id) ON DELETE CASCADE,
        voter_name TEXT NOT NULL,
        voter_rt TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(program_id, voter_name, voter_rt)
      );
    `);

    // Seed if empty
    const checkRes = await client.query('SELECT COUNT(*) FROM programs');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0) {
      console.log("[DATABASE] Supabase tables are empty. Seeding initial development datasets...");
      
      const initialPrograms = [
        {
          id: "p1",
          title: "Perbaikan Jalan RT 03",
          slug: "perbaikan-jalan-rt-03",
          description: "Jalan lingkungan di wilayah RT 03 merupakan akses vital bagi warga untuk aktivitas sehari-hari dan sekolah anak-anak. Saat ini kondisi jalan berupa tanah dan batu pecah yang sebagian besar sudah terkikis, sehingga sangat licin dan tergenang air saat musim hujan. Program ini mengusulkan pengerasan jalan menggunakan paving block berkualitas tinggi sepanjang 150 meter dengan lebar 3 meter, lengkap dengan pembangunan saluran drainase di sisi kanan dan kiri jalan agar air tidak meluap ke halaman rumah warga.",
          short_description: "Paving jalan sepanjang 150 meter yang mengalami kerusakan parah dan membahayakan warga saat musim hujan.",
          location: "RT 03 RW 01, Dusun Krajan",
          image_url: "https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&q=80&w=800",
          votes_count: 32,
          status: "Prioritas Tinggi"
        },
        {
          id: "p2",
          title: "Pembangunan Jembatan Tani Dusun Selatan",
          slug: "pembangunan-jembatan-tani-dusun-selatan",
          description: "Akses jalan usaha tani menuju persawahan Dusun Selatan saat ini terhambat oleh sungai kecil selebar 4 meter. Selama ini warga terpaksa menggunakan jembatan jembatan bambu sementara yang sangat rawan ambruk jika dilewati kendaraan bermotor atau saat debit air sungai naik. Pembangunan jembatan beton permanen dengan fondasi cakar ayam akan memudahkan lalu lintas kendaraan roda tiga dan traktor pengangkut hasil pertanian, serta meningkatkan efisiensi waktu panen warga.",
          short_description: "Pembangunan jembatan beton penghubung area persawahan Dusun Selatan untuk memudahkan transportasi hasil panen.",
          location: "Dusun Selatan, Area Persawahan Blok B",
          image_url: "https://images.unsplash.com/photo-1513828583845-9be990023ee7?auto=format&fit=crop&q=80&w=800",
          votes_count: 24,
          status: "Baru Dibuka"
        },
        {
          id: "p3",
          title: "Revitalisasi Posyandu RT 05",
          slug: "revitalisasi-posyandu-rt-05",
          description: "Gedung Posyandu RT 05 yang melayani pemeriksaan kesehatan balita dan lansia saat ini mengalami kerusakan fisik sedang, seperti atap bocor di beberapa titik dan tembok yang retak-retak. Revitalisasi ini meliputi perbaikan atap, plesteran dinding, pengecatan ulang dengan warna cerah ramah anak, pembuatan ruang laktasi/menyusui yang nyaman, serta pengadaan meja kursi pelayanan, timbangan digital bayi, dan alat ukur tinggi badan yang modern.",
          location: "RT 05 RW 02, Dusun Krajan Tengah",
          short_description: "Perbaikan fasilitas fisik Posyandu untuk meningkatkan kenyamanan pelayanan kesehatan ibu, balita, dan lansia.",
          image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800",
          votes_count: 15,
          status: "Dalam Perencanaan"
        },
        {
          id: "p4",
          title: "Penerangan Jalan Desa Jalur Utama",
          slug: "penerangan-jalan-desa-jalur-utama",
          description: "Jalan utama masuk desa sepanjang kurang lebih 1 kilometer saat ini belum memiliki fasilitas penerangan jalan yang memadai. Kondisi ini menyebabkan jalan menjadi sangat gelap gulita di malam hari, sehingga rawan memicu kecelakaan berkendara dan tindakan kriminalitas. Program ini mengusulkan pengadaan dan pemasangan 15 titik lampu penerangan jalan umum bertenaga surya (solar cell) otomatis yang hemat energi dan ramah lingkungan.",
          short_description: "Pemasangan 15 titik lampu jalan bertenaga surya sepanjang jalur transportasi utama masuk desa.",
          location: "Jalan Utama Desa Ringintunggal",
          image_url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800",
          votes_count: 41,
          status: "Menunggu Anggaran"
        },
        {
          id: "p5",
          title: "Penyediaan Air Bersih Dusun Utara",
          slug: "penyediaan-air-bersih-dusun-utara",
          description: "Wilayah Dusun Utara (RT 08 dan RT 09) selalu mengalami krisis air bersih setiap kali musim kemarau tiba karena sumur-sumur galian warga mengering. Untuk solusi jangka panjang, program ini mengusulkan pembuatan sumur bor dalam (artesis) sedalam 60 meter, pembangunan bak penampung air utama (tandon) berkapasitas 5.000 liter, serta pemasangan pipa distribusi sepanjang 800 meter menuju 50 rumah tangga yang paling terdampak kekeringan.",
          short_description: "Pembangunan sumur bor dalam dan jaringan pipa distribusi air bersih ke 50 rumah warga terdampak kekeringan.",
          location: "Dusun Utara, RT 08 & RT 09",
          image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
          votes_count: 52,
          status: "Sedang Dikerjakan"
        }
      ];

      for (const p of initialPrograms) {
        await client.query(`
          INSERT INTO programs (id, title, slug, description, short_description, location, image_url, votes_count, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [p.id, p.title, p.slug, p.description, p.short_description, p.location, p.image_url, p.votes_count, p.status]);
      }

      const initialVotes = [
        { id: "v1", program_id: "p1", voter_name: "Ahmad", voter_rt: "RT 01", ip_address: "127.0.0.1", created_at: "2026-06-02T10:00:00.000Z" },
        { id: "v2", program_id: "p1", voter_name: "Budi Santoso", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-02T11:20:00.000Z" },
        { id: "v3", program_id: "p1", voter_name: "Siti Aminah", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-03T09:15:00.000Z" },
        { id: "v4", program_id: "p1", voter_name: "Eko Prasetyo", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-04T15:30:00.000Z" },
        { id: "v5", program_id: "p1", voter_name: "Dewi Lestari", voter_rt: "RT 02", ip_address: "127.0.0.1", created_at: "2026-06-05T08:45:00.000Z" },
        { id: "v6", program_id: "p2", voter_name: "Sugeng", voter_rt: "RT 06", ip_address: "127.0.0.1", created_at: "2026-06-11T14:10:00.000Z" },
        { id: "v7", program_id: "p2", voter_name: "Joko", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-12T16:22:00.000Z" },
        { id: "v8", program_id: "p2", voter_name: "Hartono", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-13T11:05:00.000Z" },
        { id: "v9", program_id: "p5", voter_name: "Warto", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-16T10:00:00.000Z" },
        { id: "v10", program_id: "p5", voter_name: "Sumiati", voter_rt: "RT 09", ip_address: "127.0.0.1", created_at: "2026-05-17T09:30:00.000Z" },
        { id: "v11", program_id: "p5", voter_name: "Supardi", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-18T14:15:00.000Z" }
      ];

      for (const v of initialVotes) {
        await client.query(`
          INSERT INTO votes (id, program_id, voter_name, voter_rt, ip_address, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [v.id, v.program_id, v.voter_name, v.voter_rt, v.ip_address, v.created_at]);
      }

      console.log("[DATABASE] Seed complete!");
    }
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// LOCAL JSON DB BACKEND (FALLBACK)
// -------------------------------------------------------------
function initLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialPrograms: Program[] = [
      {
        id: "p1",
        title: "Perbaikan Jalan RT 03",
        slug: "perbaikan-jalan-rt-03",
        description: "Jalan lingkungan di wilayah RT 03 merupakan akses vital bagi warga untuk aktivitas sehari-hari dan sekolah anak-anak. Saat ini kondisi jalan berupa tanah dan batu pecah yang sebagian besar sudah terkikis, sehingga sangat licin dan tergenang air saat musim hujan. Program ini mengusulkan pengerasan jalan menggunakan paving block berkualitas tinggi sepanjang 150 meter dengan lebar 3 meter, lengkap dengan pembangunan saluran drainase di sisi kanan dan kiri jalan agar air tidak meluap ke halaman rumah warga.",
        short_description: "Paving jalan sepanjang 150 meter yang mengalami kerusakan parah dan membahayakan warga saat musim hujan.",
        location: "RT 03 RW 01, Dusun Krajan",
        image_url: "https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&q=80&w=800",
        votes_count: 32,
        status: "Prioritas Tinggi",
        created_at: "2026-06-01T08:00:00.000Z",
        updated_at: "2026-06-01T08:00:00.000Z"
      },
      {
        id: "p2",
        title: "Pembangunan Jembatan Tani Dusun Selatan",
        slug: "pembangunan-jembatan-tani-dusun-selatan",
        description: "Akses jalan usaha tani menuju persawahan Dusun Selatan saat ini terhambat oleh sungai kecil selebar 4 meter. Selama ini warga terpaksa menggunakan jembatan bambu sementara yang sangat rawan ambruk jika dilewati kendaraan bermotor atau saat debit air sungai naik. Pembangunan jembatan beton permanen dengan fondasi cakar ayam akan memudahkan lalu lintas kendaraan roda tiga dan traktor pengangkut hasil pertanian, serta meningkatkan efisiensi waktu panen warga.",
        short_description: "Pembangunan jembatan beton penghubung area persawahan Dusun Selatan untuk memudahkan transportasi hasil panen.",
        location: "Dusun Selatan, Area Persawahan Blok B",
        image_url: "https://images.unsplash.com/photo-1513828583845-9be990023ee7?auto=format&fit=crop&q=80&w=800",
        votes_count: 24,
        status: "Baru Dibuka",
        created_at: "2026-06-10T10:30:00.000Z",
        updated_at: "2026-06-10T10:30:00.000Z"
      },
      {
        id: "p3",
        title: "Revitalisasi Posyandu RT 05",
        slug: "revitalisasi-posyandu-rt-05",
        description: "Gedung Posyandu RT 05 yang melayani pemeriksaan kesehatan balita dan lansia saat ini mengalami kerusakan fisik sedang, seperti atap bocor di beberapa titik dan tembok yang retak-retak. Revitalisasi ini meliputi perbaikan atap, plesteran dinding, pengecatan ulang dengan warna cerah ramah anak, pembuatan ruang laktasi/menyusui yang nyaman, serta pengadaan meja kursi pelayanan, timbangan digital bayi, dan alat ukur tinggi badan yang modern.",
        location: "RT 05 RW 02, Dusun Krajan Tengah",
        short_description: "Perbaikan fasilitas fisik Posyandu untuk meningkatkan kenyamanan pelayanan kesehatan ibu, balita, dan lansia.",
        image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800",
        votes_count: 15,
        status: "Dalam Perencanaan",
        created_at: "2026-06-15T09:15:00.000Z",
        updated_at: "2026-06-15T09:15:00.000Z"
      },
      {
        id: "p4",
        title: "Penerangan Jalan Desa Jalur Utama",
        slug: "penerangan-jalan-desa-jalur-utama",
        description: "Jalan utama masuk desa sepanjang kurang lebih 1 kilometer saat ini belum memiliki fasilitas penerangan jalan yang memadai. Kondisi ini menyebabkan jalan menjadi sangat gelap gulita di malam hari, sehingga rawan memicu kecelakaan berkendara dan tindakan kriminalitas. Program ini mengusulkan pengadaan dan pemasangan 15 titik lampu penerangan jalan umum bertenaga surya (solar cell) otomatis yang hemat energi dan ramah lingkungan.",
        short_description: "Pemasangan 15 titik lampu jalan bertenaga surya sepanjang jalur transportasi utama masuk desa.",
        location: "Jalan Utama Desa Ringintunggal",
        image_url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800",
        votes_count: 41,
        status: "Menunggu Anggaran",
        created_at: "2026-05-20T14:20:00.000Z",
        updated_at: "2026-05-20T14:20:00.000Z"
      },
      {
        id: "p5",
        title: "Penyediaan Air Bersih Dusun Utara",
        slug: "penyediaan-air-bersih-dusun-utara",
        description: "Wilayah Dusun Utara (RT 08 dan RT 09) selalu mengalami krisis air bersih setiap kali musim kemarau tiba karena sumur-sumur galian warga mengering. Untuk solusi jangka panjang, program ini mengusulkan pembuatan sumur bor dalam (artesis) sedalam 60 meter, pembangunan bak penampung air utama (tandon) berkapasitas 5.000 liter, serta pemasangan pipa distribusi sepanjang 800 meter menuju 50 rumah tangga yang paling terdampak kekeringan.",
        short_description: "Pembangunan sumur bor dalam and jaringan pipa distribusi air bersih ke 50 rumah warga terdampak kekeringan.",
        location: "Dusun Utara, RT 08 & RT 09",
        image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
        votes_count: 52,
        status: "Sedang Dikerjakan",
        created_at: "2026-05-15T07:45:00.000Z",
        updated_at: "2026-05-15T07:45:00.000Z"
      }
    ];

    const initialVotes: Vote[] = [
      { id: "v1", program_id: "p1", voter_name: "Ahmad", voter_rt: "RT 01", ip_address: "127.0.0.1", created_at: "2026-06-02T10:00:00.000Z" },
      { id: "v2", program_id: "p1", voter_name: "Budi Santoso", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-02T11:20:00.000Z" },
      { id: "v3", program_id: "p1", voter_name: "Siti Aminah", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-03T09:15:00.000Z" },
      { id: "v4", program_id: "p1", voter_name: "Eko Prasetyo", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-04T15:30:00.000Z" },
      { id: "v5", program_id: "p1", voter_name: "Dewi Lestari", voter_rt: "RT 02", ip_address: "127.0.0.1", created_at: "2026-06-05T08:45:00.000Z" },
      { id: "v6", program_id: "p2", voter_name: "Sugeng", voter_rt: "RT 06", ip_address: "127.0.0.1", created_at: "2026-06-11T14:10:00.000Z" },
      { id: "v7", program_id: "p2", voter_name: "Joko", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-12T16:22:00.000Z" },
      { id: "v8", program_id: "p2", voter_name: "Hartono", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-13T11:05:00.000Z" },
      { id: "v9", program_id: "p5", voter_name: "Warto", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-16T10:00:00.000Z" },
      { id: "v10", program_id: "p5", voter_name: "Sumiati", voter_rt: "RT 09", ip_address: "127.0.0.1", created_at: "2026-05-17T09:30:00.000Z" },
      { id: "v11", program_id: "p5", voter_name: "Supardi", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-18T14:15:00.000Z" }
    ];

    initialPrograms[0].votes_count = initialVotes.filter(v => v.program_id === "p1").length + 27;
    initialPrograms[1].votes_count = initialVotes.filter(v => v.program_id === "p2").length + 21;
    initialPrograms[2].votes_count = 15;
    initialPrograms[3].votes_count = 41;
    initialPrograms[4].votes_count = initialVotes.filter(v => v.program_id === "p5").length + 49;

    fs.writeFileSync(DB_FILE, JSON.stringify({ programs: initialPrograms, votes: initialVotes }, null, 2), 'utf-8');
  }
}

function readDb(): { programs: Program[]; votes: Vote[] } {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading local database:", error);
    return { programs: [], votes: [] };
  }
}

function writeDb(data: { programs: Program[]; votes: Vote[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing local database:", error);
  }
}

// -------------------------------------------------------------
// UNIFIED API IMPLEMENTATION (SUPPORTING PROMISES)
// -------------------------------------------------------------
export const db = {
  async getPrograms(): Promise<Program[]> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const res = await pool.query('SELECT * FROM programs');
      const programs: Program[] = res.rows;
      return [...programs].sort((a, b) => {
        if (b.votes_count !== a.votes_count) {
          return b.votes_count - a.votes_count;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else {
      const { programs } = readDb();
      return [...programs].sort((a, b) => {
        if (b.votes_count !== a.votes_count) {
          return b.votes_count - a.votes_count;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }
  },

  async getProgramBySlug(slug: string): Promise<Program | null> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const res = await pool.query('SELECT * FROM programs WHERE slug = $1', [slug]);
      return res.rows[0] || null;
    } else {
      const { programs } = readDb();
      return programs.find(p => p.slug === slug) || null;
    }
  },

  async getProgramById(id: string): Promise<Program | null> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const res = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
      return res.rows[0] || null;
    } else {
      const { programs } = readDb();
      return programs.find(p => p.id === id) || null;
    }
  },

  async createProgram(data: Omit<Program, 'id' | 'votes_count' | 'created_at' | 'updated_at'>): Promise<Program> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const id = 'p_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      const res = await pool.query(`
        INSERT INTO programs (id, title, slug, description, short_description, location, image_url, votes_count, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)
        RETURNING *
      `, [id, data.title, data.slug, data.description, data.short_description, data.location, data.image_url, data.status, now, now]);
      return res.rows[0];
    } else {
      const dbData = readDb();
      const newProgram: Program = {
        ...data,
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        votes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbData.programs.push(newProgram);
      writeDb(dbData);
      return newProgram;
    }
  },

  async updateProgram(id: string, data: Partial<Omit<Program, 'id' | 'votes_count' | 'created_at' | 'updated_at'>>): Promise<Program | null> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const current = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
      if (current.rows.length === 0) return null;
      const item = current.rows[0];

      const updatedTitle = data.title !== undefined ? data.title : item.title;
      const updatedSlug = data.slug !== undefined ? data.slug : item.slug;
      const updatedDescription = data.description !== undefined ? data.description : item.description;
      const updatedShortDescription = data.short_description !== undefined ? data.short_description : item.short_description;
      const updatedLocation = data.location !== undefined ? data.location : item.location;
      const updatedImageUrl = data.image_url !== undefined ? data.image_url : item.image_url;
      const updatedStatus = data.status !== undefined ? data.status : item.status;
      const now = new Date().toISOString();

      const res = await pool.query(`
        UPDATE programs
        SET title = $1, slug = $2, description = $3, short_description = $4, location = $5, image_url = $6, status = $7, updated_at = $8
        WHERE id = $9
        RETURNING *
      `, [updatedTitle, updatedSlug, updatedDescription, updatedShortDescription, updatedLocation, updatedImageUrl, updatedStatus, now, id]);
      return res.rows[0];
    } else {
      const dbData = readDb();
      const idx = dbData.programs.findIndex(p => p.id === id);
      if (idx === -1) return null;

      dbData.programs[idx] = {
        ...dbData.programs[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      writeDb(dbData);
      return dbData.programs[idx];
    }
  },

  async deleteProgram(id: string): Promise<boolean> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const res = await pool.query('DELETE FROM programs WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } else {
      const dbData = readDb();
      const beforeLen = dbData.programs.length;
      dbData.programs = dbData.programs.filter(p => p.id !== id);
      dbData.votes = dbData.votes.filter(v => v.program_id !== id);
      writeDb(dbData);
      return dbData.programs.length < beforeLen;
    }
  },

  async getVotes(programId?: string): Promise<Vote[]> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      if (programId) {
        const res = await pool.query('SELECT * FROM votes WHERE program_id = $1 ORDER BY created_at DESC', [programId]);
        return res.rows;
      } else {
        const res = await pool.query('SELECT * FROM votes ORDER BY created_at DESC');
        return res.rows;
      }
    } else {
      const { votes } = readDb();
      if (programId) {
        return votes.filter(v => v.program_id === programId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return votes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addVote(programId: string, voterName: string, voterRt: string, ipAddress: string): Promise<{ success: boolean; message: string; vote?: Vote }> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const progCheck = await pool.query('SELECT * FROM programs WHERE id = $1', [programId]);
      if (progCheck.rows.length === 0) {
        return { success: false, message: "Program tidak ditemukan." };
      }

      const normalizedName = voterName.trim().toLowerCase();
      const normalizedRt = voterRt.trim();

      const voteCheck = await pool.query(`
        SELECT 1 FROM votes
        WHERE program_id = $1 AND LOWER(TRIM(voter_name)) = $2 AND TRIM(voter_rt) = $3
      `, [programId, normalizedName, normalizedRt]);

      if (voteCheck.rows.length > 0) {
        return { success: false, message: "Anda sudah memberikan dukungan pada program ini." };
      }

      const voteId = 'v_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();

      const insertRes = await pool.query(`
        INSERT INTO votes (id, program_id, voter_name, voter_rt, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [voteId, programId, voterName.trim(), voterRt.trim(), ipAddress, now]);

      await pool.query(`
        UPDATE programs
        SET votes_count = votes_count + 1, updated_at = $1
        WHERE id = $2
      `, [now, programId]);

      return { success: true, message: "Dukungan berhasil ditambahkan!", vote: insertRes.rows[0] };
    } else {
      const dbData = readDb();
      const programIdx = dbData.programs.findIndex(p => p.id === programId);
      if (programIdx === -1) {
        return { success: false, message: "Program tidak ditemukan." };
      }

      const normalizedName = voterName.trim().toLowerCase();
      const normalizedRt = voterRt.trim();

      const alreadyVoted = dbData.votes.some(v => 
        v.program_id === programId && 
        v.voter_name.trim().toLowerCase() === normalizedName && 
        v.voter_rt.trim() === normalizedRt
      );

      if (alreadyVoted) {
        return { success: false, message: "Anda sudah memberikan dukungan pada program ini." };
      }

      const newVote: Vote = {
        id: 'v_' + Math.random().toString(36).substr(2, 9),
        program_id: programId,
        voter_name: voterName.trim(),
        voter_rt: voterRt.trim(),
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      };

      dbData.votes.push(newVote);
      dbData.programs[programIdx].votes_count += 1;
      dbData.programs[programIdx].updated_at = new Date().toISOString();

      writeDb(dbData);
      return { success: true, message: "Dukungan berhasil ditambahkan!", vote: newVote };
    }
  },

  async deleteVote(voteId: string): Promise<boolean> {
    await ensureDbInitialized();
    if (usePostgres && pool) {
      const voteQuery = await pool.query('SELECT * FROM votes WHERE id = $1', [voteId]);
      if (voteQuery.rows.length === 0) return false;
      const vote = voteQuery.rows[0];

      await pool.query('DELETE FROM votes WHERE id = $1', [voteId]);
      const now = new Date().toISOString();
      await pool.query(`
        UPDATE programs
        SET votes_count = GREATEST(0, votes_count - 1), updated_at = $1
        WHERE id = $2
      `, [now, vote.program_id]);

      return true;
    } else {
      const dbData = readDb();
      const voteIdx = dbData.votes.findIndex(v => v.id === voteId);
      if (voteIdx === -1) return false;

      const vote = dbData.votes[voteIdx];
      dbData.votes.splice(voteIdx, 1);

      const programIdx = dbData.programs.findIndex(p => p.id === vote.program_id);
      if (programIdx !== -1) {
        dbData.programs[programIdx].votes_count = Math.max(0, dbData.programs[programIdx].votes_count - 1);
        dbData.programs[programIdx].updated_at = new Date().toISOString();
      }

      writeDb(dbData);
      return true;
    }
  },

  async getStats() {
    await ensureDbInitialized();
    let programs: Program[] = [];
    let votes: Vote[] = [];

    if (usePostgres && pool) {
      const programsRes = await pool.query('SELECT * FROM programs');
      const votesRes = await pool.query('SELECT * FROM votes');
      programs = programsRes.rows;
      votes = votesRes.rows;
    } else {
      const dbData = readDb();
      programs = dbData.programs;
      votes = dbData.votes;
    }

    const totalPrograms = programs.length;
    const totalVotes = votes.length;

    const uniqueVoterKeys = new Set(votes.map(v => `${v.voter_name.trim().toLowerCase()}_${v.voter_rt.trim()}`));
    const totalParticipants = uniqueVoterKeys.size;

    const sortedByVotes = [...programs].sort((a, b) => b.votes_count - a.votes_count);
    const popularProgram = sortedByVotes[0] ? sortedByVotes[0].title : "-";

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const votesToday = votes.filter(v => {
      const dStr = typeof v.created_at === 'string' ? v.created_at.split('T')[0] : new Date(v.created_at).toISOString().split('T')[0];
      return dStr === todayStr;
    }).length;

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const votesThisWeek = votes.filter(v => new Date(v.created_at).getTime() >= oneWeekAgo.getTime()).length;

    const rtDistribution: Record<string, number> = {};
    votes.forEach(v => {
      rtDistribution[v.voter_rt] = (rtDistribution[v.voter_rt] || 0) + 1;
    });

    const programDistribution: Record<string, { title: string; votes: number }> = {};
    programs.forEach(p => {
      programDistribution[p.id] = { title: p.title, votes: p.votes_count };
    });

    const dailyGrowth: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyGrowth[dateStr] = 0;
    }

    votes.forEach(v => {
      const dStr = typeof v.created_at === 'string' ? v.created_at.split('T')[0] : new Date(v.created_at).toISOString().split('T')[0];
      if (dStr in dailyGrowth) {
        dailyGrowth[dStr] += 1;
      }
    });

    return {
      totalPrograms,
      totalVotes,
      totalParticipants,
      popularProgram,
      votesToday,
      votesThisWeek,
      rtDistribution,
      programDistribution,
      dailyGrowth: Object.entries(dailyGrowth).map(([date, count]) => ({ date, count }))
    };
  }
};
