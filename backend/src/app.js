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
const locationsRouter = require('./routes/locations');
const activitiesRouter = require('./routes/activities');
const ownershipTypesRouter = require('./routes/ownershipTypes');
const sizesRouter = require('./routes/sizes');
const documentsRouter = require('./routes/documents');
const report1Router = require('./routes/report1');
const report2Router = require('./routes/report2');
const report3Router = require('./routes/report3');
const report4Router = require('./routes/report4');
const report5Router = require('./routes/report5');
const report6Router = require('./routes/report6');
const report7Router = require('./routes/report7');
const report8Router = require('./routes/report8'); 

// Route middlewares
app.use('/api/legal-forms', legalFormsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/ownership-types', ownershipTypesRouter);
app.use('/api/sizes', sizesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/report1', report1Router);
app.use('/api/report2', report2Router);
app.use('/api/report3', report3Router);
app.use('/api/report4', report4Router);
app.use('/api/report5', report5Router);
app.use('/api/report6', report6Router);
app.use('/api/report7', report7Router);
app.use('/api/report8', report8Router);

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
