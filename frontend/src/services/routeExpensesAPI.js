/**
 * Route Expenses service — uses the central axios instance so that:
 *  - JWT token is automatically attached (interceptor in api/client.js)
 *  - 401 responses auto-logout the user
 *  - Works in both dev (Vite proxy → localhost:5000) and production (Vercel → Render)
 */
import api from '../api/client';

const BASE = '/route-expenses';

export const saveRouteExpense  = (data)   => api.post(BASE, data);
export const getRouteExpenses  = ()       => api.get(BASE);
export const getRouteExpenseById = (id)   => api.get(`${BASE}/${id}`);
export const updateRouteExpense  = (id, data) => api.put(`${BASE}/${id}`, data);
export const deleteRouteExpense  = (id)   => api.delete(`${BASE}/${id}`);
