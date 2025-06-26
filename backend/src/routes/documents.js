const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

// Search documents with filters
router.get('/', async (req, res) => {
  try {
    const {
      identificationNumber,
      organizationName,
      organizationalLegalForm,
      head,
      partner,
      legalRegion,
      legalMunicipality,
      legalAddress,
      personalRegion,
      personalMunicipality,
      personalAddress,
      activityCode,
      ownershipForm,
      businessForm,
      isActive
    } = req.query;

    let query = `
      SELECT TOP (1000) 
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

    if (isActive === 'true') {
      query += ` AND [ISActive] = 1`;
    }

    // Add region and municipality filters for both legal and personal addresses
    if (legalRegion) {
      query += ` AND [Region_Code] IN (${legalRegion})`;
    }

    if (legalMunicipality) {
      query += ` AND [City_Code] IN (${legalMunicipality})`;
    }

    if (personalRegion) {
      query += ` AND [Region_Code2] IN (${personalRegion})`;
    }

    if (personalMunicipality) {
      query += ` AND [City_Code2] IN (${personalMunicipality})`;
    }

    if (legalAddress) {
      query += ` AND [Address] LIKE @legalAddress`;
      params.legalAddress = `%${legalAddress}%`;
    }

    if (personalAddress) {
      query += ` AND [Address2] LIKE @personalAddress`;
      params.personalAddress = `%${personalAddress}%`;
    }

    const pool = await poolPromise;
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
