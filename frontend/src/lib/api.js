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

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // Registration Flow
  registerRequestOtp: (phone) => 
    request('/auth/register/request-otp', { method: 'POST', body: { phone } }),
  
  registerVerifyOtp: (phone, otp) => 
    request('/auth/register/verify-otp', { method: 'POST', body: { phone, otp } }),
  
  registerComplete: (phone, password, fullName, role) => 
    request('/auth/register/complete', { method: 'POST', body: { phone, password, fullName, role } }),

  // Password Login Flow
  loginPassword: (identifier, password) => 
    request('/auth/login/password', { method: 'POST', body: { identifier, password } }),

  // OTP Login Flow
  loginOtpRequest: (identifier) => 
    request('/auth/login/otp/request', { method: 'POST', body: { identifier } }),
  
  loginOtpVerify: (identifier, otp) => 
    request('/auth/login/otp/verify', { method: 'POST', body: { identifier, otp } }),

  // Forgot Password Flow
  forgotPasswordRequest: (identifier) => 
    request('/auth/forgot-password/request', { method: 'POST', body: { identifier } }),
  
  forgotPasswordReset: (identifier, otp, newPassword) => 
    request('/auth/forgot-password/reset', { method: 'POST', body: { identifier, otp, newPassword } }),

  // Email Verification Flow
  requestEmailVerification: (email, accessToken) => 
    request('/auth/email/request', { method: 'POST', body: { email }, accessToken }),
  
  verifyEmail: (otp, accessToken) => 
    request('/auth/email/verify', { method: 'POST', body: { otp }, accessToken }),

  // User Profile Flow
  getProfile: (accessToken) =>
    request('/users/profile', { accessToken }),

  updateProfile: (data, accessToken) =>
    request('/users/profile', { method: 'PUT', body: data, accessToken }),

  // General session / tokens
  setRole: (role, accessToken) => 
    request('/auth/role', { method: 'POST', body: { role }, accessToken }),
  
  refresh: () => 
    request('/auth/refresh', { method: 'POST' }),
  
  me: (accessToken) => 
    request('/auth/me', { accessToken }),
  
  logout: (accessToken) => 
    request('/auth/logout', { method: 'POST', accessToken }),
};
