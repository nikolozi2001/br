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

// Whitelist of sortable result-fields → DB columns (prevents SQL injection)
const SORT_COLUMN_MAP = {
  identificationNumber:   "Legal_Code",
  personalNumber:         "Personal_no",
  abbreviation:           "Abbreviation",
  name:                   "Full_Name",
  "legalAddress.region":  "Region_name",
  "legalAddress.city":    "City_name",
  "legalAddress.address": "Address",
  "factualAddress.region":  "Region_name2",
  "factualAddress.city":    "City_name2",
  "factualAddress.address": "Address2",
  "activities.0.name":    "Activity_2_Name",
  head:                   "Head",
  ownershipType:          "Ownership_Type",
  isActive:               "ISActive",
  size:                   "Zoma",
  Init_Reg_date:          "Init_Reg_date",
};

// CSV helpers
const csvCol  = (col) => `ISNULL('"' + REPLACE(CAST(${col} AS NVARCHAR(MAX)), '"', '""') + '"', '""')`;
const csvDate = (col) => `ISNULL('"' + CONVERT(NVARCHAR(10), ${col}, 120) + '"', '""')`;

// ─── Shared WHERE clause builder ──────────────────────────────────────────────

/**
 * Turns a repeated (`?p=a&p=b`), comma-joined (`?p=a,b`) or single (`?p=a`)
 * query value into an ` AND col IN (@n0,@n1)` fragment. `map` converts each raw
 * value; returning null/undefined drops it, and an empty result drops the whole
 * clause so an unusable filter never narrows the search.
 */
function inClause(request, column, raw, name, type, map = (v) => v) {
  if (raw === undefined || raw === null || raw === "") return "";
  const values = (Array.isArray(raw) ? raw : String(raw).split(","))
    .map((v) => String(v).trim())
    .filter(Boolean)
    .map(map)
    .filter((v) => v !== null && v !== undefined);
  if (!values.length) return "";
  const params = values
    .map((v, i) => { request.input(`${name}${i}`, type, v); return `@${name}${i}`; })
    .join(",");
  return ` AND ${column} IN (${params})`;
}

const toIntOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

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
  where += inClause(request, "a.Legal_Form_ID", legalForm, "lf", sql.SmallInt, toIntOrNull);
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
  // Location codes never contain a comma, so ?p=a,b splitting is safe for them too.
  where += inClause(request, "Region_Code",  query.legalAddressRegion, "reg1",  sql.NVarChar(50));
  where += inClause(request, "City_Code",    query.legalAddressCity,   "city1", sql.NVarChar(50));
  if (query.legalAddress)       { where += " AND Address LIKE @addr1";   request.input("addr1", sql.NVarChar,     `%${query.legalAddress}%`); }
  where += inClause(request, "Region_Code2", query.factualAddressRegion, "reg2",  sql.NVarChar(50));
  where += inClause(request, "City_Code2",   query.factualAddressCity,   "city2", sql.NVarChar(50));
  if (query.factualAddress)       { where += " AND Address2 LIKE @addr2"; request.input("addr2", sql.NVarChar,     `%${query.factualAddress}%`); }
  where += inClause(request, "Ownership_Type_ID", ownershipType, "ownType", sql.Int, toIntOrNull);
  // ?size=1&size=2 (array), ?size=1,2 (comma), ?size=1 (single) — ყველა ვარიანტი
  where += inClause(request, "Zoma", size, "sizeT", sql.NVarChar, (s) => SIZE_MAP[s] ?? null);
  if (isActive) {
    where += " AND ISActive = @isAct";
    request.input("isAct", sql.Int, isActive === "true" || isActive === "1" ? 1 : 0);
  }
  if (x === "true") where += " AND X IS NOT NULL";
  if (y === "true") where += " AND Y IS NOT NULL";

  return where;
}

// ─── Display values ───────────────────────────────────────────────────────────

/**
 * DocMain carries the abbreviation ("შპს") but not the spelled-out legal form,
 * only its id — so every caller that wanted the full name got the abbreviation
 * instead. `/documents/export` has always joined this table for its CSV; the
 * search endpoint now does too, in both languages.
 */
const LEGAL_FORM_JOIN = `
  LEFT JOIN [register].[CL].[Legal_Forms] lfg ON lfg.ID = p.Legal_Form_ID
`;

const LEGAL_FORM_COLUMN = `
  , lfg.Legal_Form AS Legal_Form
`;

/**
 * DocMain stores the rest of its display text in Georgian only; the English
 * wording lives in parallel `*_EN` lookup tables (the same ones `/locations`,
 * `/legal-forms` and friends already read). The joins run over the *page* rather
 * than the filtered set — see the derived table in the route below — so
 * localisation costs a handful of lookups instead of a join across every match.
 *
 * `Zoma` is the odd one out: DocMain holds the Georgian word, not the size id,
 * so it goes through `Size` to reach `Size_EN`.
 */
const EN_JOINS = `
  LEFT JOIN [register].[CL].[Legal_Forms_EN]      lf    ON lf.ID = p.Legal_Form_ID
  LEFT JOIN [register].[CL].[Ownership_Types_EN]  ot    ON ot.ID = p.Ownership_Type_ID
  LEFT JOIN [register].[CL].[Activities_NACE2_EN] ac    ON ac.ID = p.Activity_2_ID
  LEFT JOIN [register].[CL].[Locations_EN]        reg   ON reg.Location_Code   = p.Region_Code
  LEFT JOIN [register].[CL].[Locations_EN]        city  ON city.Location_Code  = p.City_Code
  LEFT JOIN [register].[CL].[Locations_EN]        comm  ON comm.Location_Code  = p.Comunity_Code
  LEFT JOIN [register].[CL].[Locations_EN]        vill  ON vill.Location_Code  = p.Village_Code
  LEFT JOIN [register].[CL].[Locations_EN]        reg2  ON reg2.Location_Code  = p.Region_Code2
  LEFT JOIN [register].[CL].[Locations_EN]        city2 ON city2.Location_Code = p.City_Code2
  LEFT JOIN [register].[CL].[Locations_EN]        comm2 ON comm2.Location_Code = p.Comunity_Code2
  LEFT JOIN [register].[CL].[Locations_EN]        vill2 ON vill2.Location_Code = p.Village_Code2
  LEFT JOIN [register].[dbo].[Size]               szg   ON szg.zoma = p.Zoma
  LEFT JOIN [register].[dbo].[Size_EN]            szen  ON szen.id  = szg.id
`;

const EN_COLUMNS = `
  , lf.Legal_Form       AS Legal_Form_EN
  , lf.Abbreviation     AS Abbreviation_EN
  , ot.Ownership_Type   AS Ownership_Type_EN
  , ac.Activity_Name    AS Activity_2_Name_EN
  , reg.Location_Name   AS Region_name_EN
  , city.Location_Name  AS City_name_EN
  , comm.Location_Name  AS Community_name_EN
  , vill.Location_Name  AS Village_name_EN
  , reg2.Location_Name  AS Region_name2_EN
  , city2.Location_Name AS City_name2_EN
  , comm2.Location_Name AS Community_name2_EN
  , vill2.Location_Name AS Village_name2_EN
  , szen.zoma           AS Zoma_EN
`;

/** Georgian field ← its English counterpart in the aliased columns above. */
const EN_FIELDS = {
  Legal_Form:      "Legal_Form_EN",
  Abbreviation:    "Abbreviation_EN",
  Ownership_Type:  "Ownership_Type_EN",
  Activity_2_Name: "Activity_2_Name_EN",
  Region_name:     "Region_name_EN",
  City_name:       "City_name_EN",
  Community_name:  "Community_name_EN",
  Village_name:    "Village_name_EN",
  Region_name2:    "Region_name2_EN",
  City_name2:      "City_name2_EN",
  Community_name2: "Community_name2_EN",
  Village_name2:   "Village_name2_EN",
  Zoma:            "Zoma_EN",
};

/**
 * Moves the `*_EN` values onto the field names the clients already read, then
 * drops the extras. A missing translation leaves the Georgian text in place —
 * a filled row in the wrong language beats an empty one.
 */
function toEnglish(row) {
  for (const [field, source] of Object.entries(EN_FIELDS)) {
    const value = row[source];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      row[field] = value;
    }
    delete row[source];
  }
  return row;
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

    // Sorting — column is whitelisted, direction is constrained; Legal_Code is the stable tiebreaker
    const sortColumn = SORT_COLUMN_MAP[req.query.sortBy] || "Legal_Code";
    const sortDir    = String(req.query.sortDir).toLowerCase() === "desc" ? "DESC" : "ASC";
    const orderByOn  = (alias) => sortColumn === "Legal_Code"
      ? `${alias}.[Legal_Code] ${sortDir}`
      : `${alias}.[${sortColumn}] ${sortDir}, ${alias}.[Legal_Code] ASC`;

    request.input("offset", sql.Int, offset);
    request.input("limit",  sql.Int, limitInt);

    const page_ = `SELECT a.* FROM [register].[dbo].[DocMain] a ${whereClause} ORDER BY ${orderByOn("a")} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    // The lookups hang off a derived table that has already been paged, so they
    // run over one page of rows rather than every match. The outer ORDER BY is
    // required: a derived table carries no ordering of its own.
    //
    // Both languages resolve the legal form; `lang=en` additionally swaps the
    // rest of the display text for its English counterpart.
    const english = req.query.lang === "en";
    const columns = LEGAL_FORM_COLUMN + (english ? EN_COLUMNS : "");
    const joins = LEGAL_FORM_JOIN + (english ? EN_JOINS : "");
    const result = await request.query(
      `SELECT p.* ${columns} FROM (${page_}) p ${joins} ORDER BY ${orderByOn("p")}`
    );

    res.json({
      data: english ? result.recordset.map(toEnglish) : result.recordset,
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
        ${csvCol("CASE WHEN a.ISActive = 1 THEN N'აქტიური' ELSE N'არააქტიური' END")} + ',' + ${csvCol("a.Zoma")} + ',' + ${csvDate("a.Init_Reg_date")} AS CsvLine
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
