import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  UserRound,
  CreditCard,
} from 'lucide-react'

export const ROLES = {
  INDIVIDUAL: 'individual',
  ENTERPRISE: 'enterprise',
  MEMBER: 'member',
  ADMIN: 'admin',
}

export const ROLE_LABEL = {
  individual: 'Individual',
  enterprise: 'Team lead',
  member: 'Team member',
  admin: 'Administrator',
}

/**
 * Roles inside an organisation. The lead manages the team; members and
 * viewers only read it.
 */
export const ORG_ROLES = ['Lead', 'Analyst', 'Viewer']

export const ORG_ROLE_HINT = {
  Lead: 'Manages the team, invites and removes members, and controls roles.',
  Analyst: 'Uploads files and runs analysis on the organisation dataset.',
  Viewer: 'Reads dashboards and analysis. Cannot upload or manage anyone.',
}

const ALL_USERS = [ROLES.INDIVIDUAL, ROLES.ENTERPRISE, ROLES.MEMBER, ROLES.ADMIN]

/**
 * Which roles may reach which application route.
 * Mirrors section 6 of the project documentation.
 */
export const APP_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_USERS },
  { to: '/analysis', label: 'CSV Analysis', icon: FileSpreadsheet, roles: ALL_USERS },
  {
    to: '/organisation',
    label: 'Organisation',
    icon: Building2,
    roles: [ROLES.ENTERPRISE, ROLES.MEMBER, ROLES.ADMIN],
  },
  { to: '/account', label: 'My Account', icon: UserRound, roles: ALL_USERS },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ALL_USERS },
]

export const MARKETING_NAV = [
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#analytics', label: 'Analytics' },
  { to: '/plans', label: 'Plans' },
]

export const PLAN_IDS = { FREE: 'free', PRO: 'pro', ENTERPRISE: 'enterprise' }

export const PLANS = [
  {
    id: PLAN_IDS.FREE,
    name: 'Free',
    tagline: 'Everything you need to see whether the numbers add up.',
    price: { monthly: 0, annual: 0 },
    cta: 'Start for free',
    features: [
      'Up to 5 accounts',
      '1 CSV upload per day',
      'Basic charts and KPI cards',
      'Core metrics on CSV Analysis',
      'Basic chat support',
    ],
    limits: { uploadsPerDay: 1, seats: 5, export: false },
  },
  {
    id: PLAN_IDS.PRO,
    name: 'Pro',
    tagline: 'The full analysis suite for a single analyst or owner.',
    price: { monthly: 1499, annual: 14390 },
    cta: 'Upgrade to Pro',
    highlight: true,
    features: [
      'Higher individual account limit',
      'Increased upload limit',
      'Advanced charts and KPI cards',
      'Full analysis suite',
      'PDF report export',
      'Priority chat support',
      'Trial available on premium features',
    ],
    limits: { uploadsPerDay: 25, seats: 1, export: true },
  },
  {
    id: PLAN_IDS.ENTERPRISE,
    name: 'Enterprise',
    tagline: 'Shared analytics for an organisation and its team.',
    price: { monthly: 4999, annual: 47990 },
    cta: 'Talk to us',
    features: [
      'Organisation with team members',
      'Shared and increased uploads',
      'Advanced charts and KPI cards',
      'Full analysis suite',
      'PDF report export',
      'Organisation and team page',
      'Priority chat support',
    ],
    limits: { uploadsPerDay: 100, seats: 25, export: true },
  },
]

/** Row-by-row comparison used on the Plans page, straight from the doc. */
export const PLAN_MATRIX = [
  { feature: 'Accounts', free: '4–5 accounts', pro: 'Higher / individual', enterprise: 'Organisation + team members' },
  { feature: 'CSV uploads', free: '1 per day', pro: 'Increased upload limit', enterprise: 'Increased / shared uploads' },
  { feature: 'Dashboard & charts', free: 'Basic charts & KPIs', pro: 'Advanced charts & KPIs', enterprise: 'Advanced charts & KPIs' },
  { feature: 'CSV Analysis page', free: 'Core metrics only', pro: 'Full analysis suite', enterprise: 'Full analysis suite' },
  { feature: 'PDF report export', free: false, pro: true, enterprise: true },
  { feature: 'Organisation / team page', free: false, pro: false, enterprise: true },
  { feature: 'Chat sidebar support', free: 'Basic', pro: 'Priority', enterprise: 'Priority' },
  { feature: 'Trial period', free: false, pro: 'Premium features', enterprise: 'Premium features' },
  { feature: 'Payment gateway', free: 'Not required', pro: 'Not required', enterprise: 'Not required' },
]

export const DATE_RANGES = [
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '6m', label: '6M' },
  { id: '12m', label: '12M' },
]

export const STORAGE_KEYS = {
  theme: 'insightmart.theme',
  token: 'insightmart.token',
  user: 'insightmart.user',
}
