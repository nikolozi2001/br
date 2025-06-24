const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

// GET /api/locations
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'ge'; // Default to Georgian if no language specified
        const tableName = lang === 'en' ? 'Locations_EN' : 'Locations';
        
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP (1000) 
                    [ID],
                    [Parent_ID],
                    [Location_Code],
                    [Location_Name],
                    [Location_Type_ID],
                    [Urban_Type_ID],
                    [Inactive],
                    [Rec_User_ID],
                    [Rec_Date],
                    [Rec_Type],
                    [Level],
                    [Location_Root_ID],
                    [Location_Munic_ID],
                    [Mountainous]
                FROM [register].[CL].[${tableName}]
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
