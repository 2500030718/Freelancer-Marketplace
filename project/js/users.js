/**
 * SkillBridge - Users & Freelancers Helper & Rendering Module
 *
 * Rules:
 * - Uses storage helpers from storage.js (getAll)
 * - NO direct localStorage calls in this file
 */

/**
 * Retrieves all registered users with the 'freelancer' role.
 * @returns {Array} Array of freelancer user objects
 */
function getAllFreelancers() {
  const users = getAll('users');
  return users.filter((u) => u.role === 'freelancer');
}

/** Alias used by the freelancer browse page. */
function getFreelancers() {
  return getAllFreelancers();
}

/** Filters freelancers by a case-insensitive keyword and/or skill. */
function filterFreelancers(list, { keyword = '', skill = '' } = {}) {
  const keywordQuery = String(keyword).trim().toLowerCase();
  const skillQuery = String(skill).trim().toLowerCase();
  return (Array.isArray(list) ? list : []).filter((freelancer) => {
    const matchesKeyword = !keywordQuery ||
      `${freelancer.name || ''} ${freelancer.bio || ''}`.toLowerCase().includes(keywordQuery);
    const matchesSkill = !skillQuery ||
      (Array.isArray(freelancer.skills) && freelancer.skills.some((item) =>
        String(item).toLowerCase().includes(skillQuery)
      ));
    return matchesKeyword && matchesSkill;
  });
}

/**
 * Finds a single user by ID.
 * @param {string} userId - User identifier
 * @returns {Object|null} User object or null if not found
 */
function getUserById(userId) {
  if (!userId) return null;
  const users = getAll('users');
  return users.find((u) => String(u.id) === String(userId)) || null;
}

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string} Escaped string
 */
function escapeUserHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates HTML string for a single freelancer profile card.
 * @param {Object} freelancer - Freelancer user object
 * @returns {string} HTML string
 */
function renderFreelancerCardHTML(freelancer) {
  const nameInitial = (freelancer.name || 'F').charAt(0).toUpperCase();

  const skillsHtml = Array.isArray(freelancer.skills) && freelancer.skills.length > 0
    ? freelancer.skills
        .map((skill) => `<span class="badge" style="background-color: rgba(37,99,235,0.08); color: var(--color-primary); font-size: 0.75rem;">${escapeUserHtml(skill)}</span>`)
        .join(' ')
    : '<span style="color: var(--color-text-muted); font-size: 0.8125rem;">No skills listed yet</span>';

  const bioText = freelancer.bio && freelancer.bio.trim()
    ? escapeUserHtml(freelancer.bio)
    : 'No bio provided yet. Browse their skills and portfolio to learn more.';

  return `
    <article class="card freelancer-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background-color: var(--color-primary); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0;">
            ${escapeUserHtml(nameInitial)}
          </div>
          <div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text); margin: 0; line-height: 1.3;">
              <a href="freelancer-profile.html?id=${encodeURIComponent(freelancer.id)}" style="color: inherit; text-decoration: none;">
                ${escapeUserHtml(freelancer.name)}
              </a>
            </h3>
            <span class="badge badge-accepted" style="font-size: 0.7rem; padding: 0.15rem 0.5rem; margin-top: 0.25rem;">Freelancer</span>
          </div>
        </div>

        <p style="color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.25rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${bioText}
        </p>

        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.375rem;">Skills</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
            ${skillsHtml}
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: 0.5rem; display: flex; justify-content: flex-end;">
        <a href="freelancer-profile.html?id=${encodeURIComponent(freelancer.id)}" class="btn btn-outline" style="padding: 0.4rem 0.875rem; font-size: 0.8125rem; width: 100%;">
          View Profile &rarr;
        </a>
      </div>
    </article>
  `;
}

/**
 * Renders a list of freelancers into a container element.
 * @param {HTMLElement|string} container - Element or selector
 * @param {Array} freelancers - Freelancers array
 */
function renderFreelancerList(container, freelancers) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;

  if (!freelancers || freelancers.length === 0) {
    el.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem 1.5rem; grid-column: 1 / -1;">
        <div style="margin-bottom: 1rem;">
          <span class="badge badge-open">No Freelancers Registered</span>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text);">
          No freelancers have joined yet
        </h3>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto; font-size: 0.9375rem;">
          Freelancers who sign up with a freelancer profile will appear here with their skills and portfolios.
        </p>
      </div>
    `;
    return;
  }

  el.innerHTML = freelancers.map(renderFreelancerCardHTML).join('');
}

/**
 * Updates a freelancer's profile in the 'users' store and updates currentUser in storage.
 * @param {string} userId - User ID to update
 * @param {Object} profileData - { bio, skills, portfolio }
 * @returns {Object|null} Updated user object
 */
function updateFreelancerProfile(userId, profileData) {
  if (!userId) return null;
  const updates = {};
  if (profileData.bio !== undefined) updates.bio = String(profileData.bio).trim();
  if (profileData.skills !== undefined) {
    updates.skills = Array.isArray(profileData.skills)
      ? profileData.skills
      : String(profileData.skills).split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (profileData.portfolio !== undefined) {
    updates.portfolio = Array.isArray(profileData.portfolio) ? profileData.portfolio : [];
  }

  const updatedUser = updateItem('users', userId, updates);

  if (updatedUser) {
    const current = getCurrentUser();
    if (current && String(current.id) === String(userId)) {
      setCurrentUser(updatedUser);
    }
  }

  return updatedUser;
}

// Browser global bindings
if (typeof window !== 'undefined') {
  window.getAllFreelancers = getAllFreelancers;
  window.getFreelancers = getFreelancers;
  window.filterFreelancers = filterFreelancers;
  window.getUserById = getUserById;
  window.renderFreelancerCardHTML = renderFreelancerCardHTML;
  window.renderFreelancerList = renderFreelancerList;
  window.updateFreelancerProfile = updateFreelancerProfile;
}
