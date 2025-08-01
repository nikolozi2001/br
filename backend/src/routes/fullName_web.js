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
      ,[Legal_Code]
      ,[Full_Name]
      ,[Legal_Form_ID]
      ,[Ownership_Type_ID]
      ,[Date]
      ,[Abbreviation]
      ,[Legal_Form]
      ,[Ownership_Type]
        FROM [register].[dbo].[Hst_FullName_web]
        WHERE [Stat_ID] = @statId 
        ORDER BY [Date] DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
