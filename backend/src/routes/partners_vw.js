const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const statId = req.query.statId;

    if (!statId) {
      return res.status(400).json({ error: "Stat ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("statId", statId).query(`
        SELECT 
        [Stat_ID]
        ,[Person_ID]
        ,[Reg_Company_ID]
        ,[Entity_ID]
        ,[Name]
        ,[Date]
        ,[Share]
        ,[Row_No]
        FROM [register].[dbo].[Hst_Partners0]
        WHERE [Stat_ID] = @statId 
        ORDER BY [Date] DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
