/**
 * SkillBridge - Projects Helper & Rendering Module
 *
 * Rules:
 * - Uses storage helpers from storage.js (getAll, addItem, updateItem)
 * - Uses generateId() from utils.js
 * - NO direct localStorage calls in this file
 */

/**
 * Returns a CSS badge class corresponding to project or proposal status.
 * @param {string} status - e.g. 'OPEN', 'IN_PROGRESS', 'COMPLETED', etc.
 * @returns {string} CSS class name
 */
function getStatusBadgeClass(status) {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'OPEN':
      return 'badge-open';
    case 'IN_PROGRESS':
    case 'IN-PROGRESS':
      return 'badge-in-progress';
    case 'COMPLETED':
      return 'badge-completed';
    case 'ACCEPTED':
      return 'badge-accepted';
    case 'PENDING':
      return 'badge-pending';
    case 'REJECTED':
      return 'badge-rejected';
    default:
      return 'badge-open';
  }
}

/**
 * Retrieves all projects belonging to a specific client ID, sorted newest first.
 * @param {string} clientId - The user ID of the client
 * @returns {Array} Array of project objects
 */
function getMyProjects(clientId) {
  if (!clientId) return [];
  const projects = getAll('projects');
  return projects
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/**
 * Finds a single project by ID.
 * @param {string} projectId - Project identifier
 * @returns {Object|null} Project object or null if not found
 */
function getProjectById(projectId) {
  if (!projectId) return null;
  const projects = getAll('projects');
  return projects.find((p) => String(p.id) === String(projectId)) || null;
}

/**
 * Retrieves all proposals submitted for a given project ID.
 * @param {string} projectId - Project identifier
 * @returns {Array} Array of proposal objects
 */
function getProjectProposals(projectId) {
  if (!projectId) return [];
  const proposals = getAll('proposals');
  return proposals.filter((p) => String(p.projectId) === String(projectId));
}

/**
 * Builds and saves a new project.
 * @param {Object} data - Project data
 * @param {string} data.clientId - Client's user ID
 * @param {string} data.title - Title
 * @param {string} data.description - Detailed description
 * @param {string[]|string} data.skillsNeeded - Array or comma-delimited string
 * @param {number|string} data.budget - Budget amount
 * @param {string} data.deadline - Target deadline date
 * @returns {Object} Created project object
 */
function createProject(data) {
  let skills = [];
  if (Array.isArray(data.skillsNeeded)) {
    skills = data.skillsNeeded.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof data.skillsNeeded === 'string') {
    skills = data.skillsNeeded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const project = {
    id: generateId('pr'),
    clientId: data.clientId,
    title: String(data.title || '').trim(),
    description: String(data.description || '').trim(),
    skillsNeeded: skills,
    budget: Number(data.budget) || data.budget,
    deadline: data.deadline || '',
    status: 'OPEN',
    acceptedProposalId: null,
    createdAt: new Date().toISOString()
  };

  addItem('projects', project);
  return project;
}

/**
 * Formats a currency value.
 * @param {number|string} amount
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return `$${amount}`;
  return `$${num.toLocaleString()}`;
}

/**
 * Retrieves all projects with status 'OPEN', sorted newest first.
 * @returns {Array} Array of open project objects
 */
function getOpenProjects() {
  const projects = getAll('projects');
  return projects
    .filter((p) => String(p.status || '').toUpperCase() === 'OPEN')
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/** Filters projects by a case-insensitive keyword and/or required skill. */
function filterProjects(list, { keyword = '', skill = '' } = {}) {
  const keywordQuery = String(keyword).trim().toLowerCase();
  const skillQuery = String(skill).trim().toLowerCase();
  return (Array.isArray(list) ? list : []).filter((project) => {
    const matchesKeyword = !keywordQuery ||
      `${project.title || ''} ${project.description || ''}`.toLowerCase().includes(keywordQuery);
    const matchesSkill = !skillQuery ||
      (Array.isArray(project.skillsNeeded) && project.skillsNeeded.some((item) =>
        String(item).toLowerCase().includes(skillQuery)
      ));
    return matchesKeyword && matchesSkill;
  });
}

/**
 * Generates HTML string for a single project card.
 * @param {Object} project - The project data
 * @param {Object} [options] - Optional settings (e.g. targetPage)
 * @returns {string} HTML string
 */
function renderProjectCardHTML(project, options = {}) {
  const badgeClass = getStatusBadgeClass(project.status);
  const formattedBudget = formatCurrency(project.budget);
  const proposals = getProjectProposals(project.id);
  const proposalCount = proposals.length;
  const targetPage = options.targetPage || 'project-details.html';
  const detailLink = `${targetPage}?id=${encodeURIComponent(project.id)}`;

  const skillsHtml = Array.isArray(project.skillsNeeded) && project.skillsNeeded.length > 0
    ? project.skillsNeeded
        .map((s) => `<span class="badge" style="background-color: rgba(37,99,235,0.08); color: var(--color-primary); font-size: 0.75rem;">${escapeHtml(s)}</span>`)
        .join(' ')
    : '<span style="color: var(--color-text-muted); font-size: 0.8125rem;">No specific skills listed</span>';

  const deadlineFormatted = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None';

  return `
    <article class="card project-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text); margin: 0; line-height: 1.3;">
            <a href="${detailLink}" style="color: inherit; text-decoration: none;">
              ${escapeHtml(project.title)}
            </a>
          </h3>
          <span class="badge ${badgeClass}">${escapeHtml(project.status)}</span>
        </div>

        <p style="color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${escapeHtml(project.description)}
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 1.25rem;">
          ${skillsHtml}
        </div>
      </div>

      <div style="border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem; font-size: 0.875rem;">
          <div>
            <span style="color: var(--color-text-muted);">Budget:</span>
            <strong style="color: var(--color-text); font-weight: 700; margin-left: 0.25rem;">${formattedBudget}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted);">Proposals:</span>
            <strong style="color: var(--color-primary); font-weight: 700; margin-left: 0.25rem;">${proposalCount}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--color-text-muted); font-size: 0.75rem;">Deadline: ${escapeHtml(deadlineFormatted)}</span>
          <a href="${detailLink}" class="btn btn-outline" style="padding: 0.375rem 0.75rem; font-size: 0.8125rem;">
            View Details &rarr;
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders a list of projects into a container element.
 * @param {HTMLElement|string} container - Element or selector
 * @param {Array} projects - Projects array
 * @param {Object} [options] - Options passed to cards or empty state
 */
function renderProjectList(container, projects, options = {}) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;

  if (!projects || projects.length === 0) {
    const emptyTitle = options.emptyTitle || "You haven't posted any projects yet";
    const emptyDesc = options.emptyMessage || "Create a project scope, budget, and required skills to receive tailored bids from skilled freelancers.";
    const ctaBtn = options.emptyCtaText
      ? `<a href="${options.emptyCtaHref || 'browse-projects.html'}" class="btn btn-primary">${escapeHtml(options.emptyCtaText)}</a>`
      : options.emptyCtaText === null
        ? ''
        : `<a href="post-project.html" class="btn btn-primary">Post a Project</a>`;

    el.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem 1.5rem; grid-column: 1 / -1;">
        <div style="margin-bottom: 1rem;">
          <span class="badge badge-open">No Projects</span>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text);">
          ${escapeHtml(emptyTitle)}
        </h3>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9375rem;">
          ${escapeHtml(emptyDesc)}
        </p>
        ${ctaBtn}
      </div>
    `;
    return;
  }

  el.innerHTML = projects.map((p) => renderProjectCardHTML(p, options)).join('');
}

// Browser global bindings
if (typeof window !== 'undefined') {
  window.getStatusBadgeClass = getStatusBadgeClass;
  window.getMyProjects = getMyProjects;
  window.getOpenProjects = getOpenProjects;
  window.filterProjects = filterProjects;
  window.getProjectById = getProjectById;
  window.getProjectProposals = getProjectProposals;
  window.createProject = createProject;
  window.renderProjectCardHTML = renderProjectCardHTML;
  window.renderProjectList = renderProjectList;
  window.formatCurrency = formatCurrency;
  window.escapeHtml = escapeHtml;
}
