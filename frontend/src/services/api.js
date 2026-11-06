const BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('otban_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('otban_token', token);
  } else {
    localStorage.removeItem('otban_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Jika body bukan FormData, set default Content-Type ke application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Respon server tidak valid.' }));

  if (!response.ok) {
    throw new Error(data.message || `Terjadi kesalahan (Kode: ${response.status})`);
  }

  return data;
}

// API methods
export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  // Intern Attendance
  getTodayStatus: () => apiRequest('/attendance/today'),
  checkIn: (coords) => apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify(coords) }),
  checkOut: (data) => apiRequest('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  getMyHistory: (params = '') => apiRequest(`/attendance/my-history${params}`),
  getMyStats: () => apiRequest('/attendance/my-stats'),

  // Intern Leaves
  applyLeave: (formData) => apiRequest('/leaves/apply', { method: 'POST', body: formData }),
  getMyLeaves: () => apiRequest('/leaves/my-leaves'),
  cancelLeave: (id) => apiRequest(`/leaves/${id}`, { method: 'DELETE' }),

  // Admin
  getDashboardStats: () => apiRequest('/admin/dashboard-stats'),
  getAllInterns: (params = '') => apiRequest(`/admin/interns${params}`),
  createIntern: (data) => apiRequest('/admin/interns', { method: 'POST', body: JSON.stringify(data) }),
  updateIntern: (id, data) => apiRequest(`/admin/interns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetInternPassword: (id, data) => apiRequest(`/admin/interns/${id}/reset-password`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIntern: (id) => apiRequest(`/admin/interns/${id}`, { method: 'DELETE' }),
  getAllAttendances: (params = '') => apiRequest(`/admin/attendances${params}`),
  getAllLeaves: (params = '') => apiRequest(`/admin/leaves${params}`),
  verifyLeave: (id, data) => apiRequest(`/admin/leaves/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) }),
  getSettings: () => apiRequest('/admin/settings'),
  updateSettings: (data) => apiRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getReports: (params = '') => apiRequest(`/admin/reports${params}`),
};
