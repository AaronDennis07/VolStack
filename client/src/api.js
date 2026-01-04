import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPrediction = async () => {
  const response = await api.get('/predict');
  return response.data;
};

export const feedNifty = async (data) => {
  // Wrap single object in array as expected by backend
  return await api.post('/feed/nifty', [data]);
};

export const feedVix = async (data) => {
  return await api.post('/feed/vix', [data]);
};