import { ALL_CATEGORIES, FULL_HOUSE } from '../../data/contractorCategories.js'
import { LANGUAGE_CODES } from '../../i18n/index.js'

// Single source for the landing page's copy and data. Existing copy is
// kept verbatim from the previous sections; stats are derived from real
// app data rather than typed in.

export const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#journey', label: 'Journey' },
  { href: '#platform', label: 'Platform' },
  { href: '#support', label: 'Support' },
]

export const HERO = {
  eyebrow: 'Build Smarter · Live Better',
  title: 'SANKALP',
  subtitle: 'Your Complete Digital Construction Ecosystem',
  body: 'Planning, design, materials, professionals and construction management — brought together in one connected platform.',
}

export const ABOUT = {
  eyebrow: 'What is Sankalp?',
  titleA: 'Construction has always meant many moving parts.',
  titleB: 'Sankalp brings them together.',
  paragraphs: [
    'A single build touches architects, material suppliers, contractors, supervisors and workers — each working with their own tools, timelines and paperwork. Sankalp is a digital ecosystem that connects every one of these activities into a single, coherent platform, so the people building your home can plan, coordinate and track progress in one place.',
    'It is not a marketplace bolted onto a website — it is construction, made digital, from the first sketch to the final handover.',
  ],
  fragments: ['Plans', 'Architects', 'Materials', 'Contractors', 'Workers', 'Budgets'],
}

export const STORY = {
  eyebrow: 'From Blueprint to Home',
  title: 'A story told in one continuous build',
  frames: [
    { title: 'The Idea', copy: 'Every build starts as a plan and a budget.' },
    { title: 'Design & Materials', copy: 'Drawings take shape, materials are selected.' },
    { title: 'Professionals at Work', copy: 'Verified teams execute on-site, coordinated end to end.' },
    { title: 'The Completed Home', copy: 'Built with clarity, delivered with confidence.' },
  ],
}

// Icon paths reused from the previous Journey section (24x24, stroked).
export const JOURNEY = {
  eyebrow: 'The Sankalp Journey',
  title: 'One connected path, from idea to home',
  stages: [
    { label: 'Plan', copy: 'Define the vision, scope and budget for the build.', icon: 'M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z M14 4v6h6' },
    { label: 'Design', copy: 'Turn the vision into detailed architectural drawings.', icon: 'M3 21 14 10m0 0 3.5-3.5a2.121 2.121 0 0 1 3 3L17 13m-3-3 3 3M4 21h4l10-10-4-4L4 17v4Z' },
    { label: 'Materials', copy: 'Source and track the right materials for every stage.', icon: 'M3 7 12 3l9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4' },
    { label: 'Professionals', copy: 'Connect with verified contractors, supervisors and workers.', icon: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 2a6 6 0 0 0-6 6v1h20v-1a6 6 0 0 0-6-6' },
    { label: 'Construction', copy: 'Execution on-site, coordinated and tracked in real time.', icon: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6' },
    { label: 'Management', copy: 'Monitor progress, cost and quality from one place.', icon: 'M4 19V5m0 14h16M8 15v-4m4 4V9m4 6v-7' },
    { label: 'Completion', copy: 'Move into a home built with clarity and control.', icon: 'M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-8Zm7 5 2 2 4-4' },
  ],
}

export const PLATFORM = {
  eyebrow: 'Inside the platform',
  title: 'Every tool your build needs, in one dashboard.',
  // Titles/descriptions come from i18n (cards.*), the same copy the
  // customer dashboard shows.
  features: ['contractors', 'tasks', 'materials', 'costComparison', 'progress', 'budget'],
}

// Product photos self-hosted in client/public/materials (names match the
// seeded catalog in server/src/db/seedMaterials*.js).
export const MATERIALS = [
  { slug: 'cement-opc', name: 'OPC 53 Cement' },
  { slug: 'steel-tmt-12mm', name: 'TMT Bar 12mm' },
  { slug: 'brick-red-clay', name: 'Red Clay Bricks' },
  { slug: 'sand-river', name: 'River Sand' },
  { slug: 'aggregate-20mm', name: '20mm Aggregate' },
  { slug: 'paint-premium', name: 'Premium Emulsion' },
  { slug: 'tile-ceramic-wall', name: 'Ceramic Wall Tiles' },
  { slug: 'electrical-wire', name: 'Electrical Wire' },
  { slug: 'sanitary-basin', name: 'Wash Basin' },
  { slug: 'chemical-waterproofing', name: 'Waterproofing Coating' },
  { slug: 'brick-aac', name: 'AAC Blocks' },
  { slug: 'steel-ms-angle', name: 'MS Angle' },
  { slug: 'cement-ppc', name: 'PPC Cement' },
  { slug: 'safety-vest', name: 'Safety Vest' },
  { slug: 'tool-hammer', name: 'Claw Hammer' },
  { slug: 'paint-exterior', name: 'Exterior Paint' },
  { slug: 'brick-flyash', name: 'Fly Ash Bricks' },
  { slug: 'electrical-led-panel', name: 'LED Panel Light' },
  { slug: 'steel-tmt-8mm', name: 'TMT Bar 8mm' },
  { slug: 'chemical-tile-adhesive', name: 'Tile Adhesive' },
  { slug: 'sanitary-fittings', name: 'Bathroom Fittings' },
  { slug: 'hardware-spirit-level', name: 'Spirit Level' },
  { slug: 'cement-white', name: 'White Cement' },
  { slug: 'steel-binding-wire', name: 'Binding Wire' },
  { slug: 'safety-gloves', name: 'Safety Gloves' },
  { slug: 'tool-tape', name: 'Measuring Tape' },
]

// Number of products in the seeded materials catalog
// (server/src/db/seedMaterials*.js — 44 products across 15 categories).
const CATALOG_MATERIALS = 44

export const CONTRACTOR_CATEGORIES = [FULL_HOUSE, ...ALL_CATEGORIES]

export const STATS = [
  { value: CONTRACTOR_CATEGORIES.length, label: 'Contractor categories' },
  { value: CATALOG_MATERIALS, label: 'Materials in the catalog' },
  { value: JOURNEY.stages.length, label: 'Connected build stages' },
  { value: LANGUAGE_CODES.length, label: 'Languages supported' },
]

export const SUPPORT = {
  title: 'Support & Information',
  items: [
    {
      title: 'About Sankalp',
      copy: 'A digital ecosystem connecting every stage of construction — from planning to completion — in one platform.',
    },
    {
      title: 'Get in Touch',
      copy: 'Have a question about the platform? Reach our support team through the login portal once your account is set up.',
    },
    {
      title: 'For Professionals',
      copy: 'Architects, contractors, supervisors and workers can all coordinate their work through Sankalp.',
    },
  ],
}

export const FOOTER = {
  blurb: 'Sankalp is a digital construction ecosystem bringing planning, design, materials, professionals and construction management together in one connected platform.',
  location: 'Andhra Pradesh, India',
}
