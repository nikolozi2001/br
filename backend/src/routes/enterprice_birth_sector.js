const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName = lang === "en" ? "Enterprise_creation_by_sector" : "Enterprise_creation_by_sector";
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT * FROM [register].[dbo].[${tableName}]`
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
