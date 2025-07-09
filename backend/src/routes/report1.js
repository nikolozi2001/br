const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName = lang === "en" ? "Rpt_30_EN" : "Rpt_30";
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT Activity_Code, Activity_Name, Registered_Qty, pct, Active_Qty, pct_act FROM [register].[dbo].[${tableName}]`
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
