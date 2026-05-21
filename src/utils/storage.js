/**
 * Safely parse a value from localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if key doesn't exist or parsing fails
 * @returns {any} parsed value or defaultValue
 */
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely store a value in localStorage
 * @param {string} key - localStorage key
 * @param {any} value - value to store (will be stringified)
 */
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save to localStorage key "${key}":`, error);
  }
};
