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
  location: 'Kota, Rajasthan',
  email: 'ayutismm@gmail.com',
  taglines: ['Founding Product Designer', 'End-to-end / full stack'],
  socials: [
    { label: 'GitHub', href: 'https://github.com/ayutismm', icon: '/icons/github.svg' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ayush-singh-576462339/', icon: '/icons/linkedin.svg' },
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
