const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// Get basic info with only specified fields
router.get("/", async (req, res) => {
  try {
    const {
      identificationNumber,
      organizationName,
      legalForm,
      head,
      partner,
      ownershipType,
      isActive,
      activityCode
    } = req.query;

    const pool = await poolPromise;

    let query = `
      SELECT [Legal_Code], [Full_Name], [Activity_2_Name], [Abbreviation], [X], [Y]
      FROM [register].[dbo].[DocMain]
      WHERE 1=1
    `;

    const request = pool.request();

    // Add filters based on query parameters
    if (identificationNumber) {
      query += " AND Legal_Code = @identificationNumber";
      request.input("identificationNumber", sql.BigInt, identificationNumber);
    }

    if (organizationName) {
      query += " AND (Full_Name LIKE @organizationName OR Abbreviation LIKE @organizationName)";
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

    if (ownershipType) {
      query += " AND Ownership_Type_ID = @ownershipType";
      request.input("ownershipType", sql.SmallInt, ownershipType);
    }

    if (isActive !== undefined) {
      query += " AND ISActive = @isActive";
      request.input("isActive", sql.Bit, isActive === 'true');
    }

    if (activityCode) {
      const activityCodes = Array.isArray(activityCode) ? activityCode : [activityCode];
      const activityCodeParams = activityCodes.map((_, index) => `@activityCode${index}`).join(', ');
      query += ` AND Activity_2_Code IN (${activityCodeParams})`;
      
      activityCodes.forEach((code, index) => {
        request.input(`activityCode${index}`, sql.NVarChar, code);
      });
    }

    // Order by Legal_Code
    query += " ORDER BY Legal_Code";

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error("Error fetching basic info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get basic info by specific legal code
router.get("/legal_code/:legalCode", async (req, res) => {
  try {
    const { legalCode } = req.params;
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("legalCode", sql.BigInt, legalCode)
      .query(`
        SELECT [Legal_Code], [Full_Name], [Activity_2_Name], [Abbreviation], [X], [Y]
        FROM [register].[dbo].[DocMain]
        WHERE Legal_Code = @legalCode
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching basic info by legal code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
