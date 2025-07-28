
const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const taxId = req.query.taxId; // Get taxId from query params
    
    if (!taxId) {
      return res.status(400).json({ error: "Tax ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('taxId', taxId) // Use parameterized query for security
      .query(`
        SELECT 
          [Stat_ID],
          [TAXID],
          [X],  -- Fixed: removed extra comma
          [Y],
          [Region],
          [id],
          [Inactive]
        FROM [register].[dbo].[XYCordinates]  -- Fixed: table path
        WHERE [TAXID] = @taxId  -- Fixed: use parameter instead of hardcoded 1
      `);
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;