import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);

export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getDashboard = (params) => api.get('/dashboard', { params });
export const sendReport = (formData) => api.post('/send-report', formData);

// Bank Account Services
export const getBankAccounts = () => api.get('/bank-accounts');
export const createBankAccount = (data) => api.post('/bank-accounts', data);
export const deleteBankAccount = (id) => api.delete(`/bank-accounts/${id}`);

export default api;
