import PropTypes from "prop-types";

const Footer = ({ isEnglish }) => {
  const currentYear = new Date().getFullYear();

  const content = {
    en: {
      copyright: `© ${currentYear} All rights reserved.`,
      organization: "National Statistics Office of Georgia (Geostat)",
      terms: "Terms of Data Usage",
      email: "Email:",
      phone: "Tel.:",
      phoneDetails: "(internal: 214, 218, 219)",
    },
    ka: {
      copyright: `© ${currentYear} ყველა უფლება დაცულია.`,
      organization: "საქართველოს სტატისტიკის ეროვნული სამსახური (საქსტატი)",
      terms: "მონაცემთა გამოყენების პირობები",
      email: "ელ. ფოსტა:",
      phone: "ტელ.:",
      phoneDetails: "(შიდა: 214, 218, 219)",
    },
  };

  const t = isEnglish ? content.en : content.ka;
  return (
    <footer className="bg-white/50 mt-3 text-sm text-gray-700 py-6 px-4 font-bpg-nino font-bold">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4">
        {/* Left side */}
        <div>
          <p className="mb-2">{t.copyright}</p>
          <p className="mb-2">{t.organization}</p>
          <p>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t.terms}
            </a>
          </p>
        </div>

        {/* Right side */}
        <div className="text-gray-800">
          <p className="mb-2">
            {t.email}{" "}
            <a href="mailto:br@geostat.ge" className="hover:underline">
              br@geostat.ge
            </a>
          </p>
          <p>
            {t.phone} (+995 032) 2 36-72-10 {t.phoneDetails}
          </p>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  isEnglish: PropTypes.bool.isRequired,
};

export default Footer;
