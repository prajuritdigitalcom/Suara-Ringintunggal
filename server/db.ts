import fs from 'fs';
import path from 'path';

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

// Ensure database file exists
function initDb() {
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
        short_description: "Pembangunan sumur bor dalam dan jaringan pipa distribusi air bersih ke 50 rumah warga terdampak kekeringan.",
        location: "Dusun Utara, RT 08 & RT 09",
        image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
        votes_count: 52,
        status: "Sedang Dikerjakan",
        created_at: "2026-05-15T07:45:00.000Z",
        updated_at: "2026-05-15T07:45:00.000Z"
      }
    ];

    const initialVotes: Vote[] = [
      // Pre-populate votes for Perbaikan Jalan RT 03 (p1)
      { id: "v1", program_id: "p1", voter_name: "Ahmad", voter_rt: "RT 01", ip_address: "127.0.0.1", created_at: "2026-06-02T10:00:00.000Z" },
      { id: "v2", program_id: "p1", voter_name: "Budi Santoso", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-02T11:20:00.000Z" },
      { id: "v3", program_id: "p1", voter_name: "Siti Aminah", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-03T09:15:00.000Z" },
      { id: "v4", program_id: "p1", voter_name: "Eko Prasetyo", voter_rt: "RT 03", ip_address: "127.0.0.1", created_at: "2026-06-04T15:30:00.000Z" },
      { id: "v5", program_id: "p1", voter_name: "Dewi Lestari", voter_rt: "RT 02", ip_address: "127.0.0.1", created_at: "2026-06-05T08:45:00.000Z" },

      // Pre-populate votes for Pembangunan Jembatan Tani Dusun Selatan (p2)
      { id: "v6", program_id: "p2", voter_name: "Sugeng", voter_rt: "RT 06", ip_address: "127.0.0.1", created_at: "2026-06-11T14:10:00.000Z" },
      { id: "v7", program_id: "p2", voter_name: "Joko", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-12T16:22:00.000Z" },
      { id: "v8", program_id: "p2", voter_name: "Hartono", voter_rt: "RT 07", ip_address: "127.0.0.1", created_at: "2026-06-13T11:05:00.000Z" },

      // Pre-populate votes for Penyediaan Air Bersih (p5)
      { id: "v9", program_id: "p5", voter_name: "Warto", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-16T10:00:00.000Z" },
      { id: "v10", program_id: "p5", voter_name: "Sumiati", voter_rt: "RT 09", ip_address: "127.0.0.1", created_at: "2026-05-17T09:30:00.000Z" },
      { id: "v11", program_id: "p5", voter_name: "Supardi", voter_rt: "RT 08", ip_address: "127.0.0.1", created_at: "2026-05-18T14:15:00.000Z" }
    ];

    // Auto calculate actual votes_count from seeded votes for p1, p2, p5, keeping the others with their display counts
    initialPrograms[0].votes_count = initialVotes.filter(v => v.program_id === "p1").length + 27; // 32
    initialPrograms[1].votes_count = initialVotes.filter(v => v.program_id === "p2").length + 21; // 24
    initialPrograms[2].votes_count = 15;
    initialPrograms[3].votes_count = 41;
    initialPrograms[4].votes_count = initialVotes.filter(v => v.program_id === "p5").length + 49; // 52

    fs.writeFileSync(DB_FILE, JSON.stringify({ programs: initialPrograms, votes: initialVotes }, null, 2), 'utf-8');
  }
}

initDb();

function readDb(): { programs: Program[]; votes: Vote[] } {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { programs: [], votes: [] };
  }
}

function writeDb(data: { programs: Program[]; votes: Vote[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

export const db = {
  getPrograms(): Program[] {
    const { programs } = readDb();
    // Sort logic: 1. Most votes first. 2. If same votes, older program first (created_at ascending)
    return [...programs].sort((a, b) => {
      if (b.votes_count !== a.votes_count) {
        return b.votes_count - a.votes_count;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  },

  getProgramBySlug(slug: string): Program | null {
    const { programs } = readDb();
    return programs.find(p => p.slug === slug) || null;
  },

  getProgramById(id: string): Program | null {
    const { programs } = readDb();
    return programs.find(p => p.id === id) || null;
  },

  createProgram(data: Omit<Program, 'id' | 'votes_count' | 'created_at' | 'updated_at'>): Program {
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
  },

  updateProgram(id: string, data: Partial<Omit<Program, 'id' | 'votes_count' | 'created_at' | 'updated_at'>>): Program | null {
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
  },

  deleteProgram(id: string): boolean {
    const dbData = readDb();
    const beforeLen = dbData.programs.length;
    dbData.programs = dbData.programs.filter(p => p.id !== id);
    // Also delete all votes for this program
    dbData.votes = dbData.votes.filter(v => v.program_id !== id);
    writeDb(dbData);
    return dbData.programs.length < beforeLen;
  },

  getVotes(programId?: string): Vote[] {
    const { votes } = readDb();
    if (programId) {
      // Sort: newest vote first
      return votes.filter(v => v.program_id === programId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return votes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addVote(programId: string, voterName: string, voterRt: string, ipAddress: string): { success: boolean; message: string; vote?: Vote } {
    const dbData = readDb();
    
    // Check if program exists
    const programIdx = dbData.programs.findIndex(p => p.id === programId);
    if (programIdx === -1) {
      return { success: false, message: "Program tidak ditemukan." };
    }

    // Clean voterName to match unique logic case-insensitively/trimmed
    const normalizedName = voterName.trim().toLowerCase();
    const normalizedRt = voterRt.trim();

    // Unique constraint: program_id + voter_name + voter_rt
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
  },

  deleteVote(voteId: string): boolean {
    const dbData = readDb();
    const voteIdx = dbData.votes.findIndex(v => v.id === voteId);
    if (voteIdx === -1) return false;

    const vote = dbData.votes[voteIdx];
    dbData.votes.splice(voteIdx, 1);

    // Decrease program votes count
    const programIdx = dbData.programs.findIndex(p => p.id === vote.program_id);
    if (programIdx !== -1) {
      dbData.programs[programIdx].votes_count = Math.max(0, dbData.programs[programIdx].votes_count - 1);
      dbData.programs[programIdx].updated_at = new Date().toISOString();
    }

    writeDb(dbData);
    return true;
  },

  getStats() {
    const { programs, votes } = readDb();
    const totalPrograms = programs.length;
    const totalVotes = votes.length;

    // Calculate unique voters (name + rt combination)
    const uniqueVoterKeys = new Set(votes.map(v => `${v.voter_name.trim().toLowerCase()}_${v.voter_rt.trim()}`));
    const totalParticipants = uniqueVoterKeys.size;

    // Popular program
    const sortedByVotes = [...programs].sort((a, b) => b.votes_count - a.votes_count);
    const popularProgram = sortedByVotes[0] ? sortedByVotes[0].title : "-";

    // Filter votes today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const votesToday = votes.filter(v => v.created_at.startsWith(todayStr)).length;

    // Filter votes this week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const votesThisWeek = votes.filter(v => new Date(v.created_at).getTime() >= oneWeekAgo.getTime()).length;

    // Dukungan per RT
    const rtDistribution: Record<string, number> = {};
    votes.forEach(v => {
      rtDistribution[v.voter_rt] = (rtDistribution[v.voter_rt] || 0) + 1;
    });

    // Dukungan per program
    const programDistribution: Record<string, { title: string; votes: number }> = {};
    programs.forEach(p => {
      programDistribution[p.id] = { title: p.title, votes: p.votes_count };
    });

    // Pertumbuhan harian (last 7 days)
    const dailyGrowth: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyGrowth[dateStr] = 0;
    }

    votes.forEach(v => {
      const dateStr = v.created_at.split('T')[0];
      if (dateStr in dailyGrowth) {
        dailyGrowth[dateStr] += 1;
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
