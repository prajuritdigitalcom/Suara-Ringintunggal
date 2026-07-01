import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

let DATA_DIR = path.join(process.cwd(), 'data');
let DB_FILE = path.join(DATA_DIR, 'db.json');

// Safely determine writeable DB_FILE path for environments like Vercel
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const testFile = path.join(DATA_DIR, '.write_test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
} catch (err: any) {
  console.warn("[DATABASE] process.cwd()/data is not writeable, falling back to /tmp/db.json:", err.message);
  DATA_DIR = '/tmp';
  DB_FILE = path.join(DATA_DIR, 'db.json');
}

// Check if we should use Supabase (either through DATABASE_URL or direct SUPABASE envs)
let usePostgres = !!(process.env.DATABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Use Service Role Key if available to bypass RLS on the server side securely, otherwise fallback to Anon Key
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                  process.env.SERVICE_ROLE_KEY || 
                  process.env.SUPABASE_ANON_KEY || 
                  process.env.VITE_SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auto-extract project reference from DATABASE_URL if needed
if (!supabaseUrl && process.env.DATABASE_URL) {
  const match = process.env.DATABASE_URL.match(/@db\.(.*?)\.supabase\.co/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

// Fallback to user's provided project details if still not resolved
if (!supabaseUrl) {
  supabaseUrl = 'https://ppgdjrmcjsphrzynawkl.supabase.co';
}
if (!supabaseKey) {
  supabaseKey = 'sb_publishable_ytQ5GSpM77ODYpYTxajU4Q_N6v6bWTt';
}

console.log("[DATABASE] Initializing Supabase client with URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

let initPromise: Promise<void> | null = null;

// Function to ensure DB is initialized
async function ensureDbInitialized() {
  if (usePostgres) {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          console.log("[DATABASE] Supabase API Client connection active.");
          // Seed initial datasets if empty (via API)
          const { data, error } = await supabase.from('programs').select('id');
          if (!error && (!data || data.length === 0)) {
            console.log("[DATABASE] Supabase tables are empty. Seeding initial development datasets...");
            await seedSupabaseDb();
          }
        } catch (err: any) {
          console.error("[DATABASE] Error initializing Supabase, falling back to local database:", err.message);
          usePostgres = false;
        }
      })();
    }
    await initPromise;
    if (!usePostgres) {
      initLocalDb();
    }
  } else {
    initLocalDb();
  }
}

async function seedSupabaseDb() {
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
      short_description: "Pembangunan sumur bor dalam and jaringan pipa distribusi air bersih ke 50 rumah warga terdampak kekeringan.",
      location: "Dusun Utara, RT 08 & RT 09",
      image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
      votes_count: 52,
      status: "Sedang Dikerjakan"
    }
  ];

  await supabase.from('programs').upsert(initialPrograms.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    short_description: p.short_description,
    location: p.location,
    image_url: p.image_url,
    votes_count: p.votes_count,
    status: p.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })));

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

  await supabase.from('votes').upsert(initialVotes);
  console.log("[DATABASE] Supabase Seeding complete!");
}

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
        description: "Akses jalan usaha tani menuju persawahan Dusun Selatan saat ini terhambat oleh sungai kecil selebar 4 meter. Selama ini warga terpaksa menggunakan jembatan jembatan bambu sementara yang sangat rawan ambruk jika dilewati kendaraan bermotor atau saat debit air sungai naik. Pembangunan jembatan beton permanen dengan fondasi cakar ayam akan memudahkan lalu lintas kendaraan roda tiga dan traktor pengangkut hasil pertanian, serta meningkatkan efisiensi waktu panen warga.",
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

export const db = {
  async getPrograms(): Promise<Program[]> {
    await ensureDbInitialized();
    if (usePostgres) {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) {
        console.error("Supabase getPrograms error, falling back to local:", error.message);
        return [...readDb().programs].sort((a, b) => b.votes_count - a.votes_count);
      }
      return [...(data || [])].sort((a, b) => {
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
    if (usePostgres) {
      const { data, error } = await supabase.from('programs').select('*').eq('slug', slug).maybeSingle();
      if (error) {
        console.error("Supabase getProgramBySlug error, falling back to local:", error.message);
        return readDb().programs.find(p => p.slug === slug) || null;
      }
      return data;
    } else {
      const { programs } = readDb();
      return programs.find(p => p.slug === slug) || null;
    }
  },

  async getProgramById(id: string): Promise<Program | null> {
    await ensureDbInitialized();
    if (usePostgres) {
      const { data, error } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error("Supabase getProgramById error, falling back to local:", error.message);
        return readDb().programs.find(p => p.id === id) || null;
      }
      return data;
    } else {
      const { programs } = readDb();
      return programs.find(p => p.id === id) || null;
    }
  },

  async createProgram(data: Omit<Program, 'id' | 'votes_count' | 'created_at' | 'updated_at'>): Promise<Program> {
    await ensureDbInitialized();
    if (usePostgres) {
      const id = 'p_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      const { data: inserted, error } = await supabase.from('programs').insert({
        id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        short_description: data.short_description,
        location: data.location,
        image_url: data.image_url,
        status: data.status,
        votes_count: 0,
        created_at: now,
        updated_at: now
      }).select().single();

      if (error) {
        console.error("Supabase createProgram error, falling back to local:", error.message);
        throw error;
      }
      return inserted;
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
    if (usePostgres) {
      const { data: updated, error } = await supabase.from('programs').update({
        ...data,
        updated_at: new Date().toISOString()
      }).eq('id', id).select().maybeSingle();

      if (error) {
        console.error("Supabase updateProgram error, falling back to local:", error.message);
        throw error;
      }
      return updated;
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
    if (usePostgres) {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) {
        console.error("Supabase deleteProgram error:", error.message);
        return false;
      }
      return true;
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
    if (usePostgres) {
      let query = supabase.from('votes').select('*').order('created_at', { ascending: false });
      if (programId) {
        query = query.eq('program_id', programId);
      }
      const { data, error } = await query;
      if (error) {
        console.error("Supabase getVotes error, falling back to local:", error.message);
        const { votes } = readDb();
        if (programId) {
          return votes.filter(v => v.program_id === programId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return votes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return data || [];
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
    if (usePostgres) {
      const { data: program, error: progError } = await supabase.from('programs').select('*').eq('id', programId).maybeSingle();
      if (progError || !program) {
        return { success: false, message: "Program tidak ditemukan." };
      }

      const normalizedName = voterName.trim().toLowerCase();
      const normalizedRt = voterRt.trim();

      // Check unique constraint via standard filters
      const { data: existingVotes, error: voteError } = await supabase
        .from('votes')
        .select('*')
        .eq('program_id', programId)
        .eq('voter_rt', normalizedRt);

      const alreadyVoted = existingVotes?.some(v => v.voter_name.trim().toLowerCase() === normalizedName);
      if (alreadyVoted) {
        return { success: false, message: "Anda sudah memberikan dukungan pada program ini." };
      }

      const voteId = 'v_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();

      const { data: insertRes, error: insertError } = await supabase.from('votes').insert({
        id: voteId,
        program_id: programId,
        voter_name: voterName.trim(),
        voter_rt: voterRt.trim(),
        ip_address: ipAddress,
        created_at: now
      }).select().single();

      if (insertError) {
        console.error("Supabase addVote insert error:", insertError.message);
        return { success: false, message: "Gagal menyimpan suara Anda." };
      }

      // Increment votes count on program
      await supabase.from('programs').update({
        votes_count: (program.votes_count || 0) + 1,
        updated_at: now
      }).eq('id', programId);

      return { success: true, message: "Dukungan berhasil ditambahkan!", vote: insertRes };
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
    if (usePostgres) {
      const { data: vote, error: voteError } = await supabase.from('votes').select('*').eq('id', voteId).maybeSingle();
      if (voteError || !vote) return false;

      const { error: deleteError } = await supabase.from('votes').delete().eq('id', voteId);
      if (deleteError) return false;

      const now = new Date().toISOString();
      const { data: program } = await supabase.from('programs').select('votes_count').eq('id', vote.program_id).maybeSingle();
      
      await supabase.from('programs').update({
        votes_count: Math.max(0, (program?.votes_count || 0) - 1),
        updated_at: now
      }).eq('id', vote.program_id);

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

    if (usePostgres) {
      const { data: programsData } = await supabase.from('programs').select('*');
      const { data: votesData } = await supabase.from('votes').select('*');
      programs = programsData || [];
      votes = votesData || [];
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
