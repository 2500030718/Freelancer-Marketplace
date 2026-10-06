/**
 * SkillBridge - General Utility Functions
 */

/**
 * Generates a unique identifier string with a given prefix.
 * Format: prefix + "_" + Date.now() + Math.floor(Math.random()*1000)
 * 
 * @param {string} [prefix='id'] - Optional prefix (e.g., 'proj', 'user', 'prop')
 * @returns {string} Unique identifier
 */
function generateId(prefix = 'id') {
  const safePrefix = prefix ? prefix : 'id';
  return safePrefix + '_' + Date.now() + Math.floor(Math.random() * 1000);
}

// Explicit window binding for browser global availability
window.generateId = generateId;
