const ADMIN_TOKEN_KEY = 'ai_chat_admin_token';

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY);

export const setAdminToken = (token) => sessionStorage.setItem(ADMIN_TOKEN_KEY, token);

export const clearAdminToken = () => sessionStorage.removeItem(ADMIN_TOKEN_KEY);

export const getAdminHeaders = (headers = {}) => {
  const token = getAdminToken();
  return {
    ...headers,
    ...(token ? { 'x-admin-token': token } : {}),
  };
};