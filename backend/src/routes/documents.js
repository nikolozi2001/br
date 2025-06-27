const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");

// Cache for district mappings
let districtMappingCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to get district mappings from the database
async function getDistrictMappings() {
  try {
    // Return cached data if it's still valid
    if (
      districtMappingCache &&
      lastCacheUpdate &&
      Date.now() - lastCacheUpdate < CACHE_DURATION
    ) {
      return districtMappingCache;
    }

    const pool = await poolPromise;

    // Query to get all districts with their codes
    // This assumes you have a mapping table or can derive the mapping from the data
    const query = `
      SELECT DISTINCT 
        [Region_Code],
        [Region_name],
        [City_Code],
        [City_name]
      FROM [register].[dbo].[DocMain]
      WHERE [City_Code] IS NOT NULL
      AND [City_Code] != ''
      AND [City_Code] != '99'
      ORDER BY [Region_Code], [City_Code]
    `;

    const result = await pool.request().query(query);

    // Create mapping object from database results
    // The mapping will be structured as: { "regionCode_cityCode": "formattedCityCode" }
    const mapping = {};
    result.recordset.forEach((row) => {
      const cityCode = row.City_Code.trim();
      const regionCode = row.Region_Code.trim();

      // Create a key from region and city code without spaces
      // This will be used to map frontend codes to database codes
      const key = regionCode + cityCode.replace(/\s+/g, "");
      mapping[key] = cityCode;
    });

    // Update cache
    districtMappingCache = mapping;
    lastCacheUpdate = Date.now();

    console.log("Updated district mappings from database:", mapping);
    return mapping;
  } catch (error) {
    console.error("Error fetching district mappings:", error);
    // Return the last known good cache if available, otherwise return an empty object
    return districtMappingCache || {};
  }
}

// Helper function to format municipality codes
function formatMunicipalityCode(code, regionCode, districtMap) {
  // If it's already in the correct format (contains space), return as is
  if (code.includes(" ")) {
    return code;
  }

  // Try to find the code in our mapping
  const mappingKey = regionCode + code;
  if (districtMap[mappingKey]) {
    return districtMap[mappingKey];
  }

  // If not in mapping, format it with space
  const regionPart = code.slice(0, 2);
  const districtPart = code.slice(2).padStart(2, "0");
  return regionPart + " " + districtPart;
}

// Get all unique regions
router.get("/regions", async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT 
        [Region_Code] as code,
        [Region_name] as name
      FROM [register].[dbo].[DocMain]
      WHERE [Region_Code] IS NOT NULL
      AND [Region_Code] != ''
      ORDER BY [Region_Code]
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

// Get municipalities by region
router.get("/municipalities/:regionCode", async (req, res) => {
  try {
    const { regionCode } = req.params;
    const pool = await poolPromise;

    const query = `
      SELECT DISTINCT 
        [City_Code] as code,
        [City_name] as name
      FROM [register].[dbo].[DocMain]
      WHERE [Region_Code] = @regionCode
      AND [City_Code] IS NOT NULL
      AND [City_Code] != ''
      AND [City_Code] != '99'
      ORDER BY [City_Code]
    `;

    const result = await pool
      .request()
      .input("regionCode", regionCode)
      .query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

// Search documents with filters
router.get("/", async (req, res) => {
  try {
    // Get the latest district mappings
    const districtMap = await getDistrictMappings();

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

    const pool = await poolPromise;
    let request = pool.request();

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

    console.log("Received parameters:", req.query);

    // Add filters with proper parameterization
    if (identificationNumber) {
      query += ` AND [Legal_Code] LIKE @identificationNumber`;
      request.input("identificationNumber", `%${identificationNumber}%`);
    }

    if (organizationName) {
      query += ` AND [Full_Name] LIKE @organizationName`;
      request.input("organizationName", `%${organizationName}%`);
    }

    if (organizationalLegalForm) {
      const legalForms = organizationalLegalForm
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (legalForms.length > 0) {
        query += ` AND [Legal_Form_ID] IN (${legalForms.join(",")})`;
      }
    }

    if (head) {
      query += ` AND [Head] LIKE @head`;
      request.input("head", `%${head}%`);
    }

    if (partner) {
      query += ` AND [Partner] LIKE @partner`;
      request.input("partner", `%${partner}%`);
    }

    if (legalAddress) {
      query += ` AND [Address] LIKE @legalAddress`;
      request.input("legalAddress", `%${legalAddress}%`);
    }

    if (personalAddress) {
      query += ` AND [Address2] LIKE @personalAddress`;
      request.input("personalAddress", `%${personalAddress}%`);
    }

    if (activityCode) {
      const activityCodes = activityCode.split(",").map((code) => `'${code}'`);
      query += ` AND ([Activity_Code] IN (${activityCodes.join(
        ","
      )}) OR [Activity_2_Code] IN (${activityCodes.join(",")}))`;
    }

    if (ownershipForm) {
      const ownershipForms = ownershipForm
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (ownershipForms.length > 0) {
        query += ` AND [Ownership_Type_ID] IN (${ownershipForms.join(",")})`;
      }
    }

    if (businessForm) {
      const businessForms = businessForm.split(",").map((form) => `'${form}'`);
      query += ` AND [Zoma] IN (${businessForms.join(",")})`;
    }

    if (isActive === "true" || isActive === true || isActive === "1") {
      query += ` AND [ISActive] = 1`;
    } else if (isActive === "false" || isActive === false || isActive === "0") {
      query += ` AND [ISActive] = 0`;
    }

    // Add region and municipality filters for both legal and personal addresses
    if (region || legalMunicipality || personalRegion || personalMunicipality) {
      const conditions = [];

      // Legal address conditions
      if (region || legalMunicipality) {
        const legalConditions = [];
        if (region) {
          const regions = region.split(",").map((r) => `'${r}'`);
          legalConditions.push(`[Region_Code] IN (${regions.join(",")})`);
        }
        if (legalMunicipality) {
          const municipalityCodes = legalMunicipality.split(",");
          const formattedCodes = municipalityCodes.map((code) => {
            const formatted = formatMunicipalityCode(code, region, districtMap);
            return `'${formatted}'`;
          });
          legalConditions.push(`[City_Code] IN (${formattedCodes.join(",")})`);
        }
        if (legalConditions.length > 0) {
          conditions.push("(" + legalConditions.join(" AND ") + ")");
        }
      }

      // Personal/Factual address conditions
      if (personalRegion || personalMunicipality) {
        const personalConditions = [];
        if (personalRegion) {
          const regions = personalRegion.split(",").map((r) => `'${r}'`);
          personalConditions.push(`[Region_Code2] IN (${regions.join(",")})`);
        }
        if (personalMunicipality) {
          const municipalityCodes = personalMunicipality.split(",");
          const formattedCodes = municipalityCodes.map((code) => {
            const formatted = formatMunicipalityCode(
              code,
              personalRegion,
              districtMap
            );
            return `'${formatted}'`;
          });
          personalConditions.push(
            `[City_Code2] IN (${formattedCodes.join(",")})`
          );
        }
        if (personalConditions.length > 0) {
          conditions.push("(" + personalConditions.join(" AND ") + ")");
        }
      }

      // Add all conditions to the query
      if (conditions.length > 0) {
        query += ` AND (${conditions.join(" OR ")})`;
      }
    }

    console.log("Final query:", query);

    // Execute the query
    const result = await request.query(query);

    // Return the result
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

// Get legal forms
router.get("/legal-forms", async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT 
        [Legal_Form_ID] as id,
        MAX([Abbreviation]) as name
      FROM [register].[dbo].[DocMain]
      WHERE [Legal_Form_ID] IS NOT NULL
      GROUP BY [Legal_Form_ID]
      ORDER BY [Legal_Form_ID]
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

// Get ownership types
router.get("/ownership-types", async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT 
        [Ownership_Type_ID] as id,
        [Ownership_Type] as name
      FROM [register].[dbo].[DocMain]
      WHERE [Ownership_Type_ID] IS NOT NULL
      AND [Ownership_Type] IS NOT NULL
      ORDER BY [Ownership_Type_ID]
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

// Get activity codes
router.get("/activity-codes", async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT 
        [Activity_Code] as code,
        [Activity_Name] as name
      FROM (
        SELECT [Activity_Code], [Activity_Name] 
        FROM [register].[dbo].[DocMain] 
        WHERE [Activity_Code] IS NOT NULL
        UNION
        SELECT [Activity_2_Code], [Activity_2_Name] 
        FROM [register].[dbo].[DocMain] 
        WHERE [Activity_2_Code] IS NOT NULL
      ) AS activities
      ORDER BY code
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
