const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const statId = req.query.statId; // Get statId from query params

    if (!statId) {
      return res.status(400).json({ error: "Stat ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("statId", statId) // Use parameterized query for security
      .query(`
        SELECT 
         [Stat_ID]
        ,[Position_ID]
        ,[Position]
        ,[Person_ID]
        ,[Reg_Company_ID]
        ,[Entity_ID]
        ,[Name]
        ,[Date]
        FROM [register].[dbo].[Hst_Representatives]
        WHERE [Stat_ID] = @statId 
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
