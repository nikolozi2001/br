const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

// GET all activities
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName =
      lang === "en" ? "Activities_NACE2_EN" : "Activities_NACE2";

    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT TOP 1000
                     [ID]
                    ,[Parent_ID]
                    ,[Activity_Type_ID]
                    ,[Activity_Code]
                    ,[Activity_Name]
                    ,[Activity_Description]
                    ,[Activity_Root_ID]
                    ,[root2]
                    ,[root3]
                    ,[root4]
                    ,[root5]
                FROM [register].[CL].[${tableName}]
                ORDER BY Activity_Code
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/gis", async (req, res) => {
  try {
    const lang = req.query.lang || "ge";
    const tableName =
      lang === "en" ? "Activities_NACE2_EN" : "Activities_NACE2";

    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        [ID],
        [Activity_Code],
        [Activity_Name],
        [Activity_Description],
        [Activity_Root_ID],
        [root2],
        [root3],
        [root4],
        [root5]
      FROM [register].[CL].[${tableName}]
      WHERE [Activity_Type_ID] = 1
      ORDER BY [Activity_Code]
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
