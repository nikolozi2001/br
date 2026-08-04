# Handoff — Business Register (2026-08-05)

## სად ვართ

**ორივე მაღაზიაში 4.3.0 განხილვაშია.**

| | ვერსია | სტატუსი |
|---|---|---|
| 🍏 App Store | 4.3.0 (build 2) | Apple-ის განხილვა, გაგზავნილია 4 აგვისტოს `eas submit`-ით |
| 🤖 Play Store | 4.3.0 (versionCode 10) | Changes in review, Managed publishing **გამორთული** → დამტკიცებისთანავე გამოქვეყნდება |

გამოქვეყნებული: App Store — **1.0** (4 აგვისტო, პირველი iOS რელიზი), Play — **4.2.0 (8)** (2 აგვისტო).

⚠️ ორი ბილდი ოდნავ განსხვავდება: iOS-ის ბილდი `67c4080`-დან აეწყო, Android-ის — `fb25581`-დან (ფოტო-ნებართვების გასწორებით). ფუნქციურად ორივე გამართულია; iOS-ზე გრაფიკი ფოტოებში ინახება, Android-ზე — საქაღალდეში.

**git:** `origin/main` = `e0c572e`-მდე. ლოკალურად **ahead 11**:

```bash
git push origin main
```

## გადაუდებელი: backend-ის ინგლისური ჯერ არ არის სერვერზე

`inClause` (მრავალრჩევიანი ფილტრები) **დადეპლოებულია და მუშაობს** — ორი რეგიონი 200-ს აბრუნებს.

`781dada` (`/documents?lang=en`) კი **არა** — `lang=en` ისევ ქართულ სახელებს აბრუნებს:

```bash
curl -s -G "https://br-api.geostat.ge/api/documents" --data-urlencode "lang=en" \
  --data-urlencode "legalAddressRegion=15" --data-urlencode "legalForm=1" --data-urlencode "limit=1"
```

`Region_name` უნდა იყოს `Adjara AR`, ახლა `აჭარა`-ა. საჭიროა `backend/src/routes/documents.js`-ის ხელახლა განთავსება 85.118.117.177-ზე (IIS + iisnode; `src/`-ის ცვლილება პროცესს არ გადატვირთავს — შეინახეთ `iisnode.yml` ან გადატვირთეთ app pool).

## ამ სესიის commit-ები (11, დაუგზავნელი)

```
fb25581  fix(export): stop asking Android for photo library access
67c4080  chore: bump version to 4.3.0
8053665  feat(build): ship JS fixes over the air with EAS Update
d56e256  feat(app): catch render crashes instead of showing a white screen
6c415d4  fix(export): export every matching record, not just the loaded page
e1e4286  perf(reports): virtualise the report tables
4cdc88b  feat(search): tie the two NACE pickers together
887a97d  perf(search): virtualise the option list in the picker sheet
7535f09  perf(api): cache the picker lookup lists
05d5844  feat(search): drop the example text from the id and name fields
e0c572e  feat(export): save exports to the device instead of only sharing
```

## რა შეიცვალა

**ექსპორტი ინახება ტელეფონში** (ადრე მხოლოდ share sheet-ს ხსნიდა) — [save.ts](mobile/src/utils/save.ts). iOS: გრაფიკი → ფოტოები, დოკუმენტი → Files (საჭიროა `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`). Android: ყველაფერი → მომხმარებლის არჩეულ საქაღალდეში (SAF).

**CSV ექსპორტი ტყუოდა** — ფურცელზე ეწერა „1 133 623 ჩანაწერი", ფაილში კი 20 სტრიქონი ხვდებოდა. ახლა `/documents/export`-ს ჩამოტვირთავს (ყველა სტრიქონი, ნაკადად, პირდაპირ დისკზე). XLSX/PDF ჩატვირთულ რიგებზე დარჩა და ამას ღიად წერს. CSV-ის რიგზე ზომაც ჩანს (~843 MB ფილტრის გარეშე).

**რეპორტი 10 იხსნება** — ორივე ფორმა `FlatList`-ზეა; მატრიცა ჰორიზონტალურ ScrollView-შია, ანუ სვეტები გვერდულად სქროლავს, სტრიქონები ვირტუალიზებულია.

**NACE-ის ორი სელექტი დაკავშირებულია** — კოდის არჩევა ავსებს დასახელებას და პირიქით, როგორც ვებზე.

**lookup-ების ქეში** — [lookupCache.ts](mobile/src/api/lookupCache.ts). მეხსიერება + AsyncStorage, ენის მიხედვით, 7 დღე. `/activities` 549 KB / 1697 სტრიქონია და ყოველ ჯერზე ჩამოდიოდა. ვადაგასული ჩანაწერი გაიცემა, თუ განახლება ჩავარდა → ოფლაინშიც მუშაობს.

**PickerSheet ვირტუალიზებულია** — 1697 რიგი ერთბაშად აღარ იწყობა.

**ErrorBoundary** — [ErrorBoundary.tsx](mobile/src/components/ErrorBoundary.tsx). თეთრი ეკრანის ნაცვლად ახსნა და „ხელახლა ცდა". [reportError.ts](mobile/src/utils/reportError.ts) არის ერთი ფუნქცია, სადაც Sentry ჩაერთვება — **შეგნებულად არ დავამატე**, რადგან მისი SDK Expo Go-ში არ არის, Expo Go კი ერთადერთი გზაა iPhone-ზე გასაშვებად.

**EAS Update (OTA)** — `runtimeVersion.policy: "fingerprint"` (და არა `appVersion`): native პროექტის ჰეშს იღებს, ანუ განახლება შეუთავსებელ ბილდს არ მიეწოდება. ⚠️ **OTA ჯერ არ მუშაობს** — `expo-updates` native მოდულია, ამიტომ ჯერ 4.3.0 უნდა გამოქვეყნდეს; მხოლოდ ამის შემდეგ წავა JS-ის შესწორებები წუთებში.

**Android-ის ფოტო-ნებართვები მოხსნილია** — `expo-media-library`-ის plugin ამატებდა `READ_MEDIA_IMAGES` და სხვას, რაზეც Play ითხოვს დეკლარაციას „ფოტოებზე ფართო წვდომა ჩვენი აპის ძირითადი ფუნქციაა". ეს **სიმართლე არ იყო**, ამიტომ ნებართვები დაიბლოკა და Android-ზე სურათი საქაღალდეში ინახება. AAB-ის მანიფესტში დარჩა მხოლოდ `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`, `SYSTEM_ALERT_WINDOW`, `DUMP`.

## ცნობილი, გაუსწორებელი საკითხები

- **`/documents/export` ისევ ქართულია** — `lang` მხოლოდ ძებნის შედეგებს შეეხო.
- **რეპორტები 8–9-ში სტრიქონები NACE კოდით არის ხელმოწერილი** (A, B, C…), არა საქმიანობის სახელით — `parseMatrixReport` პირველ ტექსტურ სვეტს იღებს იარლიყად.
- **crash reporting არ არის** — მხოლოდ ErrorBoundary. Sentry dev build-ის შემდეგ.
- **`accessibilityLabel` არსად არ არის** — უკან/გაზიარება/გული/ბეჭდვა VoiceOver-ისთვის უსახელოა. საჯარო უწყების აპისთვის ღირს.
- **`eas submit` Android-ზე არ მუშაობს** — Google Service Account გასაღები არ არის (`eas.json`-ში `submit.production.android` ცარიელია). iOS-ზე **მუშაობს** (ASC API Key `KU7Z469PHY` EAS-ზეა, `ascAppId` = 6795051115).
  ⚠️ **დღეს სამჯერ ავტვირთეთ AAB ხელით და სამივეჯერ ბანდლი დრაფტს არ მიება** — ბიბლიოთეკიდან („Add from library") ხელით უნდა დაემატოს. ასევე რელიზის **სახელი** ბანდლის შეცვლისას ავტომატურად არ განახლდება.
- **App Store-ის ლისტინგი მხოლოდ ინგლისურია** — Apple-ის მხარდაჭერილ ენებში **ქართული არ არის**, ამიტომ „What's New", აღწერა და Subtitle ქართულად ვერ ჩაიწერება („invalid characters"). Keywords ველში ქართული სიმბოლოები შესაძლოა გავიდეს — შესამოწმებელია.
- **ძებნა App Store-ში:** ქართულ მაღაზიაში აპი **პირველ ადგილზეა** („business register" და „ბიზნეს რეგისტრი"), აშშ-ში 31/42. ეს ნორმალურია ერთდღიანი, ნულოვანი ჩამოტვირთვების აპისთვის — keywords განსაზღვრავს დამთხვევას, პოზიციას კი ჩამოტვირთვები და შეფასებები.
- **Windows-ის root-განახლებამ** შესაძლოა self-signed Sectigo R46 დააბრუნოს `AuthRoot`-ში: `certutil -delstore AuthRoot AD98F9F3E47D753B65D482B3A45217BB6EF5E438` + რესტარტი.
- **Leaf სერტიფიკატი იწურება 28.12.2026.**

## შემოწმებული და შეუმოწმებელი

დღეს სიმულატორზე გავტესტე: მულტი-სელექტი, ჯგუფური არჩევა, NACE-ის დაკავშირება, რეპორტი 10, PDF-ის შენახვა (`43542.pdf`, 20 KB, ვალიდური), ქეში (351 KB დისკზე), ექსპორტის ფურცლის ტექსტები.

❗ **რეალურ Android მოწყობილობაზე არაფერი გატესტილა** — განსაკუთრებით SAF-ის საქაღალდის არჩევა. 4.3.0-ის დამტკიცების შემდეგ ღირს ერთი გატესტვა.

## სამუშაო გარემო

- Metro 8081-ზე; სიმულატორი (iPhone 17): `xcrun simctl openurl <udid> "exp://127.0.0.1:8081"`
- **Expo Go iOS-ზე მხოლოდ სიმულატორზე მუშაობს.** App Store-ის Expo Go = `54.0.2` (2025-09-23) და SDK 54-ს უჭერს მხარს; პროექტი SDK 57-ია. ტელეფონისთვის საჭიროა dev build ან `eas go`. `expo-dev-client` დამატებულია, მაგრამ **`eas device:create` Apple-ის 500-ზე ვარდება** — სცადეთ ხელახლა, ან `rm -rf ~/.app-store/auth/census20131@gmail.com`, ან შეამოწმეთ ხელმოუწერელი Agreements developer.apple.com-ზე.
- `npm test` → **93 ტესტი**, `npm run typecheck` → სუფთა
- ⚠️ **`npx expo prebuild` არ გაუშვათ დაუფიქრებლად** — ის `android/`/`ios/` საქაღალდეს ქმნის და `package.json`-ის სკრიპტებს `expo run:*`-ად ცვლის (Expo Go-ს workflow ფუჭდება). თუ გაუშვით, წაშალეთ საქაღალდე და დააბრუნეთ `package.json`.
- `npx expo-doctor` ჩივის 7 პაკეტის patch-სხვაობაზე — ბილდებს ხელს არ უშლის, შეგნებულად არ შევეხე

## რეკომენდებული შემდეგი ნაბიჯები

1. `git push origin main`
2. **backend-ის ინგლისური** (`781dada`) სერვერზე
3. **Play Service Account გასაღები** — Play Console → Setup → API access; შემდეგ `eas build --platform android --auto-submit` მთელ ხელით პროცესს ჩაანაცვლებს
4. App Store Connect: Keywords + Subtitle (ინგლისურად; ქართული სიმბოლოები Keywords-ში შესამოწმებელია)
5. Android-ზე რეალური გატესტვა: ექსპორტის შენახვა (SAF)
6. Sentry — dev build-ის გამართვის შემდეგ
7. `accessibilityLabel` აიქონ-ღილაკებზე
