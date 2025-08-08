const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const personId = req.query.statId;

    if (!personId) {
      return res.status(400).json({ error: "Person ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("personId", personId).query(`
        SELECT 
        [Full_Name]
        ,[Position]
        ,[Stat_ID]
        ,[Person_ID]
        ,[Reg_Company_ID]
        ,[Entity_ID]
        ,[Name]
        ,[Date]
        FROM [register].[dbo].[Hst_RepXLegal_Unit_web]
        WHERE [Person_ID] = @personId
        ORDER BY [Date] DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
