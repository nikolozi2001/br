const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/database');

// GET /api/legal-forms
router.get('/', async (req, res) => {
    try {
        const { lang } = req.query; // Get language from query parameter
        const tableName = lang === 'en' ? '[register].[CL].[Legal_Forms_EN]' : '[register].[CL].[Legal_Forms]';
        
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP (1000) [ID]
                    ,[Abbreviation]
                    ,[Legal_Form]
                    ,[Stat_ID_Type]
                    ,[Inactive]
                    ,[Rec_User_ID]
                    ,[Rec_Date]
                    ,[Rec_Type]
                FROM ${tableName}
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching legal forms:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'Error fetching legal forms data'
        });
    }
});

module.exports = router;
