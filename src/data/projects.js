/*
  Placeholder portfolio content.
  ─────────────────────────────────────────────────────────────
  REPLACE ME: every string below is a placeholder. Swap in your real
  name, role, contact details and projects. Cover images live in
  /public/projects/ — drop your own PNG/WEBP in and update `cover`.
*/

export const profile = {
  name: 'Your Name',
  role: 'Product Designer',
  // Drives the giant WebGL/DOM hero title. Two words reads best.
  heroTitle: 'PRODUCT DESIGN',
  location: 'Your City, Country',
  email: 'you@example.com',
  taglines: ['Founding Product Designer', 'End-to-end / full stack'],
  socials: [
    { label: 'Telegram', href: 'https://t.me/yourhandle', icon: '/icons/telegram.svg' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yourhandle/', icon: '/icons/linkedin.svg' },
  ],
}

export const projects = [
  {
    id: 'project-alpha',
    number: 'case 01',
    // `titleLines` renders as stacked lines; `italic: true` uses the serif face
    // for that line, echoing the reference's editorial mix.
    titleLines: [{ text: 'Fintech' }, { text: 'Companion', italic: true }],
    tags: ['#iOS/Android', '#fintech'],
    ink: 'var(--case-ink-1)',
    cover: '/projects/project-1-cover.svg',
    blurb: 'A placeholder case study. Describe the problem, your role, and the outcome.',
  },
  {
    id: 'project-beta',
    number: 'case 02',
    titleLines: [{ text: 'Productivity' }, { text: 'Workspace', italic: true }],
    tags: ['#web', '#productivity'],
    ink: 'var(--case-ink-2)',
    cover: '/projects/project-2-cover.svg',
    blurb: 'A placeholder case study. Describe the problem, your role, and the outcome.',
  },
  {
    id: 'project-gamma',
    number: 'case 03',
    titleLines: [{ text: 'AI' }, { text: 'Assistant', italic: true }],
    tags: ['#AR/Web', '#ai'],
    ink: 'var(--case-ink-3)',
    cover: '/projects/project-3-cover.svg',
    blurb: 'A placeholder case study. Describe the problem, your role, and the outcome.',
  },
]

/*
  Screens shown on the 3D hero carousel. More entries = a fuller wheel.
  The reference shows ~7; we reuse the project covers plus extra placeholders.
*/
export const carouselScreens = [
  '/projects/screen-1.svg',
  '/projects/screen-2.svg',
  '/projects/screen-3.svg',
  '/projects/screen-4.svg',
  '/projects/screen-5.svg',
  '/projects/screen-6.svg',
  '/projects/screen-7.svg',
]
