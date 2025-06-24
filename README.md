# Business Registry Application

A modern web application for searching and managing business entities with support for both Georgian and English languages.

## Technology Stack

### Frontend
- React (Vite) with SCSS
- TailwindCSS for styling
- React Select for dropdown components
- Multi-language support
- Custom hooks for form management

### Backend
- Node.js with Express
- SQL Server for database
- RESTful API architecture

## Setup

1. Configure your SQL Server connection by editing the `.env` file with your database credentials:
```env
PORT=5000
DB_SERVER=your_server_name
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

2. Install dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Start the application:

In one terminal, start the backend:
```bash
npm run dev
```

In another terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Project Structure

```
br/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── CustomSelect.jsx     # Reusable select component
│   │   │   ├── AddressSection.jsx       # Address form section
│   │   │   ├── BasicInfoSection.jsx     # Basic information form section
│   │   │   ├── EconomicActivitySection.jsx  # Economic activity form section
│   │   │   ├── AdditionalInfoSection.jsx    # Additional info form section
│   │   │   ├── FormActions.jsx          # Form action buttons
│   │   │   └── SearchForm.jsx           # Main search form component
│   │   ├── utils/
│   │   │   └── selectStyles.js          # Shared select component styles
│   │   ├── translations/
│   │   │   └── searchForm.js            # Multi-language translations
│   │   ├── hooks/
│   │   │   └── useSearchForm.js         # Form logic and API calls
│   │   └── services/
│   │       └── api.js                   # API service functions
├── backend/
│   ├── src/
│   │   ├── app.js                       # Express application setup
│   │   ├── api/                         # API routes handlers
│   │   ├── config/
│   │   │   └── database.js              # Database configuration
│   │   └── routes/
│   │       ├── legalForms.js            # Legal forms endpoints
│   │       └── locations.js             # Location endpoints
│   └── web.config                       # IIS configuration
```

## Features

- 🌐 Bilingual support (Georgian/English)
- 🔍 Advanced search functionality
- 📝 Comprehensive business entity information
- 📍 Geographic location management
- 🏢 Legal form handling
- 🎨 Modern and responsive UI
- ♿ Accessibility features
- 🎯 Real-time form validation

## API Endpoints

### Locations
- GET `/api/locations/regions` - Get all regions
- GET `/api/locations/code/:code` - Get municipalities by region code

### Legal Forms
- GET `/api/legal-forms` - Get all legal forms

## Form Structure

The search form is divided into several sections:

1. **Basic Information**
   - Identification Number
   - Organization Name
   - Organizational Legal Form
   - Head
   - Partner

2. **Addresses**
   - Legal Address
   - Factual Address
   - Each address includes:
     - Region
     - Municipality/City
     - Street Address

3. **Economic Activity**
   - Activity Code
   - Activity Description

4. **Additional Information**
   - Ownership Form
   - Business Size
   - Active Status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
