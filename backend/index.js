import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studentsRouter from './routes/students.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/students', studentsRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend berjalan di http://localhost:${port}`);
});