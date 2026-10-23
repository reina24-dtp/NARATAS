import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

function handleError(err, res) {
  if (err.code === '23505') return res.status(409).json({ error: 'Data sudah ada' });
  if (err.code === '23503') return res.status(404).json({ error: 'Data terkait tidak ditemukan' });
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
}

function validateClass(body) {
  const course_name = String(body.course_name ?? '').trim();
  const class_name = String(body.class_name ?? '').trim();
  const lecturer = String(body.lecturer ?? '').trim();
  if (!course_name || !class_name || !lecturer) {
    return { error: 'Mata kuliah, nama kelas, dan dosen wajib diisi' };
  }
  return { course_name, class_name, lecturer };
}

const CLASS_SELECT = `
  SELECT c.id, c.course_name, c.class_name, c.lecturer,
         (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id)::int AS student_count,
         (SELECT COUNT(*) FROM meetings m WHERE m.class_id = c.id)::int AS meeting_count
  FROM classes c`;

// ---------- CRUD kelas ----------
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(CLASS_SELECT + ' ORDER BY c.course_name, c.class_name');
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

router.get('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query(CLASS_SELECT + ' WHERE c.id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) { handleError(err, res); }
});

router.post('/', async (req, res) => {
  const v = validateClass(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const { rows } = await pool.query(
      'INSERT INTO classes (course_name, class_name, lecturer) VALUES ($1, $2, $3) RETURNING *',
      [v.course_name, v.class_name, v.lecturer]
    );
    res.status(201).json(rows[0]);
  } catch (err) { handleError(err, res); }
});

router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  const v = validateClass(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const { rows } = await pool.query(
      'UPDATE classes SET course_name = $1, class_name = $2, lecturer = $3 WHERE id = $4 RETURNING *',
      [v.course_name, v.class_name, v.lecturer, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) { handleError(err, res); }
});

router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rowCount } = await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    res.json({ message: 'Kelas dihapus' });
  } catch (err) { handleError(err, res); }
});

// ---------- Mahasiswa terdaftar di kelas ----------
router.get('/:id/students', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nim, s.name
       FROM enrollments e JOIN students s ON s.id = e.student_id
       WHERE e.class_id = $1 ORDER BY s.name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

// Daftarkan beberapa mahasiswa sekaligus: { student_ids: [1, 2, 3] }
router.post('/:id/students', async (req, res) => {
  const ids = req.body.student_ids;
  if (!validId(req.params.id) || !Array.isArray(ids) || ids.length === 0 || !ids.every(validId)) {
    return res.status(400).json({ error: 'Pilih minimal satu mahasiswa yang valid' });
  }
  try {
    await pool.query(
      `INSERT INTO enrollments (class_id, student_id)
       SELECT $1::int, UNNEST($2::int[])
       ON CONFLICT (class_id, student_id) DO NOTHING`,
      [req.params.id, ids.map(Number)]
    );
    res.status(201).json({ message: 'Mahasiswa didaftarkan ke kelas' });
  } catch (err) { handleError(err, res); }
});

// Keluarkan mahasiswa dari kelas; kehadirannya di kelas itu ikut dihapus
router.delete('/:id/students/:studentId', async (req, res) => {
  if (!validId(req.params.id) || !validId(req.params.studentId)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM attendances
       WHERE student_id = $2
         AND meeting_id IN (SELECT id FROM meetings WHERE class_id = $1)`,
      [req.params.id, req.params.studentId]
    );
    const { rowCount } = await client.query(
      'DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2',
      [req.params.id, req.params.studentId]
    );
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Mahasiswa dikeluarkan dari kelas' });
  } catch (err) {
    await client.query('ROLLBACK');
    handleError(err, res);
  } finally {
    client.release();
  }
});

// ---------- Pertemuan per kelas ----------
router.get('/:id/meetings', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.class_id, m.meeting_number,
              to_char(m.meeting_date, 'YYYY-MM-DD') AS meeting_date,
              COUNT(a.id)::int AS jumlah_tercatat,
              COUNT(a.id) FILTER (WHERE a.status = 'hadir')::int AS hadir
       FROM meetings m
       LEFT JOIN attendances a ON a.meeting_id = m.id
       WHERE m.class_id = $1
       GROUP BY m.id ORDER BY m.meeting_number`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

// Nomor pertemuan dibuat otomatis (nomor terakhir + 1)
router.post('/:id/meetings', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  const date = String(req.body.meeting_date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Tanggal tidak valid (format YYYY-MM-DD)' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO meetings (class_id, meeting_number, meeting_date)
       SELECT $1::int, COALESCE(MAX(meeting_number), 0) + 1, $2::date
       FROM meetings WHERE class_id = $1::int
       RETURNING id, class_id, meeting_number, to_char(meeting_date, 'YYYY-MM-DD') AS meeting_date`,
      [req.params.id, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '22008' || err.code === '22007') {
      return res.status(400).json({ error: 'Tanggal tidak valid' });
    }
    handleError(err, res);
  }
});

// ---------- Rekap kehadiran ----------
// Aturan: persen = jumlah "hadir" / jumlah pertemuan di kelas yang sudah diisi kehadirannya.
// Izin dan sakit TIDAK dihitung hadir. Jika belum ada pertemuan yang diisi, persen = null.
router.get('/:id/recap', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const t = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM meetings m
       WHERE m.class_id = $1
         AND EXISTS (SELECT 1 FROM attendances a WHERE a.meeting_id = m.id)`,
      [req.params.id]
    );
    const total = t.rows[0].total;

    const { rows } = await pool.query(
      `SELECT s.id, s.nim, s.name,
              COUNT(a.id) FILTER (WHERE a.status = 'hadir')::int AS hadir,
              COUNT(a.id) FILTER (WHERE a.status = 'izin')::int  AS izin,
              COUNT(a.id) FILTER (WHERE a.status = 'sakit')::int AS sakit,
              COUNT(a.id) FILTER (WHERE a.status = 'alpa')::int  AS alpa,
              (CASE WHEN $2::int = 0 THEN NULL
                    ELSE ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'hadir') / $2::int, 1)
               END)::float8 AS pct
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN meetings m ON m.class_id = e.class_id
       LEFT JOIN attendances a ON a.meeting_id = m.id AND a.student_id = s.id
       WHERE e.class_id = $1
       GROUP BY s.id ORDER BY s.name`,
      [req.params.id, total]
    );
    res.json({ total, rows });
  } catch (err) { handleError(err, res); }
});

export default router;