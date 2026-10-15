import axios from 'axios';

// In Docker/production, Nginx proxies /api to the backend service.
// Set REACT_APP_API_BASE_URL at build time only when using a separate API host.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
const TODOS_URL = `${API_BASE_URL.replace(/\/$/, '')}/todos`;

const todoService = {
  getAllTodos: () => axios.get(TODOS_URL),
  createTodo: (todo) => axios.post(TODOS_URL, todo),
  updateTodo: (id, todo) => axios.put(`${TODOS_URL}/${id}`, todo),
  deleteTodo: (id) => axios.delete(`${TODOS_URL}/${id}`),
  summarizeTodos: () => axios.post(`${TODOS_URL}/summarize`),
};

export default todoService;
