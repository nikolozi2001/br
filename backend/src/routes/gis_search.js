const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// GET by city (Region_Code2), legal form, and search text in Full_Name
// Query params: city (region code), legalForm (optional), search (optional)
router.get("/", async (req, res) => {
  try {
    const { city, legalForm, search } = req.query;

    // City is required
    if (!city || city.trim() === "") {
      return res.status(400).json({ 
        error: "City parameter is required",
        message: "Please provide a city (region code) to search"
      });
    }

    console.log("GIS Search Parameters:", { city, legalForm, search });

    const cityCode = parseInt(city);
    if (isNaN(cityCode)) {
      return res.status(400).json({ 
        error: "Invalid city parameter",
        message: "City must be a valid region code"
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
    
    // Add Full_Name search if provided
    if (search && search.trim() !== "") {
      whereClause += " AND [Full_Name] LIKE @search";
    }

    const query = `
      SELECT TOP (1000) 
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
    
    if (search && search.trim() !== "") {
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);
    console.log("Number of records found:", result.recordset.length);
    console.log("Query executed with filters:", { city: cityCode, legalForm, search });
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching DocMain data:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
