import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401/403 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken
        });

        if (response.data.success) {
          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and go to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout', {}),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refresh_token: refreshToken })
};

// Medicine APIs
export const medicineAPI = {
  getAll: (params) => api.get('/medicines', { params }),
  search: (query, filters) => api.get('/medicines/search', { params: { q: query, ...filters } }),
  getById: (id) => api.get(`/medicines/${id}`)
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  pay: (id, data) => api.put(`/orders/${id}/pay`, data),
  cancel: (id) => api.put(`/orders/${id}/cancel`, {}),
  refund: (id) => api.post(`/orders/${id}/refund`, {})
};

// Delivery APIs
export const deliveryAPI = {
  getByOrder: (orderId) => api.get(`/deliveries/order/${orderId}`),
  getById: (id) => api.get(`/deliveries/${id}`),
  getMyDeliveries: (params) => api.get('/deliveries/agent/my-deliveries', { params }),
  updateStatus: (id, data) => api.put(`/deliveries/${id}/status`, data)
};

// Prescription APIs
export const prescriptionAPI = {
  upload: (formData) => api.post('/prescriptions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`)
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/users/addresses/${id}/set-default`, {})
};
