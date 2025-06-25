const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

// Get all ownership types
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName = lang === "en" ? "Ownership_Types_EN" : "Ownership_Types";
    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT TOP (1000) 
                    [ID],
                    [Ownership_Type],
                    [Inactive],
                    [Rec_User_ID],
                    [Rec_Date],
                    [Rec_Type]
                FROM [register].[CL].[${tableName}]
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
