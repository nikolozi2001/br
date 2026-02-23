const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// GET by city (Region_Code2), legal form, activity, and search text in Full_Name
// Query params: city (required), legalForm (optional), activity (optional), search (optional)
// activity: single letter (A-U) or detailed code (01.11.1), comma-separated for multiple
router.get("/", async (req, res) => {
  try {
    // Support both 'leg' and 'legalForm' parameter names
    const { city, search } = req.query;
    const legalForm = req.query.legalForm || req.query.leg;
    const activity = req.query.activity || req.query.act;

    // City is required
    if (!city || city.trim() === "") {
      return res.status(400).json({
        error: "City parameter is required",
        message: "Please provide a city (region code) to search",
      });
    }

    console.log("GIS Search Parameters:", {
      city,
      legalForm,
      activity,
      search,
    });

    const cityCode = parseInt(city);
    if (isNaN(cityCode)) {
      return res.status(400).json({
        error: "Invalid city parameter",
        message: "City must be a valid region code",
      });
    }

    let whereClause = " WHERE [Region_Code2] = @city AND [ISActive] = 1";

    // Add legal form filter if provided
    if (legalForm && legalForm.trim() !== "") {
      const legalFormId = parseInt(legalForm);
      if (!isNaN(legalFormId)) {
        whereClause += " AND [Legal_Form_ID] = @legalForm";
      }
    }

    // Add activity filter if provided
    let activityWhereClause = "";
    const letterToRootId = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7,
      H: 8,
      I: 9,
      J: 10,
      K: 11,
      L: 12,
      M: 13,
      N: 14,
      O: 15,
      P: 16,
      Q: 17,
      R: 18,
      S: 19,
      T: 20,
      U: 21,
      Z: 1690,
    };

    if (activity && activity.trim() !== "") {
      const activityCodes = activity
        .split(",")
        .map((code) => code.trim())
        .filter((code) => code);

      if (activityCodes.length > 0) {
        const conditions = [];

        activityCodes.forEach((code, index) => {
          // Check if it's a single letter (like F, G, etc.)
          if (code.length === 1 && /^[A-Z]$/i.test(code)) {
            // Map single letters to Activity_Root_ID values
            const rootId = letterToRootId[code.toUpperCase()];
            if (rootId) {
              conditions.push(
                `[Activity_2_ID] IN (SELECT [ID] FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${index})`,
              );
            }
          } else {
            // For detailed codes like "01.11.1", use the LIKE approach
            conditions.push(`[Activity_2_Code] LIKE @activityCode${index}`);
          }
        });

        if (conditions.length > 0) {
          activityWhereClause = ` AND (${conditions.join(" OR ")})`;
        }
      }
    }

    // Add Full_Name search if provided
    if (search && search.trim() !== "") {
      whereClause += " AND [Full_Name] LIKE @search";
    }

    const query = `
      SELECT 
        [Stat_ID]
        ,[Legal_Code]
        ,[Personal_no]
        ,[Legal_Form_ID]
        ,[Abbreviation]
        ,[Full_Name]
        ,[Ownership_Type_ID]
        ,[Ownership_Type]
        ,[Region_Code]
        ,[Region_name]
        ,[City_Code]
        ,[City_name]
        ,[Comunity_Code]
        ,[Community_name]
        ,[Village_Code]
        ,[Village_name]
        ,[Address]
        ,[Region_Code2]
        ,[Region_name2]
        ,[City_Code2]
        ,[City_name2]
        ,[Comunity_Code2]
        ,[Community_name2]
        ,[Village_Code2]
        ,[Village_name2]
        ,[Address2]
        ,[Activity_ID]
        ,[Activity_Code]
        ,[Activity_Name]
        ,[Activity_2_ID]
        ,[Activity_2_Code]
        ,[Activity_2_Name]
        ,[Head]
        ,[mob]
        ,[Email]
        ,[ISActive]
        ,[Zoma]
        ,[Zoma_old]
        ,[X]
        ,[Y]
        ,[Change]
        ,[Reg_Date]
        ,[Partner]
        ,[Head_PN]
        ,[Partner_PN]
        ,[Init_Reg_date]
        ,[web]
      FROM [register].[dbo].[DocMain]
      ${whereClause}
      ${activityWhereClause}
      ORDER BY [Full_Name]
    `;

    const pool = await poolPromise;
    const request = pool.request();

    request.input("city", sql.Int, cityCode);

    if (legalForm && legalForm.trim() !== "") {
      const legalFormId = parseInt(legalForm);
      if (!isNaN(legalFormId)) {
        request.input("legalForm", sql.SmallInt, legalFormId);
      }
    }

    // Bind activity filter parameters
    if (activity && activity.trim() !== "") {
      const activityCodes = activity
        .split(",")
        .map((code) => code.trim())
        .filter((code) => code);

      if (activityCodes.length > 0) {
        activityCodes.forEach((code, index) => {
          if (code.length === 1 && /^[A-Z]$/i.test(code)) {
            const rootId = letterToRootId[code.toUpperCase()];
            if (rootId) {
              request.input(`rootId${index}`, sql.Int, rootId);
            }
          } else {
            request.input(`activityCode${index}`, sql.NVarChar, `${code}%`);
          }
        });
      }
    }

    if (search && search.trim() !== "") {
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);
    console.log("Number of records found:", result.recordset.length);
    console.log("Query executed with filters:", {
      city: cityCode,
      legalForm,
      activity,
      search,
    });

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching DocMain data:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// GET available regions/cities for dropdown
router.get("/cities", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        [Region_Code2] AS code,
        [Region_name2] AS name,
        [City_Code2] AS cityCode,
        [City_name2] AS cityName
      FROM [register].[dbo].[DocMain]
      WHERE [ISActive] = 1 
        AND [Region_Code2] IS NOT NULL
        AND [City_name2] IS NOT NULL
      ORDER BY [City_name2]
    `;

    const pool = await poolPromise;
    const result = await pool.request().query(query);

    console.log("Available cities/regions:", result.recordset.length);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
