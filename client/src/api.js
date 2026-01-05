import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const getPrediction = async () => {
  const response = await api.get('/predict');
  return response.data;
};

// --- NEW DATA FETCHING FUNCTIONS ---
export const getNiftyHistory = async (days = 30) => {
  const response = await api.get(`/data/nifty?days=${days}`);
  return response.data;
};

export const getVixHistory = async (days = 30) => {
  const response = await api.get(`/data/vix?days=${days}`);
  return response.data;
};

export const feedNifty = async (data) => api.post('/feed/nifty', [data]);
export const feedVix = async (data) => api.post('/feed/vix', [data]);