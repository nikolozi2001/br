const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

const LETTER_TO_ROOT_ID = {
  A: 1,  B: 2,  C: 3,  D: 4,  E: 5,  F: 6,  G: 7,
  H: 8,  I: 9,  J: 10, K: 11, L: 12, M: 13, N: 14,
  O: 15, P: 16, Q: 17, R: 18, S: 19, T: 20, U: 21, Z: 1690,
};

router.get("/", async (req, res) => {
  try {
    const { city, search } = req.query;
    const legalForm = req.query.legalForm || req.query.leg;
    const activity  = req.query.activity  || req.query.act;

    if (!city || city.trim() === "") {
      return res.status(400).json({ error: "City parameter is required" });
    }

    const cityCode = parseInt(city);
    if (isNaN(cityCode)) {
      return res.status(400).json({ error: "City must be a valid region code" });
    }

    let whereClause = " WHERE [Region_Code2] = @city AND [ISActive] = 1";
    let activityWhereClause = "";

    if (legalForm && legalForm.trim() !== "") {
      const legalFormId = parseInt(legalForm);
      if (!isNaN(legalFormId)) whereClause += " AND [Legal_Form_ID] = @legalForm";
    }

    if (activity && activity.trim() !== "") {
      const codes = activity.split(",").map((c) => c.trim()).filter(Boolean);
      if (codes.length > 0) {
        const conditions = codes.map((code, i) => {
          if (code.length === 1 && /^[A-Z]$/i.test(code)) {
            return LETTER_TO_ROOT_ID[code.toUpperCase()]
              ? `[Activity_2_ID] IN (SELECT [ID] FROM [register].[CL].[Activities_NACE2] WHERE [Activity_Root_ID] = @rootId${i})`
              : null;
          }
          return `[Activity_2_Code] LIKE @activityCode${i}`;
        }).filter(Boolean);
        if (conditions.length > 0) activityWhereClause = ` AND (${conditions.join(" OR ")})`;
      }
    }

    if (search && search.trim() !== "") whereClause += " AND [Full_Name] LIKE @search";

    const pool = await poolPromise;
    const request = pool.request();
    request.input("city", sql.Int, cityCode);

    if (legalForm && legalForm.trim() !== "") {
      const legalFormId = parseInt(legalForm);
      if (!isNaN(legalFormId)) request.input("legalForm", sql.SmallInt, legalFormId);
    }

    if (activity && activity.trim() !== "") {
      const codes = activity.split(",").map((c) => c.trim()).filter(Boolean);
      codes.forEach((code, i) => {
        if (code.length === 1 && /^[A-Z]$/i.test(code)) {
          const rootId = LETTER_TO_ROOT_ID[code.toUpperCase()];
          if (rootId) request.input(`rootId${i}`, sql.Int, rootId);
        } else {
          request.input(`activityCode${i}`, sql.NVarChar, `${code}%`);
        }
      });
    }

    if (search && search.trim() !== "") request.input("search", sql.NVarChar, `%${search}%`);

    const result = await request.query(`
      SELECT
        [Stat_ID],[Legal_Code],[Personal_no],[Legal_Form_ID],[Abbreviation],[Full_Name],
        [Ownership_Type_ID],[Ownership_Type],[Region_Code],[Region_name],[City_Code],[City_name],
        [Comunity_Code],[Community_name],[Village_Code],[Village_name],[Address],
        [Region_Code2],[Region_name2],[City_Code2],[City_name2],[Comunity_Code2],[Community_name2],
        [Village_Code2],[Village_name2],[Address2],[Activity_ID],[Activity_Code],[Activity_Name],
        [Activity_2_ID],[Activity_2_Code],[Activity_2_Name],[Head],[mob],[Email],[ISActive],
        [Zoma],[Zoma_old],[X],[Y],[Change],[Reg_Date],[Partner],[Head_PN],[Partner_PN],[Init_Reg_date],[web]
      FROM [register].[dbo].[DocMain]
      ${whereClause}
      ${activityWhereClause}
      ORDER BY [Full_Name]
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error in GIS search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/cities", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT DISTINCT
        [Region_Code2] AS code, [Region_name2] AS name,
        [City_Code2] AS cityCode, [City_name2] AS cityName
      FROM [register].[dbo].[DocMain]
      WHERE [ISActive] = 1 AND [Region_Code2] IS NOT NULL AND [City_name2] IS NOT NULL
      ORDER BY [City_name2]
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
