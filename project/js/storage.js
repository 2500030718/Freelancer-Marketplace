/**
 * SkillBridge - LocalStorage Helper Functions
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * These helper functions are the ONLY functions in the entire project
 * allowed to touch localStorage directly. All other modules must interact
 * with data through these storage helpers.
 */

/**
 * Parses and returns the array stored at the specified key.
 * Returns an empty array [] if missing, empty, or invalid JSON.
 * @param {string} key - The localStorage key
 * @returns {Array} Array of stored items, or empty array
 */
function getAll(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error parsing items for key "${key}" from localStorage:`, error);
    return [];
  }
}

/**
 * Serializes and saves an array to localStorage under the specified key.
 * @param {string} key - The localStorage key
 * @param {Array} array - The array of items to store
 */
function saveAll(key, array) {
  try {
    const safeArray = Array.isArray(array) ? array : [];
    localStorage.setItem(key, JSON.stringify(safeArray));
  } catch (error) {
    console.error(`Error saving items for key "${key}" to localStorage:`, error);
  }
}

/**
 * Pushes a new object into the stored array and saves it.
 * @param {string} key - The localStorage key
 * @param {Object} obj - The object to append
 * @returns {Object} The added object
 */
function addItem(key, obj) {
  const items = getAll(key);
  items.push(obj);
  saveAll(key, items);
  return obj;
}

/**
 * Finds an item by id in the stored array, merges updates, and saves.
 * @param {string} key - The localStorage key
 * @param {string|number} id - The ID of the item to update
 * @param {Object} updates - Key-value pairs to merge into the item
 * @returns {Object|null} The updated item, or null if not found
 */
function updateItem(key, id, updates) {
  const items = getAll(key);
  const index = items.findIndex((item) => String(item.id) === String(id));
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveAll(key, items);
    return items[index];
  }
  return null;
}

/**
 * Filters out an item by id from the stored array and saves.
 * @param {string} key - The localStorage key
 * @param {string|number} id - The ID of the item to remove
 * @returns {boolean} True if an item was removed, false otherwise
 */
function removeItem(key, id) {
  const items = getAll(key);
  const filtered = items.filter((item) => String(item.id) !== String(id));
  const removed = filtered.length !== items.length;
  saveAll(key, filtered);
  return removed;
}

/**
 * Retrieves the currently logged-in user object from "currentUser".
 * @returns {Object|null} The current user object or null if not set
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading currentUser from localStorage:', error);
    return null;
  }
}

/**
 * Stores the current user object under "currentUser" in localStorage.
 * @param {Object} obj - The user object to set as current user
 */
function setCurrentUser(obj) {
  try {
    if (!obj) {
      clearCurrentUser();
      return;
    }
    localStorage.setItem('currentUser', JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving currentUser to localStorage:', error);
  }
}

/**
 * Removes the "currentUser" key from localStorage.
 */
function clearCurrentUser() {
  try {
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Error clearing currentUser from localStorage:', error);
  }
}

// Explicit window bindings for browser global availability
window.getAll = getAll;
window.saveAll = saveAll;
window.addItem = addItem;
window.updateItem = updateItem;
window.removeItem = removeItem;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
