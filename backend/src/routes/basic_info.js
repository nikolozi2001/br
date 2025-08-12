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
      activityCode,
      page = 1,
      limit = 100
    } = req.query;

    const pool = await poolPromise;
    const offset = (page - 1) * limit;

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

    // Add pagination
    query += ` ORDER BY Legal_Code OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const result = await request.query(query);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM [register].[dbo].[DocMain]
      WHERE 1=1
    `;

    const countRequest = pool.request();

    // Apply same filters for count
    if (identificationNumber) {
      countQuery += " AND Legal_Code = @identificationNumber";
      countRequest.input("identificationNumber", sql.BigInt, identificationNumber);
    }

    if (organizationName) {
      countQuery += " AND (Full_Name LIKE @organizationName OR Abbreviation LIKE @organizationName)";
      countRequest.input("organizationName", sql.NVarChar, `%${organizationName}%`);
    }

    if (legalForm) {
      countQuery += " AND Legal_Form_ID = @legalForm";
      countRequest.input("legalForm", sql.SmallInt, legalForm);
    }

    if (head) {
      countQuery += " AND Head LIKE @head";
      countRequest.input("head", sql.NVarChar, `%${head}%`);
    }

    if (partner) {
      countQuery += " AND Partner LIKE @partner";
      countRequest.input("partner", sql.NVarChar, `%${partner}%`);
    }

    if (ownershipType) {
      countQuery += " AND Ownership_Type_ID = @ownershipType";
      countRequest.input("ownershipType", sql.SmallInt, ownershipType);
    }

    if (isActive !== undefined) {
      countQuery += " AND ISActive = @isActive";
      countRequest.input("isActive", sql.Bit, isActive === 'true');
    }

    if (activityCode) {
      const activityCodes = Array.isArray(activityCode) ? activityCode : [activityCode];
      const activityCodeParams = activityCodes.map((_, index) => `@activityCode${index}`).join(', ');
      countQuery += ` AND Activity_2_Code IN (${activityCodeParams})`;
      
      activityCodes.forEach((code, index) => {
        countRequest.input(`activityCode${index}`, sql.NVarChar, code);
      });
    }

    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

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
