// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Full API endpoint with /api prefix
export const API_URL = `${API_BASE_URL}/api`;

export default {
  API_BASE_URL,
  API_URL,
};
