/**
 * In-browser stand-in for the Flask REST API.
 *
 * Every resolver mirrors the shape the real endpoint is expected to return,
 * so `services/api.js` can swap between the two without callers changing.
 * A small artificial latency keeps loading and skeleton states honest.
 */

import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  ORGANISATION,
  UPLOADS,
  PLATFORM_USERS,
  PLATFORM_ORGS,
  SALES_RECORDS,
  computeKpis,
  monthlyTrend,
  quarterlyTrend,
  yearlyTrend,
  orderValueHistogram,
  retentionTrend,
  branchProfitability,
  topProducts,
  categoryShare,
  regionShare,
} from './mockData'

const latency = (ms = 480) => new Promise((resolve) => setTimeout(resolve, ms))

/** Mirrors an axios error closely enough for the UI's catch blocks. */
function apiError(status, message) {
  const error = new Error(message)
  error.response = { status, data: { message } }
  return error
}

// Registrations made during the session live here so a signup can log in.
const sessionAccounts = [...DEMO_ACCOUNTS]

const fakeToken = (user) =>
  `mock.${btoa(JSON.stringify({ sub: user.id, role: user.role, iat: Date.now() }))}.signature`

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

async function login({ email, password }) {
  await latency(620)
  const user = sessionAccounts.find((u) => u.email.toLowerCase() === String(email).toLowerCase())

  if (!user) throw apiError(401, 'No account found with that email address.')
  if (password !== DEMO_PASSWORD && password !== user.password) {
    throw apiError(401, 'That password is incorrect.')
  }

  return { user, access_token: fakeToken(user) }
}

async function register(payload) {
  await latency(760)
  const exists = sessionAccounts.some(
    (u) => u.email.toLowerCase() === String(payload.email).toLowerCase(),
  )
  if (exists) throw apiError(409, 'An account with that email already exists.')

  const isEnterprise = payload.accountType === 'enterprise'
  const user = {
    id: `usr_${Date.now()}`,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: isEnterprise ? 'enterprise' : 'individual',
    plan: isEnterprise ? 'enterprise' : 'free',
    organisationId: isEnterprise ? 'org_new' : null,
    organisationName: isEnterprise ? payload.organisationName : null,
    joinedAt: new Date().toISOString(),
    uploadsThisMonth: 0,
    uploadLimit: isEnterprise ? 300 : 30,
  }

  sessionAccounts.push(user)
  return { user, access_token: fakeToken(user) }
}

async function forgotPassword({ email }) {
  await latency(520)
  return { message: `If an account exists for ${email}, a reset link is on its way.` }
}

/* ------------------------------------------------------------------ *
 * Account
 * ------------------------------------------------------------------ */

async function getProfile(currentUser) {
  await latency(340)
  return { user: currentUser }
}

async function updateProfile(patch, currentUser) {
  await latency(680)
  const updated = { ...currentUser, ...patch }
  const index = sessionAccounts.findIndex((u) => u.id === currentUser.id)
  if (index >= 0) sessionAccounts[index] = updated
  return { user: updated }
}

async function changePassword({ currentPassword }) {
  await latency(720)
  if (currentPassword !== DEMO_PASSWORD) {
    throw apiError(400, 'Your current password does not match our records.')
  }
  return { message: 'Password updated.' }
}

/* ------------------------------------------------------------------ *
 * Dashboard and analytics
 * ------------------------------------------------------------------ */

/** Trims the dataset so the range filter visibly changes the charts. */
function sliceByRange(range) {
  const monthsBack = { '30d': 1, '90d': 3, '6m': 6, '12m': 12 }[range] ?? 12
  const cutoff = 12 - monthsBack
  return SALES_RECORDS.filter((r) => r.monthIndex >= cutoff)
}

async function getDashboard({ range = '12m' } = {}) {
  await latency(560)
  const records = sliceByRange(range)

  return {
    range,
    kpis: computeKpis(records),
    revenueTrend: monthlyTrend(records),
    categoryShare: categoryShare(records),
    regionShare: regionShare(records),
    topProducts: topProducts(records, 5),
    recentUploads: UPLOADS.slice(0, 5),
  }
}

async function getAnalysis({ uploadId } = {}) {
  await latency(900)
  const records = SALES_RECORDS

  return {
    uploadId: uploadId ?? UPLOADS[0].id,
    rowsAnalysed: records.length,
    hasCostData: true,
    kpis: computeKpis(records),
    salesByPeriod: {
      month: monthlyTrend(records),
      quarter: quarterlyTrend(records),
      year: yearlyTrend(records),
    },
    revenueTrend: monthlyTrend(records),
    topProducts: topProducts(records, 6),
    categoryShare: categoryShare(records),
    regionShare: regionShare(records),
    orderValueHistogram: orderValueHistogram(records),
    retention: retentionTrend(records),
    branchProfitability: branchProfitability(records),
  }
}

async function uploadCsv(file, onProgress) {
  // Report progress in steps so the upload ring actually animates.
  for (let pct = 0; pct <= 100; pct += 8) {
    await latency(60)
    onProgress?.(Math.min(pct, 100))
  }
  await latency(420)

  return {
    upload: {
      id: `up_${Date.now()}`,
      filename: file?.name ?? 'sales.csv',
      size: file?.size ?? 0,
      rows: SALES_RECORDS.length,
      status: 'processed',
      uploadedAt: new Date().toISOString(),
    },
  }
}

async function getUploads() {
  await latency(400)
  return { uploads: UPLOADS }
}

async function exportReport() {
  await latency(1400)
  return { message: 'Report generated.', filename: 'insightmart-analysis.pdf' }
}

/* ------------------------------------------------------------------ *
 * Organisation
 * ------------------------------------------------------------------ */

const orgState = { ...ORGANISATION, members: [...ORGANISATION.members] }

async function getOrganisation() {
  await latency(520)
  return { organisation: orgState }
}

async function inviteMember({ name, email, role }) {
  await latency(760)
  if (orgState.members.some((m) => m.email.toLowerCase() === String(email).toLowerCase())) {
    throw apiError(409, 'That person is already part of this organisation.')
  }

  const member = {
    id: `mem_${Date.now()}`,
    name,
    email,
    role,
    status: 'invited',
    lastActive: null,
    uploads: 0,
  }
  orgState.members = [...orgState.members, member]
  orgState.seatsUsed += 1
  return { member }
}

async function updateMemberRole({ memberId, role }) {
  await latency(420)
  orgState.members = orgState.members.map((m) => (m.id === memberId ? { ...m, role } : m))
  return { members: orgState.members }
}

async function removeMember({ memberId }) {
  await latency(480)
  orgState.members = orgState.members.filter((m) => m.id !== memberId)
  orgState.seatsUsed = Math.max(0, orgState.seatsUsed - 1)
  return { members: orgState.members }
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

async function getAdminOverview() {
  await latency(640)
  const totalUploads = PLATFORM_ORGS.reduce((n, o) => n + o.uploads, 0)

  return {
    stats: {
      users: PLATFORM_USERS.length,
      organisations: PLATFORM_ORGS.length,
      uploads: totalUploads,
      activeSubscriptions: PLATFORM_USERS.filter((u) => u.plan !== 'free').length,
    },
    users: PLATFORM_USERS,
    organisations: PLATFORM_ORGS,
    uploads: UPLOADS,
    planDistribution: [
      { name: 'Free', revenue: PLATFORM_USERS.filter((u) => u.plan === 'free').length },
      { name: 'Pro', revenue: PLATFORM_USERS.filter((u) => u.plan === 'pro').length },
      { name: 'Enterprise', revenue: PLATFORM_USERS.filter((u) => u.plan === 'enterprise').length },
    ],
  }
}

async function updateUserStatus({ userId, status }) {
  await latency(420)
  const index = PLATFORM_USERS.findIndex((u) => u.id === userId)
  if (index >= 0) PLATFORM_USERS[index] = { ...PLATFORM_USERS[index], status }
  return { user: PLATFORM_USERS[index] }
}

async function updateUser({ userId, patch }) {
  await latency(560)
  const index = PLATFORM_USERS.findIndex((u) => u.id === userId)
  if (index < 0) throw apiError(404, 'That user no longer exists.')

  const clash = PLATFORM_USERS.some(
    (u) => u.id !== userId && u.email.toLowerCase() === String(patch.email).toLowerCase(),
  )
  if (clash) throw apiError(409, 'Another account already uses that email address.')

  PLATFORM_USERS[index] = { ...PLATFORM_USERS[index], ...patch }
  return { user: PLATFORM_USERS[index] }
}

async function deleteUser({ userId }) {
  await latency(520)
  const index = PLATFORM_USERS.findIndex((u) => u.id === userId)
  if (index < 0) throw apiError(404, 'That user no longer exists.')
  const [removed] = PLATFORM_USERS.splice(index, 1)
  return { user: removed }
}

async function deleteOrganisation({ orgId }) {
  await latency(540)
  const index = PLATFORM_ORGS.findIndex((o) => o.id === orgId)
  if (index < 0) throw apiError(404, 'That organisation no longer exists.')
  const [removed] = PLATFORM_ORGS.splice(index, 1)
  return { organisation: removed }
}

async function deleteUpload({ uploadId }) {
  await latency(480)
  const index = UPLOADS.findIndex((u) => u.id === uploadId)
  if (index < 0) throw apiError(404, 'That upload no longer exists.')
  const [removed] = UPLOADS.splice(index, 1)
  return { upload: removed }
}

/* ------------------------------------------------------------------ *
 * Subscription
 * ------------------------------------------------------------------ */

async function changePlan({ planId }, currentUser) {
  await latency(820)
  return { user: { ...currentUser, plan: planId } }
}

export const mockApi = {
  login,
  register,
  forgotPassword,
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
  getAnalysis,
  uploadCsv,
  getUploads,
  exportReport,
  getOrganisation,
  inviteMember,
  updateMemberRole,
  removeMember,
  getAdminOverview,
  updateUserStatus,
  updateUser,
  deleteUser,
  deleteOrganisation,
  deleteUpload,
  changePlan,
}

export default mockApi
