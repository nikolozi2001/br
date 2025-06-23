const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Import database configuration
const { sql, poolPromise } = require('./config/database');

// Import routes
const legalFormsRouter = require('./routes/legalForms');

// Route middlewares
app.use('/api/legal-forms', legalFormsRouter);

// Example API endpoint
app.get('/api/test', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT 1 as test');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
