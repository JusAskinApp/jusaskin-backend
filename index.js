const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth.route')

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Define routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
