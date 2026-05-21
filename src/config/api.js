const API_BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const apiBaseUrl = API_BASE_URL;

export const apiUrl = (path = "") => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const assetUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
};
