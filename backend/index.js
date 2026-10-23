import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/students', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM students ORDER BY nim');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend berjalan di http://localhost:${port}`);
});