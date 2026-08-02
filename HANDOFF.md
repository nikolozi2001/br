# Handoff — Business Register (2026-08-02)

## სად ვართ

**Play Store:** 4.1.0 (7) გამოქვეყნდა 31 ივლისს. **4.2.0 (versionCode 8) გაგზავნილია განხილვაზე** 2 აგვისტოს — Production, full rollout, 177 ქვეყანა. Managed publishing **გამორთულია**, ანუ დამტკიცებისთანავე თავისით გამოქვეყნდება.

**App Store:** გაგზავნილია, Apple-ის განხილვას ელოდება (30 ივლისიდან).

**git:** `origin/main` არის `fe783ef`-ზე (4.2.0-ის ბილდი). ლოკალურად **ahead 3** — ამ სესიის ბოლო სამი commit ჯერ არ არის გაგზავნილი:

```bash
git push origin main
```

## ⚠️ ერთადერთი გადაუდებელი საქმე: backend-ის დეპლოი

`backend/src/routes/documents.js` **სერვერზე ჯერ არ არის განთავსებული**. სანამ არ განთავსდება:

- ორი რეგიონის/მუნიციპალიტეტის მონიშვნა → **HTTP 500** (გაშვებული კოდი `Region_Code = @reg1`-ს იყენებს და მასივი მოთხოვნას ამტვრევს)
- ინგლისურ რეჟიმში შედეგებზე რჩება „აჭარა", „შპს"

4.2.0 უკვე განხილვაშია, ანუ დამტკიცებისთანავე მომხმარებელთან წავა. **დეპლოი ამაზე ადრე უნდა მოხდეს**, ან ჩართეთ Managed publishing.

დეპლოი (85.118.117.177, IIS + iisnode):

1. ჩაანაცვლეთ `backend/src/routes/documents.js`
2. iisnode მხოლოდ root-ის `*.js`-ს და `iisnode.yml`-ს აკვირდება — `src/`-ის ცვლილება პროცესს არ გადატვირთავს. შეინახეთ `iisnode.yml` ხელახლა ან გადატვირთეთ app pool
3. შემოწმება:

```bash
curl -s -G -o /dev/null -w "%{http_code}\n" "https://br-api.geostat.ge/api/documents" --data-urlencode "legalAddressRegion=15" --data-urlencode "legalAddressRegion=23" --data-urlencode "limit=1"
```

`200` = გამოსწორდა. დამატებით ინგლისურის სმოუქ-ტესტი:

```bash
curl -s -G "https://br-api.geostat.ge/api/documents" --data-urlencode "lang=en" --data-urlencode "limit=1" | head -c 400
```

`Region_name`/`Legal_Form` ინგლისურად უნდა დაბრუნდეს. თუ ცარიელი ან შეცდომაა — `*_EN` ცხრილის სახელი ან სვეტი არ დაემთხვა (SQL ლოკალურად ვერ შემოწმდა, ბაზასთან წვდომის გარეშე).

## ამ სესიის commit-ები

```
3a0029c  docs: refresh the handoff for 4.2.0                       ← დაუგზავნელი
9f5b3a3  refactor(search): move picker selection rules into a…     ← დაუგზავნელი
781dada  feat(api): answer /documents in English when lang=en      ← დაუგზავნელი
fe783ef  chore: bump version to 4.2.0                              ← origin/main
2795ab1  chore(deps): add expo-dev-client
0860bbe  feat(search): add group rows to the legal form picker
00e7677  feat(search): let every filter take several values
69653a2  feat(api): accept several values per search filter
```

⚠️ **4.2.0 (8) ბილდი `fe783ef`-დან აეწყო** — ანუ ბოლო სამი commit (ინგლისური `/documents` და picker-ის რეფაქტორი) **მასში არ არის**. რეფაქტორი ქცევას არ ცვლის, ინგლისური კი backend-ის მხარეა, ამიტომ ახალი ბილდი ამისთვის საჭირო არ არის.

## რა შეიცვალა ამ სესიაზე

**მულტი-სელექტი ყველა ფილტრში** — სამართლებრივი ფორმა, რეგიონი, მუნიციპალიტეტი, საქმიანობის კოდი/დასახელება, საკუთრების ფორმა, ზომა. `SearchForm`-ის picker ველები `Option | null` → `Option[]`.

**ჯგუფური არჩევა** სამართლებრივ ფორმაში — „ყველა სუბიექტი" და „ბიზნეს სუბიექტები" (ID: 1,2,3,4,5,30,39, ვების იდენტური).

**backend:** `inClause()` — რეგიონი, ქალაქი, საკუთრების ფორმა, სამართლებრივი ფორმა და ზომა ახლა `IN (...)`. ერთი მნიშვნელობა ისევე მუშაობს, ვებ-საიტს არაფერი ეცვლება.

**backend:** `/documents?lang=en` ახლა ინგლისურ `*_EN` ცხრილებს უერთდება. ჯოინები **გვერდზე** სრულდება (derived table), არა გაფილტრულ სიმრავლეზე; ქართული გზა ბაიტში იგივეა.

**ქცევის ცვლილება:** „დასახელება" (NACE) სელექტი აქამდე საერთოდ არ იგზავნებოდა მოთხოვნაში. ახლა ორივე NACE სელექტი ერთდება `activityCode`-ში.

## ცნობილი, გაუსწორებელი საკითხები

- **რეპორტი 10 ჩამოკიდებულია** — 4207 სტრიქონი × 20 სვეტი ≈ 84 000 `<Text>` ვირტუალიზაციის გარეშე. გამოსავალი — `FlatList`.
- **რეპორტები 8–9-ში სტრიქონები NACE კოდით არის ხელმოწერილი** (A, B, C…) და არა საქმიანობის სახელით.
- **`/documents/export` ისევ ქართულია** — `lang` მხოლოდ ძებნის შედეგებს შეეხო.
- **`eas submit` არ მუშაობს** — Google Service Account გასაღები არ არის (`eas.json`-ში `submit.production` ცარიელია). AAB ~62 MB, Play Console-ში ხელით იტვირთება. ⚠️ 2 აგვისტოს ხელით ატვირთვისას ბანდლი აიტვირთა, მაგრამ დრაფტ რელიზს **არ მიება** — ბიბლიოთეკიდან („Add from library") ხელით დაემატა. გასაღების დაყენება ამ ხაფანგს საერთოდ აცილებს.
- **iOS-ზე Expo Go აღარ მუშაობს** — App Store-ის ვერსია `54.0.2`-ია (2025-09-23) და მხოლოდ SDK 54-ს უჭერს მხარს; პროექტი SDK 57-ია. სიმულატორზე მუშაობს, რადგან CLI ცალკე იწერს `Expo-Go-57.0.5`-ს. ტელეფონისთვის საჭიროა dev build ან `eas go`. `expo-dev-client` უკვე დამატებულია, მაგრამ **`eas device:create` Apple-ის 500-ზე ვარდება** (`census20131@gmail.com`). სცადეთ: ხელახლა → `rm -rf ~/.app-store/auth/census20131@gmail.com` → developer.apple.com-ზე ხელმოუწერელი Agreements.
- **Windows-ის ავტომატურმა root-განახლებამ** შესაძლოა self-signed Sectigo R46 დააბრუნოს `AuthRoot`-ში და ძველ Android-ებზე TLS შეცდომა დაბრუნდეს: `certutil -delstore AuthRoot AD98F9F3E47D753B65D482B3A45217BB6EF5E438` + რესტარტი.
- **Leaf სერტიფიკატი იწურება 28.12.2026** — განახლების დღეს ჯაჭვი უნდა შემოწმდეს.

## სამუშაო გარემო

- Metro 8081-ზე; სიმულატორი (iPhone 17) `exp://127.0.0.1:8081`-იდან. Expo Go-ს გახსნა: `xcrun simctl openurl <udid> "exp://127.0.0.1:8081"`
- `expo-dev-client`-ის დამატების შემდეგ `npx expo start` dev-client რეჟიმშია — სიმულატორზე Expo Go-სთვის ტერმინალში **`s`**
- `npm test` → **78 ტესტი**, `npm run typecheck` → სუფთა
- `npx expo-doctor` ჩივის 6 პაკეტის patch-სხვაობაზე (`expo 57.0.8` vs `57.0.9`, `react-native 0.86.0` vs `0.86.2`…) — `npx expo install --check` ასწორებს
- ახალი პაკეტის შემდეგ: `npx expo start -c`

## რეკომენდებული შემდეგი ნაბიჯები

1. backend-ის დეპლოი (იხ. ზემოთ) — გადაუდებელი
2. `git push origin main`
3. **Play-ის Service Account გასაღები** — Play Console → Setup → API access; შემდეგ `eas build --auto-submit` მთელ ხელით პროცესს ჩაანაცვლებს
4. iOS dev build — `eas go` უფრო მოკლე გზაა, ვიდრე ad-hoc პროფილი
5. რეპორტი 10 → `FlatList`
