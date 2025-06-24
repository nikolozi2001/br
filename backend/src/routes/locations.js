const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

// GET /api/locations - Get regions (level 1)
router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "ge"; // Default to Georgian if no language specified
    const tableName = lang === "en" ? "Locations_EN" : "Locations";

    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT TOP (1000) 
                    [ID],
                    [Parent_ID],
                    [Location_Code],
                    [Location_Name],
                    [Location_Type_ID],
                    [Urban_Type_ID],
                    [Inactive],
                    [Rec_User_ID],
                    [Rec_Date],
                    [Rec_Type],
                    [Level],
                    [Location_Root_ID],
                    [Location_Munic_ID],
                    [Mountainous]
                FROM [register].[CL].[${tableName}]
                WHERE [Level] = 1
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/regions - Get regions (level 2)
router.get("/regions", async (req, res) => {
  try {
    const lang = req.query.lang || "ge"; // Default to Georgian if no language specified
    const tableName = lang === "en" ? "Locations_EN" : "Locations";

    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT TOP (1000) 
                    [ID],
                    [Parent_ID],
                    [Location_Code],
                    [Location_Name],
                    [Location_Type_ID],
                    [Urban_Type_ID],
                    [Inactive],
                    [Rec_User_ID],
                    [Rec_Date],
                    [Rec_Type],
                    [Level],
                    [Location_Root_ID],
                    [Location_Munic_ID],
                    [Mountainous]
                FROM [register].[CL].[${tableName}]
                WHERE [Level] = 2
                ORDER BY [Location_Code] ASC
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/code/:code - Get locations with specific code pattern
router.get("/code/:code", async (req, res) => {
  try {
    const lang = req.query.lang || "ge"; // Default to Georgian if no language specified
    const code = req.params.code; // Get the code from URL parameters
    const tableName = lang === "en" ? "Locations_EN" : "Locations";

    const pool = await poolPromise;
    const result = await pool.request().input("code", code + " %").query(`
                SELECT TOP (1000) 
                    [ID],
                    [Parent_ID],
                    [Location_Code],
                    [Location_Name],
                    [Location_Type_ID],
                    [Urban_Type_ID],
                    [Inactive],
                    [Rec_User_ID],
                    [Rec_Date],
                    [Rec_Type],
                    [Level],
                    [Location_Root_ID],
                    [Location_Munic_ID],
                    [Mountainous]
                FROM [register].[CL].[${tableName}]
                WHERE Location_Code LIKE @code
                AND Location_Code NOT LIKE '% % %'
                ORDER BY [Location_Code] ASC
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
