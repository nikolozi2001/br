const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const reg = parseInt(req.query.reg) || 0;
    const leg = parseInt(req.query.leg) || 0;
    const act = parseInt(req.query.act) || 0;
    const nameOrCode = req.query.nameOrCode || "";

    console.log("GIS Search Parameters:", { reg, leg, act, nameOrCode });

    let filter = "";
    if (reg > 0) filter += " AND dm.Region_Code2 = @reg";
    if (act > 0) filter += " AND a2.ID = @act";
    if (leg > 0) filter += " AND dm.Legal_Form_ID = @leg";
    if (nameOrCode) {
      // Check if nameOrCode is numeric (for Legal_Code exact match) or text (for Full_Name search)
      const isNumeric = /^\d+$/.test(nameOrCode.toString().trim());
      
      if (isNumeric) {
        // For numeric input, search both Legal_Code (exact match) and Full_Name (partial match)
        filter += " AND (dm.Legal_Code = @nameOrCodeExact OR UPPER(LTRIM(RTRIM(dm.Full_Name))) LIKE UPPER(@nameOrCode))";
      } else {
        // For text input, search only Full_Name and Legal_Code as string
        filter += " AND (UPPER(LTRIM(RTRIM(dm.Full_Name))) LIKE UPPER(@nameOrCode) OR CAST(dm.Legal_Code AS NVARCHAR) LIKE @nameOrCode)";
      }
    }

    const query = `
      SELECT  
        a2.ID,
        REPLACE(REPLACE(REPLACE(dm.Full_Name, '''', ''), CHAR(13), ''), CHAR(10), '') AS Full_Name,
        dm.Legal_Code,
        dm.Region_Code2,
        dm.Legal_Form_ID,
        l.Abbreviation,
        dm.Activity_2_Name,
        dm.X,
        dm.Y
      FROM [register].[dbo].[DocMain] dm
      LEFT JOIN [register].[CL].[Legal_Forms] l 
        ON l.ID = dm.Legal_Form_ID
      LEFT JOIN [register].[CL].[Activities_NACE2] a1 
        ON a1.Activity_Code = dm.Activity_2_Code
      LEFT JOIN [register].[CL].[Activities_NACE2] a2 
        ON a1.Activity_Root_ID = a2.Activity_Root_ID 
       AND a1.Activity_Root_ID = a2.ID
      WHERE dm.ISActive = 1 
        AND dm.X > 0
        ${filter}
    `;

    const pool = await poolPromise;
    const request = pool.request();

    if (reg > 0) request.input("reg", sql.Int, reg);
    if (act > 0) request.input("act", sql.Int, act);
    if (leg > 0) request.input("leg", sql.Int, leg);
    if (nameOrCode) {
      const trimmedValue = nameOrCode.toString().trim();
      const isNumeric = /^\d+$/.test(trimmedValue);
      
      if (isNumeric) {
        // For numeric input, bind both exact numeric value and partial text search
        request.input("nameOrCodeExact", sql.BigInt, parseInt(trimmedValue));
        request.input("nameOrCode", sql.NVarChar, `%${trimmedValue}%`);
      } else {
        // For text input, bind only partial text search
        request.input("nameOrCode", sql.NVarChar, `%${trimmedValue}%`);
      }
    }

    const result = await request.query(query);
    //how can I understand length of result.recordset
    // if (Array.isArray(result.recordset)) {
    //   console.log("Number of records found:", result.recordset.length);
    // }

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching DocMain data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
