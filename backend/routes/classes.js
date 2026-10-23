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

// ---------- CRUD kelas ----------
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM classes ORDER BY course_name, class_name');
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

router.get('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query('SELECT * FROM classes WHERE id = $1', [req.params.id]);
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
       WHERE e.class_id = $1 ORDER BY s.nim`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

router.post('/:id/students', async (req, res) => {
  if (!validId(req.params.id) || !validId(req.body.student_id)) {
    return res.status(400).json({ error: 'ID kelas atau mahasiswa tidak valid' });
  }
  try {
    await pool.query(
      'INSERT INTO enrollments (class_id, student_id) VALUES ($1, $2)',
      [req.params.id, req.body.student_id]
    );
    res.status(201).json({ message: 'Mahasiswa didaftarkan ke kelas' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Mahasiswa sudah terdaftar di kelas ini' });
    handleError(err, res);
  }
});

router.delete('/:id/students/:studentId', async (req, res) => {
  if (!validId(req.params.id) || !validId(req.params.studentId)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2',
      [req.params.id, req.params.studentId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    res.json({ message: 'Mahasiswa dikeluarkan dari kelas' });
  } catch (err) { handleError(err, res); }
});

// ---------- Pertemuan per kelas ----------
router.get('/:id/meetings', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.class_id, m.meeting_number,
              to_char(m.meeting_date, 'YYYY-MM-DD') AS meeting_date,
              COUNT(a.id)::int AS jumlah_tercatat
       FROM meetings m
       LEFT JOIN attendances a ON a.meeting_id = m.id
       WHERE m.class_id = $1
       GROUP BY m.id ORDER BY m.meeting_number`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

router.post('/:id/meetings', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  const number = Number(req.body.meeting_number);
  const date = String(req.body.meeting_date ?? '');
  if (!Number.isInteger(number) || number < 1) {
    return res.status(400).json({ error: 'Pertemuan ke- harus berupa angka bulat minimal 1' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Tanggal tidak valid (format YYYY-MM-DD)' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO meetings (class_id, meeting_number, meeting_date)
       VALUES ($1, $2, $3)
       RETURNING id, class_id, meeting_number, to_char(meeting_date, 'YYYY-MM-DD') AS meeting_date`,
      [req.params.id, number, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Pertemuan ke-${number} sudah ada di kelas ini` });
    handleError(err, res);
  }
});

// ---------- Rekap kehadiran ----------
// Aturan: persentase = jumlah "hadir" / jumlah pertemuan yang sudah tercatat untuk mahasiswa itu.
// Izin dan sakit TIDAK dihitung hadir.
router.get('/:id/recap', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nim, s.name,
              COUNT(*) FILTER (WHERE a.status = 'hadir')::int AS hadir,
              COUNT(*) FILTER (WHERE a.status = 'izin')::int  AS izin,
              COUNT(*) FILTER (WHERE a.status = 'sakit')::int AS sakit,
              COUNT(*) FILTER (WHERE a.status = 'alpa')::int  AS alpa,
              COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'hadir')
                / NULLIF(COUNT(a.id), 0), 1), 0)::float8 AS persen_hadir
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN meetings m ON m.class_id = e.class_id
       LEFT JOIN attendances a ON a.meeting_id = m.id AND a.student_id = s.id
       WHERE e.class_id = $1
       GROUP BY s.id ORDER BY s.nim`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(err, res); }
});

export default router;