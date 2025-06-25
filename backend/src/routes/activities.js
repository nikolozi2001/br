const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

// GET all activities
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP (1000) [ID]
                    ,[Parent_ID]
                    ,[Activity_Type_ID]
                    ,[Activity_Code]
                    ,[Activity_Name]
                    ,[Activity_Description]
                    ,[Activity_Root_ID]
                    ,[root2]
                    ,[root3]
                    ,[root4]
                    ,[root5]
                FROM [register].[CL].[Activities_NACE2]
                ORDER BY Activity_Code
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
