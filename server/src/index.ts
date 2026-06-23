import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createRoutes } from './routes.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', createRoutes(prisma));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, prisma };
