import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function validate(body) {
  const nim = String(body.nim ?? '').trim();
  const name = String(body.name ?? '').trim();
  if (!nim || !name) return { error: 'NIM dan nama wajib diisi' };
  return { nim, name };
}

function handleError(err, res) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'NIM sudah terdaftar' });
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
}

function validId(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM students ORDER BY nim');
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/', async (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const { rows } = await pool.query(
      'INSERT INTO students (nim, name) VALUES ($1, $2) RETURNING *',
      [v.nim, v.name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const { rows } = await pool.query(
      'UPDATE students SET nim = $1, name = $2 WHERE id = $3 RETURNING *',
      [v.nim, v.name, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'ID tidak valid' });
  try {
    const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
    res.json({ message: 'Mahasiswa dihapus' });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;