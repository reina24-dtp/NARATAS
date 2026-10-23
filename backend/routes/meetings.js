import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const STATUSES = ['hadir', 'izin', 'sakit', 'alpa'];
const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// Detail pertemuan + semua mahasiswa kelas beserta statusnya (null = belum diisi)
router.get('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const m = await pool.query(
      `SELECT m.id, m.class_id, m.meeting_number,
              to_char(m.meeting_date, 'YYYY-MM-DD') AS meeting_date,
              c.course_name, c.class_name
       FROM meetings m JOIN classes c ON c.id = m.class_id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (m.rows.length === 0) return res.status(404).json({ error: 'Pertemuan tidak ditemukan' });

    const students = await pool.query(
      `SELECT s.id, s.nim, s.name, a.status
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN attendances a ON a.meeting_id = $1 AND a.student_id = s.id
       WHERE e.class_id = $2
       ORDER BY s.nim`,
      [req.params.id, m.rows[0].class_id]
    );
    res.json({ ...m.rows[0], students: students.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Simpan kehadiran seluruh mahasiswa dalam satu transaksi
router.put('/:id/attendance', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  const records = req.body.records;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Data kehadiran kosong' });
  }
  for (const r of records) {
    if (!validId(r.student_id) || !STATUSES.includes(r.status)) {
      return res.status(400).json({ error: 'Status harus salah satu dari: hadir, izin, sakit, alpa' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const m = await client.query('SELECT class_id FROM meetings WHERE id = $1', [req.params.id]);
    if (m.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pertemuan tidak ditemukan' });
    }

    const enrolled = await client.query(
      'SELECT student_id FROM enrollments WHERE class_id = $1',
      [m.rows[0].class_id]
    );
    const allowed = new Set(enrolled.rows.map((r) => r.student_id));
    for (const r of records) {
      if (!allowed.has(Number(r.student_id))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Mahasiswa dengan ID ${r.student_id} tidak terdaftar di kelas ini` });
      }
    }

    for (const r of records) {
      await client.query(
        `INSERT INTO attendances (meeting_id, student_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (meeting_id, student_id) DO UPDATE SET status = EXCLUDED.status`,
        [req.params.id, r.student_id, r.status]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Kehadiran disimpan' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rowCount } = await pool.query('DELETE FROM meetings WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Pertemuan tidak ditemukan' });
    res.json({ message: 'Pertemuan dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

export default router;