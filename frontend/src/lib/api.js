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

// For endpoints that stream raw bytes back (e.g. private KYC documents)
// instead of JSON — error responses are still JSON, so only fall back to
// reading the body as a Blob once we know the request succeeded.
async function requestBlob(path, { method = 'GET', accessToken } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return res.blob();
}

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  registerRequestOtp: (phone) => request('/auth/register/request-otp', { method: 'POST', body: { phone } }),
  registerVerifyOtp: (phone, otp) => request('/auth/register/verify-otp', { method: 'POST', body: { phone, otp } }),
  registerComplete: (phone, password, fullName, role, termsVersionHash = 'tc_v2026_08_12', privacyVersionHash = 'pp_v2026_08_12') =>
    request('/auth/register/complete', { method: 'POST', body: { phone, password, fullName, role, termsVersionHash, privacyVersionHash } }),
  loginPassword: (identifier, password) => request('/auth/login/password', { method: 'POST', body: { identifier, password } }),
  loginOtpRequest: (identifier) => request('/auth/login/otp/request', { method: 'POST', body: { identifier } }),
  loginOtpVerify: (identifier, otp) => request('/auth/login/otp/verify', { method: 'POST', body: { identifier, otp } }),
  forgotPasswordRequest: (identifier) => request('/auth/forgot-password/request', { method: 'POST', body: { identifier } }),
  forgotPasswordReset: (identifier, otp, newPassword) => request('/auth/forgot-password/reset', { method: 'POST', body: { identifier, otp, newPassword } }),
  requestEmailVerification: (email, accessToken) => request('/auth/email/request', { method: 'POST', body: { email }, accessToken }),
  verifyEmail: (otp, accessToken) => request('/auth/email/verify', { method: 'POST', body: { otp }, accessToken }),
  setRole: (role, accessToken) => request('/auth/role', { method: 'POST', body: { role }, accessToken }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  me: (accessToken) => request('/auth/me', { accessToken }),
  logout: (accessToken) => request('/auth/logout', { method: 'POST', accessToken }),

  // ── Users (profile) ──────────────────────────────────────────────────────
  getProfile: (accessToken) => request('/users/profile', { accessToken }),
  updateProfile: (data, accessToken) => request('/users/profile', { method: 'PUT', body: data, accessToken }),
  // GET /users/:id/public — anyone's profile, works logged-out too
  getPublicProfile: (id, accessToken) => request(`/users/${id}/public`, { accessToken }),
 
  // ── Verification (user-facing) ────────────────────────────────────────────
  // POST /verification/document — new versioned KYC upload
  uploadVerificationDocument: ({ file, documentType }, accessToken) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return requestMultipart('/verification/document', { method: 'POST', body: form, accessToken });
  },
  // GET /verification/status — current KYC status for logged-in user
  getVerificationStatus: (accessToken) => request('/verification/status', { accessToken }),
  // GET /verification/history — all submitted versions
  getVerificationHistory: (accessToken) => request('/verification/history', { accessToken }),

  // ── Verification (admin — /admin/verification/…) ──────────────────────────
  // GET /admin/verification/queue?status=pending&page=1&limit=20
  adminVerifQueue: ({ status = 'pending', page = 1, limit = 20 } = {}, accessToken) =>
    request(`/admin/verification/queue?status=${status}&page=${page}&limit=${limit}`, { accessToken }),
  // POST /admin/verification/:id/claim
  adminVerifClaim: (docId, accessToken) =>
    request(`/admin/verification/${docId}/claim`, { method: 'POST', accessToken }),
  // GET /admin/verification/:id/file — streams blob; pass download=1 to force attachment
  adminVerifFile: (docId, accessToken, download = false) =>
    requestBlob(`/admin/verification/${docId}/file${download ? '?download=1' : ''}`, { accessToken }),
  // POST /admin/verification/:id/approve
  adminVerifApprove: (docId, accessToken) =>
    request(`/admin/verification/${docId}/approve`, { method: 'POST', accessToken }),
  // POST /admin/verification/:id/reject  { reason }
  adminVerifReject: (docId, reason, accessToken) =>
    request(`/admin/verification/${docId}/reject`, { method: 'POST', body: { reason }, accessToken }),
  // POST /admin/verification/:id/reupload  { reason }
  adminVerifReupload: (docId, reason, accessToken) =>
    request(`/admin/verification/${docId}/reupload`, { method: 'POST', body: { reason }, accessToken }),
  // GET /admin/verification/:id/audit — immutable audit timeline
  adminVerifAudit: (docId, accessToken) =>
    request(`/admin/verification/${docId}/audit`, { accessToken }),

 
  // ── Admin — users ────────────────────────────────────────────────────────
  adminGetUsers: ({ page = 1, limit = 20, search = '' } = {}, accessToken) =>
    request(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { accessToken }),
  adminGetUser: (id, accessToken) => request(`/admin/users/${id}`, { accessToken }),
  adminSuspendUser: (id, reason, accessToken) => request(`/admin/users/${id}/suspend`, { method: 'POST', body: { reason }, accessToken }),
  adminUnsuspendUser: (id, accessToken) => request(`/admin/users/${id}/unsuspend`, { method: 'POST', accessToken }),
  adminBanUser: (id, accessToken) => request(`/admin/users/${id}/ban`, { method: 'POST', accessToken }),

  // ── Admin — reports (AdminReportsController — new) ────────────────────────
  // GET /admin/reports?status=open&severity=critical&page=1&limit=20
  adminGetReports: ({ status = 'open', severity, page = 1, limit = 20 } = {}, accessToken) => {
    const q = new URLSearchParams({ status, page: String(page), limit: String(limit) });
    if (severity) q.set('severity', severity);
    return request(`/admin/reports?${q.toString()}`, { accessToken });
  },
  adminReviewReport: (id, adminNotes, accessToken) => request(`/admin/reports/${id}/review`, { method: 'POST', body: { adminNotes }, accessToken }),
  adminDismissReport: (id, note, accessToken) => request(`/admin/reports/${id}/dismiss`, { method: 'POST', body: { note }, accessToken }),

  // ── Notifications (user — adminOnly=false) ────────────────────────────────
  getNotifications: (accessToken) => request('/notifications', { accessToken }),
  getUnreadCount: (accessToken) => request('/notifications/unread-count', { accessToken }),
  markNotificationRead: (id, accessToken) => request(`/notifications/${id}/read`, { method: 'PUT', accessToken }),
  markAllNotificationsRead: (accessToken) => request('/notifications/read-all', { method: 'PUT', accessToken }),

  // ── Notifications (admin — adminOnly=true) ────────────────────────────────
  getAdminNotifications: (accessToken) => request('/notifications?adminOnly=true', { accessToken }),
  getAdminUnreadCount: (accessToken) => request('/notifications/unread-count?adminOnly=true', { accessToken }),
  markAdminAllNotificationsRead: (accessToken) => request('/notifications/read-all?adminOnly=true', { method: 'PUT', accessToken }),

  // ── Blocks ───────────────────────────────────────────────────────────────
  blockUser: (userId, accessToken) => request(`/blocks/${userId}`, { method: 'POST', accessToken }),
  unblockUser: (userId, accessToken) => request(`/blocks/${userId}`, { method: 'DELETE', accessToken }),
  getMyBlockedUsers: (accessToken) => request('/blocks/mine', { accessToken }),
  getMyBlockedUserIds: (accessToken) => request('/blocks/mine/ids', { accessToken }),

  // ── Reports (user-filed) ──────────────────────────────────────────────────
  fileReport: ({ reportedUserId, reason, details, reportContext }, accessToken) =>
    request('/reports', { method: 'POST', body: { reportedUserId, reason, details, reportContext }, accessToken }),
  getMyReports: (accessToken) => request('/reports/mine', { accessToken }),

  // ── Loan Requests — public (no auth required) ────────────────────────────
  // GET /loan-requests/search?keyword=&category=&page=&limit=&latitude=&longitude=&radiusKm=
  searchLoanRequests: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    return request(`/loan-requests/search?${q.toString()}`);
  },
  // GET /loan-requests/:id
  getLoanRequest: (id) => request(`/loan-requests/${id}`),

  // ── Loan Requests — borrower (auth required) ─────────────────────────────
  createLoanRequest: (data, accessToken) =>
    request('/loan-requests', { method: 'POST', body: data, accessToken }),
  updateLoanRequest: (id, data, accessToken) =>
    request(`/loan-requests/${id}`, { method: 'PUT', body: data, accessToken }),
  closeLoanRequest: (id, accessToken) =>
    request(`/loan-requests/${id}/close`, { method: 'PATCH', accessToken }),
  cancelLoanRequest: (id, accessToken) =>
    request(`/loan-requests/${id}/cancel`, { method: 'PATCH', accessToken }),
  getMyLoanRequests: (accessToken) =>
    request('/loan-requests/mine/list', { accessToken }),
  // PATCH /loan-requests/:id/offers/:offerId/accept — borrower accepts an offer
  acceptOffer: (loanRequestId, offerId, accessToken) =>
    request(`/loan-requests/${loanRequestId}/offers/${offerId}/accept`, { method: 'PATCH', accessToken }),
  rejectOffer: (loanRequestId, offerId, accessToken) =>
  request(`/loan-requests/${loanRequestId}/offers/${offerId}/reject`, {
    method: 'PATCH',
    accessToken,
  }),

  // ── Loan Requests — lender (auth required) ───────────────────────────────
  // POST /loan-requests/offer  { loanRequestId, message?, offeredRate? }
  sendOffer: ({ loanRequestId, message, offeredRate }, accessToken) =>
    request('/loan-requests/offer', { method: 'POST', body: { loanRequestId, message, offeredRate }, accessToken }),
  // GET /loan-requests/mine/offers-sent — every offer this lender has sent
  getMyOffersSent: (accessToken) =>
    request('/loan-requests/mine/offers-sent', { accessToken }),
  withdrawOffer: (loanRequestId, offerId, accessToken) =>
    request(`/loan-requests/${loanRequestId}/offers/${offerId}/withdraw`, { method: 'PATCH', accessToken }),

  // ── Chat ─────────────────────────────────────────────────────────────
  // GET /chat/conversations — all threads for the logged-in user
  getChatConversations: (accessToken) => request('/chat/conversations', { accessToken }),
  // GET /chat/conversations/for-offer/:loanRequestId/:lenderId — get-or-create
  getOrCreateChatConversation: (loanRequestId, lenderId, accessToken) =>
    request(`/chat/conversations/for-offer/${loanRequestId}/${lenderId}`, { accessToken }),
  // GET /chat/conversations/:id/messages?before=&limit=
  getChatMessages: (conversationId, { before, limit = 30 } = {}, accessToken) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (before) q.set('before', before);
    return request(`/chat/conversations/${conversationId}/messages?${q.toString()}`, { accessToken });
  },
  // POST /chat/conversations/:id/read — REST fallback, socket also does this live
  markChatRead: (conversationId, accessToken) =>
    request(`/chat/conversations/${conversationId}/read`, { method: 'POST', accessToken }),
  // POST /chat/upload — upload photo/document
  uploadChatMedia: (file, accessToken) => {
    const form = new FormData();
    form.append('file', file);
    return requestMultipart('/chat/upload', { method: 'POST', body: form, accessToken });
  },
  // POST /chat/messages/:id/edit
  editChatMessage: (id, text, accessToken) =>
    request(`/chat/messages/${id}/edit`, { method: 'POST', body: { text }, accessToken }),
  // POST /chat/messages/:id/react
  reactChatMessage: (id, emoji, accessToken) =>
    request(`/chat/messages/${id}/react`, { method: 'POST', body: { emoji }, accessToken }),
  // DELETE /chat/messages/:id/for-me
  deleteChatMessageForMe: (id, accessToken) =>
    request(`/chat/messages/${id}/for-me`, { method: 'DELETE', accessToken }),
};

 