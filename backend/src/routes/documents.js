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
          [Head], [mob], [Email], [web], [ISActive], [Zoma], [Zoma_old],
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
    const {
      identificationNumber,
      organizationName,
      legalForm,
      head,
      partner,
      ownershipType,
      isActive,
      x,
      y,
      size,
    } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT a.[Stat_ID], a.[Legal_Code], a.[Personal_no], a.[Legal_Form_ID],
        a.[Abbreviation], a.[Full_Name], a.[Ownership_Type_ID], a.[Ownership_Type],
        a.[Region_Code], a.[Region_name], a.[City_Code], a.[City_name],
        a.[Comunity_Code], a.[Community_name], a.[Village_Code], a.[Village_name],
        a.[Address], a.[Region_Code2], a.[Region_name2], a.[City_Code2],
        a.[City_name2], a.[Comunity_Code2], a.[Community_name2], a.[Village_Code2],
        a.[Village_name2], a.[Address2], a.[Activity_ID], a.[Activity_Code],
        a.[Activity_Name], a.[Activity_2_ID], a.[Activity_2_Code], a.[Activity_2_Name],
        a.[Head], a.[mob], a.[Email], a.[web], a.[ISActive], a.[Zoma], a.[Zoma_old],
        a.[X], a.[Y], a.[Change], a.[Reg_Date], a.[Partner], a.[Head_PN],
        a.[Partner_PN], a.[Init_Reg_date]
      FROM [register].[dbo].[DocMain] a
      WHERE 1=1
    `;

    const request = pool.request();

    if (identificationNumber) {
      query += " AND a.Legal_Code = @identificationNumber";
      request.input("identificationNumber", sql.BigInt, identificationNumber);
    }

    if (organizationName) {
      query +=
        " AND (a.Full_Name LIKE @organizationName OR a.Abbreviation LIKE @organizationName)";
      request.input("organizationName", sql.NVarChar, `%${organizationName}%`);
    }

    if (legalForm) {
      const legalForms = Array.isArray(legalForm) ? legalForm : [legalForm];
      const legalFormParams = legalForms.map((_, index) => `@legalForm${index}`).join(', ');
      query += ` AND a.Legal_Form_ID IN (${legalFormParams})`;
      
      legalForms.forEach((form, index) => {
        request.input(`legalForm${index}`, sql.SmallInt, form);
      });
    }

    if (head) {
      query += " AND a.Head LIKE @head";
      request.input("head", sql.NVarChar, `%${head}%`);
    }

    if (partner) {
      query += " AND a.Partner LIKE @partner";
      request.input("partner", sql.NVarChar, `%${partner}%`);
    }

    if (req.query.activityCode) {
      const activityCodes = Array.isArray(req.query.activityCode)
        ? req.query.activityCode
        : [req.query.activityCode];

      if (activityCodes.length > 0) {
        const conditions = [];
        
        activityCodes.forEach((code, index) => {
          // Check if it's a single letter (like F, G, etc.)
          if (code.length === 1 && /^[A-Z]$/i.test(code)) {
            // Map single letters to Activity_Root_ID values
            const letterToRootId = {
              'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 
              'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 
              'R': 18, 'S': 19, 'T': 20, 'U': 21
            };
            
            const rootId = letterToRootId[code.toUpperCase()];
            if (rootId) {
              conditions.push(`a.Activity_2_ID IN (SELECT ID FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${index})`);
              request.input(`rootId${index}`, sql.Int, rootId);
            }
          } else {
            // For detailed codes like "01.11.1", use the LIKE approach
            conditions.push(`(a.Activity_Code LIKE @activityCode${index} OR a.Activity_2_Code LIKE @activityCode${index})`);
            request.input(`activityCode${index}`, sql.NVarChar, `${code}%`);
          }
        });

        if (conditions.length > 0) {
          query += ` AND (${conditions.join(" OR ")})`;
        }
      }
    }

    // Handle legal address region
    if (req.query.legalAddressRegion) {
      query += " AND Region_Code = @regionCode";
      request.input(
        "regionCode",
        sql.NVarChar(50),
        req.query.legalAddressRegion
      );
    }

    // Handle legal address city/municipality
    if (req.query.legalAddressCity) {
      query += " AND City_Code = @cityCode";
      request.input("cityCode", sql.NVarChar(50), req.query.legalAddressCity);
    }

    // Handle legal address
    if (req.query.legalAddress) {
      query += " AND Address LIKE @address";
      request.input("address", sql.NVarChar, `%${req.query.legalAddress}%`);
    }

    // Handle factual address region
    if (req.query.factualAddressRegion) {
      query += " AND Region_Code2 = @regionCode2";
      request.input(
        "regionCode2",
        sql.NVarChar(50),
        req.query.factualAddressRegion
      );
    }

    // Handle factual address city/municipality
    if (req.query.factualAddressCity) {
      query += " AND City_Code2 = @cityCode2";
      request.input(
        "cityCode2",
        sql.NVarChar(50),
        req.query.factualAddressCity
      );
    }

    // Handle factual address
    if (req.query.factualAddress) {
      query += " AND Address2 LIKE @address2";
      request.input("address2", sql.NVarChar, `%${req.query.factualAddress}%`);
    }

    // Handle ownershipType
    if (ownershipType) {
      query += " AND Ownership_Type_ID = @ownershipType";
      request.input("ownershipType", sql.Int, parseInt(ownershipType, 10));
    }

    // Handle size/business form - size is a string value in Georgian
    if (size) {
      // Map size ID to Georgian text value
      let sizeText;
      switch (size) {
        case "1":
          sizeText = "მცირე";
          break;
        case "2":
          sizeText = "საშუალო";
          break;
        case "3":
          sizeText = "მსხვილი";
          break;
        default:
          console.warn("Unknown size value:", size);
          break;
      }
      if (sizeText) {
        query += " AND Zoma = @size";
        request.input("size", sql.NVarChar, sizeText);
      }
    }

    if (isActive) {
      query += " AND ISActive = @isActive";
      request.input("isActive", sql.Int, isActive ? 1 : null);
    }

    if (x === "true") {
      query += " AND X IS NOT NULL";
    }

    if (y === "true") {
      query += " AND Y IS NOT NULL";
    }

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
