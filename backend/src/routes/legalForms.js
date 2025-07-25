const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// GET /api/legal-forms
router.get("/", async (req, res) => {
  try {
    const { lang } = req.query; // Get language from query parameter
    const tableName =
      lang === "en"
        ? "[register].[CL].[Legal_Forms_EN]"
        : "[register].[CL].[Legal_Forms]";

    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT TOP (1000) [ID]
                    ,[Abbreviation]
                    ,[Legal_Form]
                    ,[Stat_ID_Type]
                    ,[Inactive]
                    ,[Rec_User_ID]
                    ,[Rec_Date]
                    ,[Rec_Type]
                FROM ${tableName}
            `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching legal forms:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching legal forms data",
    });
  }
});

// GET /api/legal-forms/gis/:gis
router.get("/gis/:gis", async (req, res) => {
  try {
    const { gis } = req.params;
    const { lang } = req.query;
    const tableName =
      lang === "en"
        ? "[register].[CL].[Legal_Forms_EN]"
        : "[register].[CL].[Legal_Forms]";

    const pool = await poolPromise;
    const result = await pool.request().input("gis", sql.Bit, gis).query(`
                SELECT [ID]
                    ,[Abbreviation]
                    ,[Legal_Form]
                    ,[Stat_ID_Type]
                    ,[Inactive]
                    ,[Rec_User_ID]
                    ,[Rec_Date]
                    ,[Rec_Type]
                    ,[gis]
                FROM ${tableName}
                WHERE [gis] = @gis
            `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "No legal forms found with that GIS value" });
    }

    // Return all rows
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching legal form:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error fetching legal form data",
    });
  }
});

module.exports = router;
