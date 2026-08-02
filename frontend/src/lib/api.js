const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', body, accessToken } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

async function requestMultipart(path, { method = 'POST', body, accessToken } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  registerRequestOtp: (phone) => request('/auth/register/request-otp', { method: 'POST', body: { phone } }),
  registerVerifyOtp: (phone, otp) => request('/auth/register/verify-otp', { method: 'POST', body: { phone, otp } }),
  registerComplete: (phone, password, fullName, role) => request('/auth/register/complete', { method: 'POST', body: { phone, password, fullName, role } }),
  loginPassword: (identifier, password) => request('/auth/login/password', { method: 'POST', body: { identifier, password } }),
  loginOtpRequest: (identifier) => request('/auth/login/otp/request', { method: 'POST', body: { identifier } }),
  loginOtpVerify: (identifier, otp) => request('/auth/login/otp/verify', { method: 'POST', body: { identifier, otp } }),
  forgotPasswordRequest: (identifier) => request('/auth/forgot-password/request', { method: 'POST', body: { identifier } }),
  forgotPasswordReset: (identifier, otp, newPassword) => request('/auth/forgot-password/reset', { method: 'POST', body: { identifier, otp, newPassword } }),
  requestEmailVerification: (email, accessToken) => request('/auth/email/request', { method: 'POST', body: { email }, accessToken }),
  verifyEmail: (otp, accessToken) => request('/auth/email/verify', { method: 'POST', body: { otp }, accessToken }),
  getProfile: (accessToken) => request('/users/profile', { accessToken }),
  updateProfile: (data, accessToken) => request('/users/profile', { method: 'PUT', body: data, accessToken }),
  uploadDocument: ({ file, documentType }, accessToken) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return requestMultipart('/users/document', { method: 'POST', body: form, accessToken });
  },
  getNotifications: (accessToken) => request('/notifications', { accessToken }),
  getUnreadCount: (accessToken) => request('/notifications/unread-count', { accessToken }),
  markNotificationRead: (id, accessToken) => request(`/notifications/${id}/read`, { method: 'PUT', accessToken }),
  markAllNotificationsRead: (accessToken) => request('/notifications/read-all', { method: 'PUT', accessToken }),
  fileReport: ({ reportedUserId, reason, details }, accessToken) => request('/reports', { method: 'POST', body: { reportedUserId, reason, details }, accessToken }),
  getMyReports: (accessToken) => request('/reports/mine', { accessToken }),
  adminGetUsers: ({ page = 1, limit = 20, search = '' } = {}, accessToken) => request(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { accessToken }),
  adminGetUser: (id, accessToken) => request(`/admin/users/${id}`, { accessToken }),
  adminSuspendUser: (id, reason, accessToken) => request(`/admin/users/${id}/suspend`, { method: 'POST', body: { reason }, accessToken }),
  adminUnsuspendUser: (id, accessToken) => request(`/admin/users/${id}/unsuspend`, { method: 'POST', accessToken }),
  adminBanUser: (id, accessToken) => request(`/admin/users/${id}/ban`, { method: 'POST', accessToken }),
  adminGetPendingDocuments: (accessToken) => request('/admin/documents/pending', { accessToken }),
  adminApproveDocument: (userId, accessToken) => request(`/admin/documents/${userId}/approve`, { method: 'POST', accessToken }),
  adminRejectDocument: (userId, reason, accessToken) => request(`/admin/documents/${userId}/reject`, { method: 'POST', body: { reason }, accessToken }),
  adminGetReports: (status = 'open', accessToken) => request(`/admin/reports?status=${status}`, { accessToken }),
  adminReviewReport: (id, adminNotes, accessToken) => request(`/admin/reports/${id}/review`, { method: 'POST', body: { adminNotes }, accessToken }),
  adminDismissReport: (id, accessToken) => request(`/admin/reports/${id}/dismiss`, { method: 'POST', accessToken }),
  setRole: (role, accessToken) => request('/auth/role', { method: 'POST', body: { role }, accessToken }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  me: (accessToken) => request('/auth/me', { accessToken }),
  logout: (accessToken) => request('/auth/logout', { method: 'POST', accessToken }),
};