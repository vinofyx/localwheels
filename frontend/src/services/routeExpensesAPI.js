import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/route-expenses',
});

export const saveRouteExpense = (data) => API.post('/', data);

export const getRouteExpenses = () => API.get('/');
