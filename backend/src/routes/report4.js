const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName = lang === "en" ? "Rpt_4_EN" : "Rpt_4";
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT Location_Code, Location_Name, Registered_Qty, Active_Qty FROM [register].[dbo].[${tableName}]`
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
