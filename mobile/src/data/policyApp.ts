import type { Lang } from '../types';
import type { PolicyBlock } from '../utils/policyText';

/**
 * The app's own privacy policy — what *this application* does with your data,
 * as opposed to what the authority does with respondents' ({@link policyKa}).
 * The stores require this one, and until now it lived only in the listing.
 *
 * Taken from `mobile/privacy-policy.html`, the page the store listings point at,
 * and parsed out of it rather than retyped. **The two are separate copies of one
 * document: change that file and this one together**, or a reader will be told
 * two different things about the same app. The heading is dropped here (the
 * screen already carries it) and the byline is split out, so what is left is the
 * six sections.
 */

export interface AppPolicy {
  /** Who publishes the app, from the byline under the title. */
  owner: string;
  /** The revision date, in that language's own wording. */
  updated: string;
  blocks: PolicyBlock[];
}

export const policyApp: Record<Lang, AppPolicy> = {
  ka: {
    owner: 'ბიზნეს რეგისტრი · საქართველოს სტატისტიკის ეროვნული სამსახური (საქსტატი)',
    updated: 'ბოლო განახლება: 2026 წლის 27 ივლისი',
    blocks: [
      { kind: 'heading', text: '1. ზოგადი ინფორმაცია' },
      { kind: 'paragraph', text: 'აპლიკაცია „ბიზნეს რეგისტრი" უზრუნველყოფს საქართველოს ბიზნეს რეგისტრის საჯარო მონაცემების ძებნასა და დათვალიერებას. აპლიკაცია არ ითხოვს რეგისტრაციას და არ აგროვებს პერსონალურ მონაცემებს.' },
      { kind: 'heading', text: '2. მონაცემები, რომლებსაც ვამუშავებთ' },
      { kind: 'paragraph', text: 'აპლიკაცია არ აგროვებს და არ გადასცემს მომხმარებლის პერსონალურ ინფორმაციას (სახელი, ელფოსტა, ადგილმდებარეობა, კონტაქტები და ა.შ.).' },
      { kind: 'bullet', text: 'ძებნის მოთხოვნები იგზავნება საქსტატის საჯარო API-ზე (br-api.geostat.ge) მხოლოდ საჯარო რეესტრის მონაცემების მისაღებად.' },
      { kind: 'bullet', text: 'რუკის ფრაგმენტები იტვირთება OpenStreetMap-იდან სუბიექტის მდებარეობის საჩვენებლად.' },
      { kind: 'bullet', text: 'ლოკალური პარამეტრები (ენა, თემა, რჩეულები, ბოლო ძებნები) ინახება მხოლოდ თქვენს მოწყობილობაზე და არსად არ იგზავნება.' },
      { kind: 'heading', text: '3. მესამე მხარეები' },
      { kind: 'paragraph', text: 'აპლიკაცია არ იყენებს რეკლამას, ანალიტიკას ან მომხმარებლის თვალთვალის (tracking) ინსტრუმენტებს. გარე სერვისები შემოიფარგლება საქსტატის API-თა და OpenStreetMap-ის რუკებით.' },
      { kind: 'heading', text: '4. მონაცემთა უსაფრთხოება' },
      { kind: 'paragraph', text: 'ყველა ქსელური მოთხოვნა ხორციელდება დაშიფრული HTTPS კავშირით.' },
      { kind: 'heading', text: '5. ბავშვები' },
      { kind: 'paragraph', text: 'აპლიკაცია არ არის მიმართული 13 წლამდე ბავშვებზე და არ აგროვებს მათგან ინფორმაციას.' },
      { kind: 'heading', text: '6. კონტაქტი' },
      { kind: 'paragraph', text: 'კითხვების შემთხვევაში დაგვიკავშირდით: info@geostat.ge · www.geostat.ge' },
    ],
  },
  en: {
    owner: 'Business Register · National Statistics Office of Georgia (Geostat)',
    updated: 'Last updated: 27 July 2026',
    blocks: [
      { kind: 'heading', text: '1. Overview' },
      { kind: 'paragraph', text: 'The "Business Register" app lets you search and browse public data from Georgia\'s Business Register. The app requires no registration and collects no personal data.' },
      { kind: 'heading', text: '2. Data We Process' },
      { kind: 'paragraph', text: 'The app does not collect or transmit any personal information (name, email, location, contacts, etc.).' },
      { kind: 'bullet', text: 'Search queries are sent to Geostat\'s public API (br-api.geostat.ge) solely to retrieve public register records.' },
      { kind: 'bullet', text: 'Map tiles are loaded from OpenStreetMap to display a subject\'s location.' },
      { kind: 'bullet', text: 'Local settings (language, theme, favourites, recent searches) are stored only on your device and are never transmitted.' },
      { kind: 'heading', text: '3. Third Parties' },
      { kind: 'paragraph', text: 'The app contains no advertising, analytics, or user-tracking. External services are limited to the Geostat API and OpenStreetMap map tiles.' },
      { kind: 'heading', text: '4. Data Security' },
      { kind: 'paragraph', text: 'All network requests use encrypted HTTPS connections.' },
      { kind: 'heading', text: '5. Children' },
      { kind: 'paragraph', text: 'The app is not directed at children under 13 and does not knowingly collect their information.' },
      { kind: 'heading', text: '6. Contact' },
      { kind: 'paragraph', text: 'For questions, contact us at: info@geostat.ge · www.geostat.ge' },
    ],
  },
};
