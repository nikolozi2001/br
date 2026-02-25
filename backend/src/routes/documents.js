const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// Cache for district mappings (შენარჩუნებულია ორიგინალიდან)
let districtMappingCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000;

// დამხმარე ფუნქცია SQL-ში CSV სტრიქონის უსაფრთხოდ ასაწყობად
const csvCol = (col) => `ISNULL('"' + REPLACE(CAST(${col} AS NVARCHAR(MAX)), '"', '""') + '"', '""')`;
const csvDate = (col) => `ISNULL('"' + CONVERT(NVARCHAR(10), ${col}, 120) + '"', '""')`;

// 1. GET /legal_code/:legalCode (ორიგინალი უცვლელად)
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

// 2. GET / (პაგინირებული სია - ორიგინალი უცვლელად)
router.get("/", async (req, res) => {
  try {
    const {
      identificationNumber, organizationName, legalForm, head, partner,
      ownershipType, isActive, x, y, size, page = 1, limit = 1000
    } = req.query;
    const pool = await poolPromise;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit) || 1000;

    let whereClause = " WHERE 1=1";
    const request = pool.request();

    if (identificationNumber) {
      whereClause += " AND a.Legal_Code = @idNum";
      request.input("idNum", sql.BigInt, identificationNumber);
    }
    if (organizationName) {
      whereClause += " AND (a.Full_Name LIKE @orgName OR a.Abbreviation LIKE @orgName)";
      request.input("orgName", sql.NVarChar, `%${organizationName}%`);
    }
    if (legalForm) {
      const forms = Array.isArray(legalForm) ? legalForm : [legalForm];
      const params = forms.map((f, i) => { request.input(`lf${i}`, sql.SmallInt, f); return `@lf${i}`; }).join(',');
      whereClause += ` AND a.Legal_Form_ID IN (${params})`;
    }
    if (head) {
      whereClause += " AND a.Head LIKE @head";
      request.input("head", sql.NVarChar, `%${head}%`);
    }
    if (partner) {
      whereClause += " AND a.Partner LIKE @partner";
      request.input("partner", sql.NVarChar, `%${partner}%`);
    }
    if (req.query.activityCode) {
      const activityCodes = Array.isArray(req.query.activityCode) ? req.query.activityCode : [req.query.activityCode];
      const conditions = [];
      activityCodes.forEach((code, index) => {
        if (code.length === 1 && /^[A-Z]$/i.test(code)) {
          const letterToRootId = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18, 'S': 19, 'T': 20, 'U': 21, 'Z': 1690 };
          const rootId = letterToRootId[code.toUpperCase()];
          if (rootId) {
            conditions.push(`a.Activity_2_ID IN (SELECT ID FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${index})`);
            request.input(`rootId${index}`, sql.Int, rootId);
          }
        } else {
          conditions.push(`a.Activity_2_Code LIKE @actCode${index}`);
          request.input(`actCode${index}`, sql.NVarChar, `${code}%`);
        }
      });
      if (conditions.length > 0) whereClause += ` AND (${conditions.join(" OR ")})`;
    }
    if (req.query.legalAddressRegion) {
      whereClause += " AND Region_Code = @reg1";
      request.input("reg1", sql.NVarChar(50), req.query.legalAddressRegion);
    }
    if (req.query.legalAddressCity) {
      whereClause += " AND City_Code = @city1";
      request.input("city1", sql.NVarChar(50), req.query.legalAddressCity);
    }
    if (req.query.legalAddress) {
      whereClause += " AND Address LIKE @addr1";
      request.input("addr1", sql.NVarChar, `%${req.query.legalAddress}%`);
    }
    if (req.query.factualAddressRegion) {
      whereClause += " AND Region_Code2 = @reg2";
      request.input("reg2", sql.NVarChar(50), req.query.factualAddressRegion);
    }
    if (req.query.factualAddressCity) {
      whereClause += " AND City_Code2 = @city2";
      request.input("city2", sql.NVarChar(50), req.query.factualAddressCity);
    }
    if (req.query.factualAddress) {
      whereClause += " AND Address2 LIKE @addr2";
      request.input("addr2", sql.NVarChar, `%${req.query.factualAddress}%`);
    }
    if (ownershipType) {
      whereClause += " AND Ownership_Type_ID = @ownType";
      request.input("ownType", sql.Int, parseInt(ownershipType, 10));
    }
    if (size) {
      const sizeText = size === "1" ? "მცირე" : size === "2" ? "საშუალო" : size === "3" ? "მსხვილი" : null;
      if (sizeText) { whereClause += " AND Zoma = @sizeT"; request.input("sizeT", sql.NVarChar, sizeText); }
    }
    if (isActive) {
      whereClause += " AND ISActive = @isAct";
      request.input("isAct", sql.Int, isActive === 'true' || isActive === '1' ? 1 : 0);
    }
    if (x === "true") whereClause += " AND X IS NOT NULL";
    if (y === "true") whereClause += " AND Y IS NOT NULL";

    // Count Query
    const countRequest = pool.request();
    // Copy parameters to countRequest
    for (const key in request.parameters) {
        countRequest.input(key, request.parameters[key].type, request.parameters[key].value);
    }
    const countResult = await countRequest.query(`SELECT COUNT(*) as total FROM [register].[dbo].[DocMain] a ${whereClause}`);
    const totalRecords = countResult.recordset[0].total;

    // Data Query
    const query = `SELECT a.* FROM [register].[dbo].[DocMain] a ${whereClause} ORDER BY a.Legal_Code OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limitInt);
    
    const result = await request.query(query);
    res.json({
      data: result.recordset,
      pagination: { page: parseInt(page), limit: limitInt, total: totalRecords, totalPages: Math.ceil(totalRecords / limitInt) }
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// 3. GET /export (ოპტიმიზირებული ექსპორტი - სრული ფუნქციონალით)
router.get("/export", async (req, res) => {
  let request;
  try {
    const {
      identificationNumber, organizationName, legalForm, head, partner,
      ownershipType, isActive, x, y, size
    } = req.query;

    const pool = await poolPromise;
    request = pool.request();
    request.stream = true;

    // ვამზადებთ WHERE პირობას (ზუსტად იგივე რაც ზემოთ)
    let whereClause = " WHERE 1=1";
    
    if (identificationNumber) {
      whereClause += " AND a.Legal_Code = @idNum";
      request.input("idNum", sql.BigInt, identificationNumber);
    }
    if (organizationName) {
      whereClause += " AND (a.Full_Name LIKE @orgName OR a.Abbreviation LIKE @orgName)";
      request.input("orgName", sql.NVarChar, `%${organizationName}%`);
    }
    if (legalForm) {
      const forms = Array.isArray(legalForm) ? legalForm : [legalForm];
      const params = forms.map((f, i) => { request.input(`lf${i}`, sql.SmallInt, f); return `@lf${i}`; }).join(',');
      whereClause += ` AND a.Legal_Form_ID IN (${params})`;
    }
    if (head) {
        whereClause += " AND a.Head LIKE @head";
        request.input("head", sql.NVarChar, `%${head}%`);
    }
    if (partner) {
        whereClause += " AND a.Partner LIKE @partner";
        request.input("partner", sql.NVarChar, `%${partner}%`);
    }
    if (req.query.activityCode) {
        const activityCodes = Array.isArray(req.query.activityCode) ? req.query.activityCode : [req.query.activityCode];
        const actConditions = [];
        activityCodes.forEach((code, index) => {
          if (code.length === 1 && /^[A-Z]$/i.test(code)) {
            const letterToRootId = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18, 'S': 19, 'T': 20, 'U': 21, 'Z': 1690 };
            const rootId = letterToRootId[code.toUpperCase()];
            if (rootId) {
              actConditions.push(`a.Activity_2_ID IN (SELECT ID FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${index})`);
              request.input(`rootId${index}`, sql.Int, rootId);
            }
          } else {
            actConditions.push(`a.Activity_2_Code LIKE @actCode${index}`);
            request.input(`actCode${index}`, sql.NVarChar, `${code}%`);
          }
        });
        if (actConditions.length > 0) whereClause += ` AND (${actConditions.join(" OR ")})`;
    }
    // მისამართების ფილტრები
    if (req.query.legalAddressRegion) { whereClause += " AND Region_Code = @r1"; request.input("r1", sql.NVarChar(50), req.query.legalAddressRegion); }
    if (req.query.legalAddressCity) { whereClause += " AND City_Code = @c1"; request.input("c1", sql.NVarChar(50), req.query.legalAddressCity); }
    if (req.query.legalAddress) { whereClause += " AND Address LIKE @a1"; request.input("a1", sql.NVarChar, `%${req.query.legalAddress}%`); }
    if (req.query.factualAddressRegion) { whereClause += " AND Region_Code2 = @r2"; request.input("r2", sql.NVarChar(50), req.query.factualAddressRegion); }
    if (req.query.factualAddressCity) { whereClause += " AND City_Code2 = @c2"; request.input("c2", sql.NVarChar(50), req.query.factualAddressCity); }
    if (req.query.factualAddress) { whereClause += " AND Address2 LIKE @a2"; request.input("a2", sql.NVarChar, `%${req.query.factualAddress}%`); }
    
    if (ownershipType) { whereClause += " AND Ownership_Type_ID = @oT"; request.input("oT", sql.Int, parseInt(ownershipType, 10)); }
    if (size) {
        const sT = size === "1" ? "მცირე" : size === "2" ? "საშუალო" : size === "3" ? "მსხვილი" : null;
        if (sT) { whereClause += " AND Zoma = @sT"; request.input("sT", sql.NVarChar, sT); }
    }
    if (isActive) { whereClause += " AND ISActive = @iA"; request.input("iA", sql.Int, isActive === 'true' || isActive === '1' ? 1 : 0); }
    if (x === "true") whereClause += " AND X IS NOT NULL";
    if (y === "true") whereClause += " AND Y IS NOT NULL";

    // SQL-ში პირდაპირ ვაწყობთ CSV ხაზს
    const query = `
      SELECT 
        ${csvCol("a.Legal_Code")} + ',' + ${csvCol("a.Personal_no")} + ',' + ${csvCol("a.Legal_Form_ID")} + ',' +
        ${csvCol("a.Full_Name")} + ',' + ${csvCol("a.Region_name")} + ',' + ${csvCol("a.City_name")} + ',' +
        ${csvCol("a.Address")} + ',' + ${csvCol("a.Region_name2")} + ',' + ${csvCol("a.City_name2")} + ',' +
        ${csvCol("a.Address2")} + ',' + ${csvCol("a.Activity_2_Code")} + ',' + ${csvCol("a.Activity_2_Name")} + ',' +
        ${csvCol("a.Head")} + ',' + ${csvCol("a.Partner")} + ',' + ${csvCol("a.mob")} + ',' +
        ${csvCol("a.Email")} + ',' + ${csvCol("a.web")} + ',' + ${csvCol("a.Ownership_Type")} + ',' +
        ${csvCol("a.ISActive")} + ',' + ${csvCol("a.Zoma")} + ',' + ${csvDate("a.Init_Reg_date")} AS CsvLine
      FROM [register].[dbo].[DocMain] a 
      ${whereClause}
    `;

    // Response Settings
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="export_${new Date().getTime()}.csv"`);
    res.write('\ufeff');

    const headers = [
      'Legal_Code', 'Personal_no', 'Legal_Form_ID', 'Full_Name', 'Region_name', 'City_name', 'Address',
      'Region_name2', 'City_name2', 'Address2', 'Activity_2_Code', 'Activity_2_Name', 'Head', 'Partner',
      'mob', 'Email', 'web', 'Ownership_Type', 'ISActive', 'Zoma', 'Init_Reg_date'
    ];
    res.write(headers.map(h => `"${h}"`).join(',') + '\n');

    let buffer = '';
    let count = 0;
    
    request.on('row', row => {
      buffer += row.CsvLine + '\n';
      count++;
      if (count % 5000 === 0) {
        res.write(buffer);
        buffer = '';
      }
    });

    request.on('done', () => {
      if (buffer) res.write(buffer);
      res.end();
    });

    request.on('error', err => {
        console.error("Stream Error:", err);
        if (!res.headersSent) res.status(500).send("Export Error");
        res.end();
    });

    req.on('close', () => { if (request) request.cancel(); });

    request.query(query);

  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;