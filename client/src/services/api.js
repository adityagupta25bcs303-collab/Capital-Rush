const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getUserRole = () => localStorage.getItem('role');
export const setUserRole = (role) => localStorage.setItem('role', role);
export const removeUserRole = () => localStorage.removeItem('role');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Authentication
export const loginParticipant = (email, password) =>
  request('/auth/participant/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const registerParticipant = (name, email, password, teamId, teamName) =>
  request('/auth/participant/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, teamId, teamName })
  });

export const loginAdmin = (adminId, password) =>
  request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ adminId, password })
  });

export const getMe = () => request('/auth/me');

// Team endpoints
export const getMyTeam = () => request('/teams/my-team');
export const getTeamByTeamId = (teamId) => request(`/teams/${teamId}`);
export const lookupTeamForTransfer = (teamId) => request(`/teams/lookup/${teamId}`);

// Round operations
export const allocateRound1 = (bank, stocks, gold) =>
  request('/rounds/round1/allocate', {
    method: 'POST',
    body: JSON.stringify({ bank, stocks, gold })
  });

export const adminModifyStockResult = (teamId, stockReturnPercent) =>
  request('/rounds/round1/admin/stock-result', {
    method: 'POST',
    body: JSON.stringify({ teamId, stockRate: stockReturnPercent })
  });

export const adminModifyAssetOutcome = (payload) =>
  request('/rounds/round1/admin/asset-outcome', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

// Round 2 Arena Tasks
export const getRound2Tasks = () => request('/rounds/round2/tasks');

export const enterRound2Task = (taskKey, teamId = null) =>
  request('/rounds/round2/tasks/enter', {
    method: 'POST',
    body: JSON.stringify({ taskKey, teamId })
  });

export const scoreRound2Task = (payload) =>
  request('/rounds/round2/tasks/score', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const adminQuickMoneyUpdate = (teamId, amount, action, reason) =>
  request('/rounds/round2/admin/quick-money', {
    method: 'POST',
    body: JSON.stringify({ teamId, amount, action, reason })
  });

export const executeRound3Transfer = (recipientTeamId, amount) =>
  request('/rounds/round3/transfer', {
    method: 'POST',
    body: JSON.stringify({ recipientTeamId, amount })
  });

// Leaderboard & Settings
export const getLeaderboard = () => request('/leaderboard');
export const getGameSettings = () => request('/game-settings');
export const updateGameSettings = (settings) =>
  request('/game-settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });

// Admin management
export const getAdminStats = () => request('/admin/stats');
export const getAllTeams = () => request('/admin/teams');
export const createTeam = (name, startingCapital) =>
  request('/admin/teams', {
    method: 'POST',
    body: JSON.stringify({ name, startingCapital })
  });
export const deleteTeam = (teamId) =>
  request(`/admin/teams/${teamId}`, {
    method: 'DELETE'
  });

export const getAllParticipants = () => request('/admin/participants');
export const createParticipant = (name, email, password, teamId) =>
  request('/admin/participants', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, teamId })
  });

export const resetParticipantPassword = (userId, newPassword) =>
  request('/admin/participants/reset-password', {
    method: 'PUT',
    body: JSON.stringify({ userId, newPassword })
  });

export const toggleParticipantStatus = (userId) =>
  request(`/admin/participants/${userId}/status`, {
    method: 'PATCH'
  });

export const deleteParticipant = (userId) =>
  request(`/admin/participants/${userId}`, {
    method: 'DELETE'
  });

export const getAuditLogs = () => request('/admin/audit-logs');
export const resetToCleanSlate = () =>
  request('/admin/system/clean-slate', {
    method: 'POST'
  });
export const getAllTransactions = (teamId = '', round = '') =>
  request(`/admin/transactions?teamId=${teamId}&round=${round}`);
