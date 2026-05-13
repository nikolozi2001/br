const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

// ─── Constants ────────────────────────────────────────────────────────────────

const LETTER_TO_ROOT_ID = {
  A: 1,  B: 2,  C: 3,  D: 4,  E: 5,  F: 6,  G: 7,
  H: 8,  I: 9,  J: 10, K: 11, L: 12, M: 13, N: 14,
  O: 15, P: 16, Q: 17, R: 18, S: 19, T: 20, U: 21, Z: 1690,
};

const SIZE_MAP = { "1": "მცირე", "2": "საშუალო", "3": "მსხვილი" };

// CSV helpers
const csvCol  = (col) => `ISNULL('"' + REPLACE(CAST(${col} AS NVARCHAR(MAX)), '"', '""') + '"', '""')`;
const csvDate = (col) => `ISNULL('"' + CONVERT(NVARCHAR(10), ${col}, 120) + '"', '""')`;

// ─── Shared WHERE clause builder ──────────────────────────────────────────────

function buildWhereClause(query, request) {
  const { identificationNumber, organizationName, legalForm, head, partner, ownershipType, isActive, x, y, size } = query;
  let where = " WHERE 1=1";

  if (identificationNumber) {
    where += " AND a.Legal_Code = @idNum";
    request.input("idNum", sql.BigInt, identificationNumber);
  }
  if (organizationName) {
    where += " AND (a.Full_Name LIKE @orgName OR a.Abbreviation LIKE @orgName)";
    request.input("orgName", sql.NVarChar, `%${organizationName}%`);
  }
  if (legalForm) {
    const forms = Array.isArray(legalForm) ? legalForm : [legalForm];
    const params = forms.map((f, i) => { request.input(`lf${i}`, sql.SmallInt, f); return `@lf${i}`; }).join(",");
    where += ` AND a.Legal_Form_ID IN (${params})`;
  }
  if (head) {
    where += " AND a.Head LIKE @head";
    request.input("head", sql.NVarChar, `%${head}%`);
  }
  if (partner) {
    where += " AND a.Partner LIKE @partner";
    request.input("partner", sql.NVarChar, `%${partner}%`);
  }
  if (query.activityCode) {
    const codes = Array.isArray(query.activityCode) ? query.activityCode : [query.activityCode];
    const conditions = [];
    codes.forEach((code, i) => {
      if (code.length === 1 && /^[A-Z]$/i.test(code)) {
        const rootId = LETTER_TO_ROOT_ID[code.toUpperCase()];
        if (rootId) {
          conditions.push(`a.Activity_2_ID IN (SELECT ID FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${i})`);
          request.input(`rootId${i}`, sql.Int, rootId);
        }
      } else {
        conditions.push(`a.Activity_2_Code LIKE @actCode${i}`);
        request.input(`actCode${i}`, sql.NVarChar, `${code}%`);
      }
    });
    if (conditions.length > 0) where += ` AND (${conditions.join(" OR ")})`;
  }
  if (query.legalAddressRegion) { where += " AND Region_Code = @reg1";   request.input("reg1",  sql.NVarChar(50), query.legalAddressRegion); }
  if (query.legalAddressCity)   { where += " AND City_Code = @city1";    request.input("city1", sql.NVarChar(50), query.legalAddressCity); }
  if (query.legalAddress)       { where += " AND Address LIKE @addr1";   request.input("addr1", sql.NVarChar,     `%${query.legalAddress}%`); }
  if (query.factualAddressRegion) { where += " AND Region_Code2 = @reg2"; request.input("reg2",  sql.NVarChar(50), query.factualAddressRegion); }
  if (query.factualAddressCity)   { where += " AND City_Code2 = @city2";  request.input("city2", sql.NVarChar(50), query.factualAddressCity); }
  if (query.factualAddress)       { where += " AND Address2 LIKE @addr2"; request.input("addr2", sql.NVarChar,     `%${query.factualAddress}%`); }
  if (ownershipType) {
    where += " AND Ownership_Type_ID = @ownType";
    request.input("ownType", sql.Int, parseInt(ownershipType, 10));
  }
  if (size && SIZE_MAP[size]) {
    where += " AND Zoma = @sizeT";
    request.input("sizeT", sql.NVarChar, SIZE_MAP[size]);
  }
  if (isActive) {
    where += " AND ISActive = @isAct";
    request.input("isAct", sql.Int, isActive === "true" || isActive === "1" ? 1 : 0);
  }
  if (x === "true") where += " AND X IS NOT NULL";
  if (y === "true") where += " AND Y IS NOT NULL";

  return where;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/legal_code/:legalCode", async (req, res) => {
  try {
    const { legalCode } = req.params;
    const pool = await poolPromise;
    const result = await pool.request().input("legalCode", sql.BigInt, legalCode).query(`
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
    const { page = 1, limit = 1000 } = req.query;
    const pool = await poolPromise;
    const offset   = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit) || 1000;

    const request = pool.request();
    const whereClause = buildWhereClause(req.query, request);

    // Count query — copy parameters to a fresh request
    const countRequest = pool.request();
    for (const key in request.parameters) {
      countRequest.input(key, request.parameters[key].type, request.parameters[key].value);
    }
    const countResult = await countRequest.query(
      `SELECT COUNT(*) as total FROM [register].[dbo].[DocMain] a ${whereClause}`
    );
    const totalRecords = countResult.recordset[0].total;

    request.input("offset", sql.Int, offset);
    request.input("limit",  sql.Int, limitInt);
    const result = await request.query(
      `SELECT a.* FROM [register].[dbo].[DocMain] a ${whereClause} ORDER BY a.Legal_Code OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );

    res.json({
      data: result.recordset,
      pagination: { page: parseInt(page), limit: limitInt, total: totalRecords, totalPages: Math.ceil(totalRecords / limitInt) },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/export", async (req, res) => {
  let request;
  try {
    const pool = await poolPromise;
    request = pool.request();
    request.stream = true;

    const whereClause = buildWhereClause(req.query, request);

    const query = `
      SELECT
        ${csvCol("a.Legal_Code")} + ',' + ${csvCol("a.Personal_no")} + ',' + ${csvCol("lf.Legal_Form")} + ',' +
        ${csvCol("a.Full_Name")} + ',' + ${csvCol("a.Region_name")} + ',' + ${csvCol("a.City_name")} + ',' +
        ${csvCol("a.Address")} + ',' + ${csvCol("a.Region_name2")} + ',' + ${csvCol("a.City_name2")} + ',' +
        ${csvCol("a.Address2")} + ',' + ${csvCol("a.Activity_2_Code")} + ',' + ${csvCol("a.Activity_2_Name")} + ',' +
        ${csvCol("a.Head")} + ',' + ${csvCol("a.Partner")} + ',' + ${csvCol("a.mob")} + ',' +
        ${csvCol("a.Email")} + ',' + ${csvCol("a.web")} + ',' + ${csvCol("a.Ownership_Type")} + ',' +
        ${csvCol("CASE WHEN a.ISActive = 1 THEN N'აქტიური' ELSE N'არааქტიური' END")} + ',' + ${csvCol("a.Zoma")} + ',' + ${csvDate("a.Init_Reg_date")} AS CsvLine
      FROM [register].[dbo].[DocMain] a
      LEFT JOIN [register].[CL].[Legal_Forms] lf ON lf.ID = a.Legal_Form_ID
      ${whereClause}
    `;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="export_${Date.now()}.csv"`);
    res.write("﻿");

    const headers = [
      "Legal_Code","Personal_no","Legal_Form_ID","Full_Name","Region_name","City_name","Address",
      "Region_name2","City_name2","Address2","Activity_2_Code","Activity_2_Name","Head","Partner",
      "mob","Email","web","Ownership_Type","ISActive","Zoma","Init_Reg_date",
    ];
    res.write(headers.map((h) => `"${h}"`).join(",") + "\n");

    let buffer = "";
    let count  = 0;

    request.on("row", (row) => {
      buffer += row.CsvLine + "\n";
      count++;
      if (count % 5000 === 0) { res.write(buffer); buffer = ""; }
    });
    request.on("done", () => { if (buffer) res.write(buffer); res.end(); });
    request.on("error", (err) => {
      console.error("Stream error during export:", err);
      if (!res.headersSent) res.status(500).send("Export Error");
      else res.end();
    });

    req.on("close", () => { if (request) request.cancel(); });
    request.query(query);

  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
