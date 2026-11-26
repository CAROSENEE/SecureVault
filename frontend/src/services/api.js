const BASE = '/api'
const KEY = 'sv_token'

// sessionStorage: the token disappears when the tab/browser is closed.
export const tokenStore = {
  get: () => sessionStorage.getItem(KEY),
  set: (t) => sessionStorage.setItem(KEY, t),
  clear: () => sessionStorage.removeItem(KEY),
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function messageFrom(data, status) {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((e) => (e.msg || '').replace(/^Value error, /, '')).filter(Boolean).join(' ')
  return status >= 500 ? 'Server error. Please try again.' : 'Something went wrong.'
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(BASE + path, { method, headers, cache: 'no-store', body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running on port 8000?')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth && token) window.dispatchEvent(new CustomEvent('sv:unauthorized', { detail: messageFrom(data, 401) }))
    throw new ApiError(res.status, messageFrom(data, res.status))
  }
  return data
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/auth/login', { method: 'POST', body: b, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (b) => request('/auth/me', { method: 'PATCH', body: b }),
  changePassword: (b) => request('/auth/change-password', { method: 'POST', body: b }),
  deleteAccount: (b) => request('/auth/delete-account', { method: 'POST', body: b }),

  listEntries: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return request('/vault' + (qs ? `?${qs}` : ''))
  },
  stats: () => request('/vault/stats'),
  getEntry: (id) => request(`/vault/${id}`),
  reveal: (id) => request(`/vault/${id}/reveal`),
  createEntry: (b) => request('/vault', { method: 'POST', body: b }),
  updateEntry: (id, b) => request(`/vault/${id}`, { method: 'PUT', body: b }),
  deleteEntry: (id) => request(`/vault/${id}`, { method: 'DELETE' }),
}
