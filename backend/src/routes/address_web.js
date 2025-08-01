const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const statId = req.query.statId;

    if (!statId) {
      return res.status(400).json({ error: "Stat ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("statId", statId).query(`
        SELECT 
        [Stat_ID]
      ,[Location_ID]
      ,[Location_Code]
      ,[Location_Name]
      ,[Address]
      ,[Date]
      ,[Region_name]
      ,[City_name]
      ,[Community_name]
      ,[Village_name]
        FROM [register].[dbo].[Hst_Address_web]
        WHERE [Stat_ID] = @statId 
        ORDER BY [Date] DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
