// Replace these URLs with your actual Render deployment URL after creating the service
export const API_URL = import.meta.env.PROD
    ? 'https://sms-backend-lsxv.onrender.com/api'
    : '/api';

export const SOCKET_URL = import.meta.env.PROD
    ? 'https://sms-backend-lsxv.onrender.com'
    : '';
