import { translations } from "../translations/searchForm";

function SearchResults({ results, isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];

  if (!results?.length) return null;

  return (
    <div className="w-full overflow-x-auto mt-4">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.identificationNumber}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.personalNumber}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.organizationalLegalForm}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.organizationName}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.region} ({t.legalAddress})
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.legalAddress}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.region} ({t.factualAddress})
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.factualAddress}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              NACE 2
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.activityDescription}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.head}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.phone}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.partner}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.email}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.ownershipForm}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.activeSubject}
            </th>
            <th className="text-center px-4 py-2 text-sm font-bpg-nino">
              {t.businessSize}
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr
              key={result.id}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <td className="text-center px-4 py-2 text-sm">{result.identificationNumber}</td>
              <td className="text-center px-4 py-2 text-sm">{result.personalNumber}</td>
              <td className="text-center px-4 py-2 text-sm">{result.legalForm}</td>
              <td className="text-center px-4 py-2 text-sm">{result.name}</td>
              <td className="text-center px-4 py-2 text-sm">{result.legalAddress.region}</td>
              <td className="text-center px-4 py-2 text-sm">{result.legalAddress.address}</td>
              <td className="text-center px-4 py-2 text-sm">{result.factualAddress.region}</td>
              <td className="text-center px-4 py-2 text-sm">{result.factualAddress.address}</td>
              <td className="text-center px-4 py-2 text-sm">
                {result.activities[0]?.code}
              </td>
              <td className="text-center px-4 py-2 text-sm">
                {result.activities[0]?.name}
              </td>
              <td className="text-center px-4 py-2 text-sm">{result.head}</td>
              <td className="text-center px-4 py-2 text-sm">{result.phone}</td>
              <td className="text-center px-4 py-2 text-sm">{result.partner}</td>
              <td className="text-center px-4 py-2 text-sm">{result.email}</td>
              <td className="text-center px-4 py-2 text-sm">{result.ownershipType}</td>
              <td className="text-center px-4 py-2 text-sm">
                {result.isActive ? "✓" : "✗"}
              </td>
              <td className="text-center px-4 py-2 text-sm">{result.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SearchResults;
