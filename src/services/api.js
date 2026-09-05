/**
 * The single gateway between the React app and the Flask REST API.
 *
 * Components never talk to axios directly - they call the named functions
 * below. When VITE_USE_MOCK is true those functions resolve against the
 * in-browser mock backend instead, so the whole UI is reviewable before
 * Flask exists. Flip the flag and nothing above this file changes.
 */

import axios from 'axios'
import { mockApi } from './mock/mockApi'
import { STORAGE_KEYS } from '@/lib/constants'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

/** Attach the JWT that Flask-JWT-Extended expects. */
http.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEYS.token) ?? 'null')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    /* no usable token - send the request unauthenticated */
  }
  return config
})

// Callback the auth context registers so a rejected token logs the user out.
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) onUnauthorized?.()
    return Promise.reject(error)
  },
)

/** Normalise any failure into a message the UI can show directly. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    (error?.code === 'ECONNABORTED' ? 'The request timed out.' : null) ??
    (error?.message === 'Network Error'
      ? 'Could not reach the server. Is the Flask API running?'
      : null) ??
    fallback
  )
}

const unwrap = (response) => response.data

/** Pull the download name Flask sent, e.g. attachment; filename=report.pdf */
function filenameFromResponse(response, fallback) {
  const header = response.headers?.['content-disposition'] ?? ''
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return match ? decodeURIComponent(match[1]) : fallback
}

/** Hand a downloaded blob to the browser so it actually lands in Downloads. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the write before dropping the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export const authApi = {
  login: (credentials) =>
    USE_MOCK ? mockApi.login(credentials) : http.post('/auth/login', credentials).then(unwrap),

  register: (payload) =>
    USE_MOCK ? mockApi.register(payload) : http.post('/auth/register', payload).then(unwrap),

  forgotPassword: (payload) =>
    USE_MOCK
      ? mockApi.forgotPassword(payload)
      : http.post('/auth/forgot-password', payload).then(unwrap),

  logout: () => (USE_MOCK ? Promise.resolve({ ok: true }) : http.post('/auth/logout').then(unwrap)),
}

/* ------------------------------------------------------------------ *
 * Account
 * ------------------------------------------------------------------ */

export const accountApi = {
  getProfile: (currentUser) =>
    USE_MOCK ? mockApi.getProfile(currentUser) : http.get('/account/profile').then(unwrap),

  updateProfile: (patch, currentUser) =>
    USE_MOCK
      ? mockApi.updateProfile(patch, currentUser)
      : http.put('/account/profile', patch).then(unwrap),

  changePassword: (payload) =>
    USE_MOCK
      ? mockApi.changePassword(payload)
      : http.put('/account/password', payload).then(unwrap),

  changePlan: (payload, currentUser) =>
    USE_MOCK
      ? mockApi.changePlan(payload, currentUser)
      : http.post('/account/subscription', payload).then(unwrap),
}

/* ------------------------------------------------------------------ *
 * Dashboard, analysis and uploads
 * ------------------------------------------------------------------ */

export const dashboardApi = {
  get: (params) =>
    // The trailing slash matters: Flask registers "/api/dashboard/" and
    // 308-redirects the un-slashed form, which a CORS preflight rejects.
    USE_MOCK ? mockApi.getDashboard(params) : http.get('/dashboard/', { params }).then(unwrap),
}

export const analysisApi = {
  get: (params) =>
    USE_MOCK ? mockApi.getAnalysis(params) : http.get('/analysis/', { params }).then(unwrap),

  listUploads: () => (USE_MOCK ? mockApi.getUploads() : http.get('/analysis/uploads').then(unwrap)),

  upload: (file, onProgress) => {
    if (USE_MOCK) return mockApi.uploadCsv(file, onProgress)

    const form = new FormData()
    form.append('file', file)
    return http
      .post('/analysis/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return
          onProgress?.(Math.round((event.loaded * 100) / event.total))
        },
      })
      .then(unwrap)
  },

  exportReport: (uploadId) => {
    if (USE_MOCK) return mockApi.exportReport(uploadId)
    // ReportLab returns a binary PDF, so this one bypasses the JSON unwrap.
    return http
      .get(`/analysis/${uploadId}/report`, { responseType: 'blob' })
      .then((response) => {
        const filename = filenameFromResponse(response, 'insightmart-analysis.pdf')
        // Fetching the blob is not enough - the browser only writes a file
        // when something clicks a download link for it.
        saveBlob(response.data, filename)
        return { blob: response.data, filename }
      })
  },
}

/* ------------------------------------------------------------------ *
 * Organisation
 * ------------------------------------------------------------------ */

export const organisationApi = {
  get: () => (USE_MOCK ? mockApi.getOrganisation() : http.get('/organisation').then(unwrap)),

  invite: (payload) =>
    USE_MOCK ? mockApi.inviteMember(payload) : http.post('/organisation/members', payload).then(unwrap),

  updateRole: (payload) =>
    USE_MOCK
      ? mockApi.updateMemberRole(payload)
      : http.put(`/organisation/members/${payload.memberId}`, { role: payload.role }).then(unwrap),

  remove: (payload) =>
    USE_MOCK
      ? mockApi.removeMember(payload)
      : http.delete(`/organisation/members/${payload.memberId}`).then(unwrap),
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export const adminApi = {
  overview: () => (USE_MOCK ? mockApi.getAdminOverview() : http.get('/admin/overview').then(unwrap)),

  setUserStatus: (payload) =>
    USE_MOCK
      ? mockApi.updateUserStatus(payload)
      : http.put(`/admin/users/${payload.userId}/status`, { status: payload.status }).then(unwrap),

  updateUser: (payload) =>
    USE_MOCK
      ? mockApi.updateUser(payload)
      : http.put(`/admin/users/${payload.userId}`, payload.patch).then(unwrap),

  deleteUser: (payload) =>
    USE_MOCK ? mockApi.deleteUser(payload) : http.delete(`/admin/users/${payload.userId}`).then(unwrap),

  deleteOrganisation: (payload) =>
    USE_MOCK
      ? mockApi.deleteOrganisation(payload)
      : http.delete(`/admin/organisations/${payload.orgId}`).then(unwrap),

  deleteUpload: (payload) =>
    USE_MOCK
      ? mockApi.deleteUpload(payload)
      : http.delete(`/admin/uploads/${payload.uploadId}`).then(unwrap),
}

export default http
