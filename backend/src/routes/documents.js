const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// Cache for district mappings
let districtMappingCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// legal code

router.get("/legal_code/:legalCode", async (req, res) => {
  try {
    const { legalCode } = req.params;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("legalCode", sql.BigInt, legalCode).query(`
        SELECT [Stat_ID], [Legal_Code], [Personal_no], [Legal_Form_ID],
          [Abbreviation], [Full_Name], [Ownership_Type_ID], [Ownership_Type],
          [Region_Code], [Region_name], [City_Code], [City_name],
          [Comunity_Code], [Community_name], [Village_Code], [Village_name],
          [Address], [Region_Code2], [Region_name2], [City_Code2],
          [City_name2], [Comunity_Code2], [Community_name2], [Village_Code2],
          [Village_name2], [Address2], [Activity_ID], [Activity_Code],
          [Activity_Name], [Activity_2_ID], [Activity_2_Code], [Activity_2_Name],
          [Head], [mob], [Email], [ISActive], [Zoma], [Zoma_old],
          [X], [Y], [Change], [Reg_Date], [Partner], [Head_PN],
          [Partner_PN], [Init_Reg_date]
        FROM [register].[dbo].[DocMain]
        WHERE Legal_Code = @legalCode`);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching legal code details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { identificationNumber, organizationName, legalForm, head, partner, ownershipType, isActive } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT [Stat_ID], [Legal_Code], [Personal_no], [Legal_Form_ID],
        [Abbreviation], [Full_Name], [Ownership_Type_ID], [Ownership_Type],
        [Region_Code], [Region_name], [City_Code], [City_name],
        [Comunity_Code], [Community_name], [Village_Code], [Village_name],
        [Address], [Region_Code2], [Region_name2], [City_Code2],
        [City_name2], [Comunity_Code2], [Community_name2], [Village_Code2],
        [Village_name2], [Address2], [Activity_2_ID], [Activity_2_Code], [Activity_2_Name],
        [Head], [mob], [Email], [ISActive], [Zoma], [Zoma_old],
        [X], [Y], [Change], [Reg_Date], [Partner], [Head_PN],
        [Partner_PN], [Init_Reg_date]
      FROM [register].[dbo].[DocMain]
      WHERE 1=1
    `;

    const request = pool.request();

    if (identificationNumber) {
      query += " AND Legal_Code = @identificationNumber";
      request.input("identificationNumber", sql.BigInt, identificationNumber);
    }

    if (organizationName) {
      query +=
        " AND (Full_Name LIKE @organizationName OR Abbreviation LIKE @organizationName)";
      request.input("organizationName", sql.NVarChar, `%${organizationName}%`);
    }

    if (legalForm) {
      query += " AND Legal_Form_ID = @legalForm";
      request.input("legalForm", sql.SmallInt, legalForm);
    }

    if (head) {
      query += " AND Head LIKE @head";
      request.input("head", sql.NVarChar, `%${head}%`);
    }
    
    if (partner) {
      query += " AND Partner LIKE @partner";
      request.input("partner", sql.NVarChar, `%${partner}%`);
    }

    if (req.query.activityCode) {
      const activityCodes = Array.isArray(req.query.activityCode) 
        ? req.query.activityCode 
        : [req.query.activityCode];

      if (activityCodes.length > 0) {
        const conditions = activityCodes.map((_, index) => 
          `(Activity_2_Code LIKE @activityCode${index})`
        ).join(' OR ');
        
        query += ` AND (${conditions})`;
        
        activityCodes.forEach((code, index) => {
          request.input(`activityCode${index}`, sql.NVarChar, `%${code}%`);
        });
      }
    }
    // Handle ownershipType
    if (ownershipType) {
      console.log('Ownership Type from request:', ownershipType, typeof ownershipType);
      query += " AND Ownership_Type_ID = @ownershipType";
      request.input("ownershipType", sql.Int, parseInt(ownershipType, 10));
    }

    if (isActive) {
      query += " AND ISActive = @isActive";
      request.input("isActive", sql.Int, isActive ? 1 : null);
    }

    console.log('Final SQL Query:', query);
    console.log('Query Parameters:', request.parameters);
    
    const result = await request.query(query);
    console.log('Query Results Count:', result.recordset.length);
    console.log('First few results:', result.recordset.slice(0, 2));
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
