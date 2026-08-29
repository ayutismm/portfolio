/*
  Placeholder portfolio content.
  ─────────────────────────────────────────────────────────────
  REPLACE ME: every string below is a placeholder. Swap in your real
  name, role, contact details and projects. Cover images live in
  /public/projects/ — drop your own PNG/WEBP in and update `cover`.
*/

export const profile = {
  name: 'Ayush Singh',
  role: 'Product Designer & Developer',
  // Drives the giant kinetic hero heading: a fixed lead word + a cycling word.
  heroLead: 'I',
  heroWords: ['DESIGN', 'BUILD', 'CODE', 'CREATE', 'SHIP', 'ITERATE', 'EXPERIMENT'],
  location: 'Kota, Rajasthan',
  email: 'ayutismm@gmail.com',
  taglines: ['Founding Product Designer', 'End-to-end / full stack'],
  socials: [
    { label: 'GitHub', href: 'https://github.com/ayutismm', icon: '/icons/github.svg' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ayush-singh-576462339/', icon: '/icons/linkedin.svg' },
  ],
}

/*
  Real projects (mirrors /projects.json).
  ─────────────────────────────────────────────────────────────
  Card layout: the first word of `name` is tinted with the case ink, the rest
  stays black. `tags` render as plain uppercase meta text (platform + domain).

  `type` picks the device frame: 'phone' (portrait, Campus Companion — the only
  Android app) or 'laptop' (landscape, the web apps). Drop a matching-ratio
  screenshot into /public/projects/cases/ and point `cover` at it — the files
  there now are swappable placeholders (portrait 390×844, landscape 1440×900).
  `href` is kept for a later "deep dive" link but isn't wired to the button yet.
  `description` is retained for reference but not shown on the card.
*/
export const projects = [
  {
    id: 'campus-companion',
    number: 'case 01',
    name: 'Campus Companion',
    tags: ['#Android', '#Campus'],
    ink: 'var(--case-ink-1)',
    type: 'phone',
    cover: '/projects/cases/campus-companion.svg',
    href: '',
    description:
      'A campus-focused React application packaged for Android using Capacitor, bringing essential student tools and campus resources into one mobile experience.',
  },
  {
    id: 'dhwani',
    number: 'case 02',
    name: 'DHWANI',
    tags: ['#Web', '#Security'],
    ink: 'var(--case-ink-2)',
    type: 'laptop',
    cover: '/projects/cases/dhwani.svg',
    href: 'https://github.com/ayutismm/DHWANI',
    description:
      'Near-ultrasonic acoustic communication system for secure, air-gapped data transmission and authentication using CPFSK and real-time signal processing.',
  },
  {
    id: 'rescue-mesh',
    number: 'case 03',
    name: 'RESCUE-MESH',
    tags: ['#Web', '#Emergency'],
    ink: 'var(--case-ink-3)',
    type: 'laptop',
    cover: '/projects/cases/rescue-mesh.svg',
    href: 'https://github.com/neha23jk/RESCUE-MESH',
    description:
      'Offline-first emergency communication network that relays SOS signals through BLE/WiFi Direct and syncs them to a responder dashboard when connectivity returns.',
  },
  {
    id: 'gitrate',
    number: 'case 04',
    name: 'GitRate',
    tags: ['#Web', '#AI'],
    ink: 'var(--case-ink-4)',
    type: 'laptop',
    cover: '/projects/cases/gitrate.svg',
    href: 'https://github.com/ayutismm/gitrate',
    description:
      'AI-powered developer evaluation platform that combines GitHub metrics with qualitative AI analysis to generate fair, multi-dimensional developer ratings.',
  },
  {
    id: 'delhi-aqi-command',
    number: 'case 05',
    name: 'Delhi AQI Command',
    tags: ['#Web', '#DataViz'],
    ink: 'var(--case-ink-5)',
    type: 'laptop',
    cover: '/projects/cases/delhi-aqi-command.svg',
    href: 'https://github.com/ayutismm/hackathon-prototype-HACK4DELHI-',
    description:
      'Real-time ward-wise air quality dashboard combining live pollution data, interactive maps, scientific AQI interpolation, and AI-powered pollution analysis.',
  },
]

/*
  Screens shown on the 3D hero carousel — the app screenshots pasted into
  /public/projects/. More entries = a fuller wheel; they recycle across the
  11 slots, so six reads like a complete ring.
*/
export const carouselScreens = [
  '/projects/screenshot-dashboard.jpeg',
  '/projects/screenshot-mess.jpeg',
  '/projects/screenshot-profile1.jpeg',
  '/projects/screenshot-profile2.jpeg',
  '/projects/screenshot-attendance.jpeg',
  '/projects/screenshot-timetable.jpeg',
]
