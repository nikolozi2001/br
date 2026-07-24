# ბიზნეს რეგისტრი — მობილური აპლიკაცია

React Native (Expo SDK 57) აპლიკაცია საქსტატის ბიზნეს რეგისტრისთვის, აწყობილი
Claude Design-ის `Geostat BR Prototype.dc.html` პროტოტიპის მიხედვით და
დაკავშირებული უკვე არსებულ backend-თან (`../backend`).

## გაშვება

```bash
npm install
npx expo start --ios
```

Android-ისთვის `npx expo start --android`.

## ხარისხის შემოწმება

```bash
npm run typecheck   # tsc --noEmit (strict)
npm test            # Jest (jest-expo) — registry/reports/settings პარსერები
```

## Production build (EAS)

`eas.json` შეიცავს `development` / `preview` / `production` პროფილებს:

```bash
npx eas build --profile preview --platform ios      # simulator build
npx eas build --profile production --platform all
```

**Android + რუკა:** `react-native-maps` Expo Go-ში მუშაობს გასაღების გარეშე,
მაგრამ Android standalone build-ისთვის საჭიროა Google Maps API key. დაამატეთ
`app.json`-ში:

```json
"android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } }
```

iOS-ზე Apple Maps-ია — გასაღები არ სჭირდება.

## API

ნაგულისხმევად აპლიკაცია მიმართავს `https://br-api.geostat.ge/api`-ს.
ლოკალურ backend-ზე გადასართავად შექმენით `.env` ფაილი:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api
```

მისამართი უნდა იყოს LAN IP (არა `localhost`), რომ ტელეფონმა/სიმულატორმა მიაწვდინოს.

გამოყენებული endpoint-ები (`src/api/registry.js`):

| ეკრანი | endpoint |
| --- | --- |
| ძებნა | `GET /documents` |
| ფილტრები | `/legal-forms`, `/locations`, `/locations/regions`, `/activities`, `/ownership-types`, `/sizes` |
| სუბიექტის დეტალები | `/representatives`, `/partners`, `/address-web`, `/full-name-web`, `/coordinates` |
| რეპორტები | `/report1` … `/report10` |
| გრაფიკები | `/enterprise-birth-death`, `/enterprise-nace`, `/enterprise-birth-region`, `/enterprise-birth-distribution`, `/enterprise-birth-sector` |

## სტრუქტურა

```
src/
  api/          client.js (fetch wrapper) + registry.js (endpoint-ები და ნორმალიზაცია)
  components/   UI kit — Icon, Card, BottomSheet, PickerSheet, charts, export sheet-ები
  data/         reports.js — რეპორტების კატალოგი და recordset-ის პარსერები
  hooks/        useLookups.js — ფილტრების სიების ჩატვირთვა
  i18n/         strings.js — ქართული / ინგლისური
  navigation/   RootNavigator.js + custom TabBar
  screens/      Search, Results, Favourites, Detail, Reports, ReportDetail, Charts, Settings, History
  state/        AppStore (რჩეულები, ისტორია, toast), SearchStore (ფორმა, შედეგები, სორტირება)
  theme/        tokens.js (დიზაინ-სისტემის ტოკენები) + ThemeProvider (dark mode, ფონტის ზომა, ენა)
```

## დიზაინ-სისტემა

`src/theme/tokens.js` არის Claude Design-ის `_ds/geostat-design-system`-ის
`colors.css` / `typography.css` / `shape.css` ტოკენების პორტი — ბრენდის ლურჯი
`#0080BE`, აქცენტი `#EE1521`, slate ნეიტრალები, light/dark პალიტრები.

სათაურების ფონტი — **BPG Nino Mtavruli** (`assets/fonts/`). ძირითადი ტექსტი
სისტემურ ფონტზეა: დიზაინის FiraGO ვერ ჩამოვიდა Design-პროექტიდან (ფაილი
256 KiB-ზე დიდია და იჭრება) — თუ გინდათ ზუსტად FiraGO, ჩააგდეთ `.ttf`-ები
`assets/fonts/`-ში და დაარეგისტრირეთ `App.js`-ში `GeostatSans` სახელით.

## ექსპორტი

- **XLSX / CSV** — `xlsx` (SheetJS)-ით იქმნება ნამდვილი `.xlsx` workbook, იწერება
  binary-ად `expo-file-system`-ით და იხსნება share sheet-ით.
- **PDF / ბეჭდვა** — `expo-print`.
- **გრაფიკის PNG / JPEG** — `react-native-view-shot`-ით ბარათის სნეპშოტი.
  პროტოტიპის **SVG** ვარიანტი არ არის: ბარათი რასტერიზდება, ვექტორად აღდგენა
  არ ხდება — ცრუ ღილაკის ჩვენების ნაცვლად ის ამოღებულია.
