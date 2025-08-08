const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const personId = req.query.personId;

    if (!personId) {
      return res.status(400).json({ error: "Person ID is required" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("personId", personId).query(`
        SELECT 
        h.[Full_Name]
        ,h.[Position]
        ,h.[Stat_ID]
        ,h.[Person_ID]
        ,h.[Reg_Company_ID]
        ,h.[Entity_ID]
        ,h.[Name]
        ,h.[Date]
        ,d.[Legal_Code]
        FROM [register].[dbo].[Hst_RepXLegal_Unit_web] h
        LEFT JOIN [register].[dbo].[DocMain] d ON h.[Stat_ID] = d.[Stat_ID]
        WHERE h.[Person_ID] = @personId
        ORDER BY h.[Date] DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
