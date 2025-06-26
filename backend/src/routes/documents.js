const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

// Search documents with filters
router.get("/", async (req, res) => {
  try {
    const {
      identificationNumber,
      organizationName,
      organizationalLegalForm,
      head,
      partner,
      region,
      legalMunicipality,
      legalAddress,
      personalRegion,
      personalMunicipality,
      personalAddress,
      activityCode,
      ownershipForm,
      businessForm,
      isActive,
    } = req.query;

    let query = `
      SELECT
        [Stat_ID], [Legal_Code], [Personal_no], [Legal_Form_ID],
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
      WHERE 1=1
    `;

    console.log("Received parameters:", {
      organizationalLegalForm,
      region,
      legalMunicipality,
      personalRegion,
      personalMunicipality,
      isActive
    });

    const params = {};

    if (identificationNumber) {
      query += ` AND [Legal_Code] LIKE @identificationNumber`;
      params.identificationNumber = `%${identificationNumber}%`;
    }

    if (organizationName) {
      query += ` AND [Full_Name] LIKE @organizationName`;
      params.organizationName = `%${organizationName}%`;
    }

    if (organizationalLegalForm) {
      query += ` AND [Legal_Form_ID] IN (${organizationalLegalForm})`;
    }

    if (head) {
      query += ` AND [Head] LIKE @head`;
      params.head = `%${head}%`;
    }

    if (partner) {
      query += ` AND [Partner] LIKE @partner`;
      params.partner = `%${partner}%`;
    }

    if (activityCode) {
      query += ` AND ([Activity_Code] IN (${activityCode}) OR [Activity_2_Code] IN (${activityCode}))`;
    }

    if (ownershipForm) {
      query += ` AND [Ownership_Type_ID] IN (${ownershipForm})`;
    }

    if (businessForm) {
      query += ` AND [Zoma] IN (${businessForm})`;
    }

    if (isActive === "true" || isActive === true) {
      query += ` AND [ISActive] = 1`;
    }

    // Add region and municipality filters for both legal and personal addresses
    if (region) {
      query += ` AND [Region_Code] IN ('${region.split(",").join("','")}')`;
    }

    if (legalMunicipality) {
      // Format city codes to match database format (e.g., "11 53" for Saburtalo)
      const formattedCityCodes = legalMunicipality.split(",").map(code => {
        // If the code is for Tbilisi district (region 11)
        if (region === '11') {
          // Convert the incoming code to a valid Tbilisi district code
          const districtMap = {
            '6221': '11 35', // ისნის რაიონი
            '6222': '11 29', // დიდუბის რაიონი
            '6223': '11 33', // ვაკის რაიონი
            '6224': '11 25', // გლდანის რაიონი
            '6225': '11 39', // კრწანისის რაიონი
            '6226': '11 43', // მთაწმინდის რაიონი
            '6227': '11 47', // ნაძალადევის რაიონი
            '6228': '11 53', // საბურთალოს რაიონი
            '6229': '11 58', // სამგორის რაიონი
            '6230': '11 63', // ჩუღურეთის რაიონი
            '6231': '11 37', // ძველი თბილისის რაიონი
            '6232': '11 65'  // დიდგორის რაიონი
          };
          const mappedCode = districtMap[code];
          console.log(`Mapping Tbilisi district code ${code} to ${mappedCode}`);
          return mappedCode || code;
        }
        // For other regions, add space between region and district codes
        const regionPart = code.slice(0, 2);
        const districtPart = code.slice(2).padStart(2, '0');
        const formattedCode = `${regionPart} ${districtPart}`;
        console.log(`Formatting region code ${code} to ${formattedCode}`);
        return formattedCode;
      });
      console.log("Formatted city codes:", formattedCityCodes);
      query += ` AND [City_Code] IN ('${formattedCityCodes.join("','")}')`;
    }

    if (personalRegion) {
      query += ` AND [Region_Code2] IN ('${personalRegion.split(",").join("','")}')`;
    }

    if (personalMunicipality) {
      // Format personal city codes using the same mapping as legal municipalities
      const formattedPersonalCityCodes = personalMunicipality.split(",").map(code => {
        if (personalRegion === '11') {
          // Use the same district mapping for personal addresses
          const districtMap = {
            '6221': '11 35', // ისნის რაიონი
            '6222': '11 29', // დიდუბის რაიონი
            '6223': '11 33', // ვაკის რაიონი
            '6224': '11 25', // გლდანის რაიონი
            '6225': '11 39', // კრწანისის რაიონი
            '6226': '11 43', // მთაწმინდის რაიონი
            '6227': '11 47', // ნაძალადევის რაიონი
            '6228': '11 53', // საბურთალოს რაიონი
            '6229': '11 58', // სამგორის რაიონი
            '6230': '11 63', // ჩუღურეთის რაიონი
            '6231': '11 37', // ძველი თბილისის რაიონი
            '6232': '11 65'  // დიდგორის რაიონი
          };
          const mappedCode = districtMap[code];
          console.log(`Mapping Tbilisi personal district code ${code} to ${mappedCode}`);
          return mappedCode || code;
        }
        // For other regions, add space between region and district codes
        const regionPart = code.slice(0, 2);
        const districtPart = code.slice(2).padStart(2, '0');
        const formattedCode = `${regionPart} ${districtPart}`;
        console.log(`Formatting personal region code ${code} to ${formattedCode}`);
        return formattedCode;
      });
      console.log("Formatted personal city codes:", formattedPersonalCityCodes);
      query += ` AND [City_Code2] IN ('${formattedPersonalCityCodes.join("','")}')`;
    }

    if (legalAddress) {
      query += ` AND [Address] LIKE @legalAddress`;
      params.legalAddress = `%${legalAddress}%`;
    }

    if (personalAddress) {
      query += ` AND [Address2] LIKE @personalAddress`;
      params.personalAddress = `%${personalAddress}%`;
    }

    console.log("Final SQL Query:", query);

    const pool = await poolPromise;
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    // Run the main query first
    const result = await request.query(query);
    console.log("Result count:", result.recordset.length);

    // Run a diagnostic query without the active status filter
    try {
      const diagnosticQuery = query.replace(/AND \[ISActive\] = 1/g, '');
      const diagnosticResult = await request.query(diagnosticQuery);
      console.log("Result count without active filter:", diagnosticResult.recordset.length);
    } catch (error) {
      console.log("Diagnostic query failed:", error.message);
    }

    // Only run diagnostic queries if we have specific parameters
    if (region || legalMunicipality) {
      try {
        // Diagnostic query for region and city distribution
        if (region) {
          const diagnosticQuery3 = `
            SELECT [Region_Code], [Region_name], [City_Code], [City_name], COUNT(*) as count,
                   COUNT(CASE WHEN [ISActive] = 1 THEN 1 END) as active_count
            FROM [register].[dbo].[DocMain]
            WHERE [Region_Code] IN ('${region.split(",").join("','")}')
            GROUP BY [Region_Code], [Region_name], [City_Code], [City_name]
            ORDER BY count DESC`;
          
          const diagnostic3 = await request.query(diagnosticQuery3);
          console.log("Region and city distribution:", diagnostic3.recordset);
        }
        
        // Additional diagnostic for specific region and municipality combination
        if (region && legalMunicipality) {
          const diagnosticQuery4 = `
            SELECT [ISActive], COUNT(*) as count
            FROM [register].[dbo].[DocMain]
            WHERE [Region_Code] IN ('${region.split(",").join("','")}')
            AND [City_Code] IN ('${legalMunicipality.split(",").join("','")}')
            GROUP BY [ISActive]
            ORDER BY [ISActive]`;
          
          const diagnostic4 = await request.query(diagnosticQuery4);
          console.log("Active status distribution:", diagnostic4.recordset);
        }
      } catch (error) {
        console.log("Diagnostic queries failed:", error.message);
        console.log("Error details:", error);
      }
    }

    // Additional diagnostic query to show all possible region/city combinations
    try {
      const allLocationsQuery = `
        SELECT DISTINCT [Region_Code], [Region_name], [City_Code], [City_name]
        FROM [register].[dbo].[DocMain]
        WHERE [ISActive] = 1
        ORDER BY [Region_Code], [City_Code]`;
      
      const locations = await request.query(allLocationsQuery);
      console.log("Available active locations:", locations.recordset);
    } catch (error) {
      console.log("Location query failed:", error.message);
    }

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
