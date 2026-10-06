/**
 * SkillBridge - Admin data helpers and dashboard rendering.
 * All data is read and changed through the storage helpers.
 */

function getStats() {
  const users = getAll('users');
  const projects = getAll('projects');
  const proposals = getAll('proposals');
  return {
    totalUsers: users.length,
    totalClients: users.filter((user) => user.role === 'client').length,
    totalFreelancers: users.filter((user) => user.role === 'freelancer').length,
    totalProjects: projects.length,
    totalProposals: proposals.length,
    projectsByStatus: {
      OPEN: projects.filter((project) => String(project.status || '').toUpperCase() === 'OPEN').length,
      IN_PROGRESS: projects.filter((project) => String(project.status || '').toUpperCase() === 'IN_PROGRESS').length,
      COMPLETED: projects.filter((project) => String(project.status || '').toUpperCase() === 'COMPLETED').length
    }
  };
}

function removeUser(userId) {
  return removeItem('users', userId);
}

function removeProject(projectId) {
  const removed = removeItem('projects', projectId);
  const remainingProposals = getAll('proposals').filter(
    (proposal) => String(proposal.projectId) !== String(projectId)
  );
  saveAll('proposals', remainingProposals);
  return removed;
}

function renderAdminStats() {
  const stats = getStats();
  const container = document.getElementById('admin-stats');
  if (!container) return;
  const entries = [
    ['Total Users', stats.totalUsers], ['Clients', stats.totalClients],
    ['Freelancers', stats.totalFreelancers], ['Projects', stats.totalProjects],
    ['Proposals', stats.totalProposals], ['Open Projects', stats.projectsByStatus.OPEN],
    ['In Progress', stats.projectsByStatus.IN_PROGRESS], ['Completed', stats.projectsByStatus.COMPLETED]
  ];
  container.innerHTML = entries.map(([label, value]) =>
    `<div class="card stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`
  ).join('');
}

function renderAdminUsers() {
  const body = document.getElementById('users-table-body');
  if (!body) return;
  const admin = getCurrentUser();
  const users = getAll('users');
  body.innerHTML = users.length ? users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name || '')}</td>
      <td>${escapeHtml(user.email || '')}</td>
      <td>${escapeHtml(user.role || '')}</td>
      <td>${user.createdAt ? escapeHtml(new Date(user.createdAt).toLocaleDateString()) : '—'}</td>
      <td>${admin && String(user.id) === String(admin.id) ? 'You' : `<button class="btn btn-outline" data-remove-user="${escapeHtml(user.id)}">Remove</button>`}</td>
    </tr>`).join('') : '<tr><td colspan="5">No users found.</td></tr>';
  body.querySelectorAll('[data-remove-user]').forEach((button) => button.addEventListener('click', () => {
    removeUser(button.dataset.removeUser);
    renderAdminUsers(); renderAdminStats();
  }));
}

function renderAdminProjects() {
  const body = document.getElementById('projects-table-body');
  if (!body) return;
  const projects = getAll('projects');
  body.innerHTML = projects.length ? projects.map((project) => {
    const client = getUserById(project.clientId);
    const status = String(project.status || '');
    return `<tr>
      <td>${escapeHtml(project.title || '')}</td>
      <td>${escapeHtml(client ? client.name : 'Unknown client')}</td>
      <td><span class="badge ${getStatusBadgeClass(status)}">${escapeHtml(status)}</span></td>
      <td>${escapeHtml(formatCurrency(project.budget))}</td>
      <td><button class="btn btn-outline" data-remove-project="${escapeHtml(project.id)}">Remove</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="5">No projects found.</td></tr>';
  body.querySelectorAll('[data-remove-project]').forEach((button) => button.addEventListener('click', () => {
    removeProject(button.dataset.removeProject);
    renderAdminProjects(); renderAdminProposals(); renderAdminStats();
  }));
}

function renderAdminProposals() {
  const body = document.getElementById('proposals-table-body');
  if (!body) return;
  const proposals = getAll('proposals');
  body.innerHTML = proposals.length ? proposals.map((proposal) => {
    const project = getAll('projects').find((item) => String(item.id) === String(proposal.projectId));
    const freelancer = getUserById(proposal.freelancerId);
    const status = String(proposal.status || '');
    return `<tr>
      <td>${escapeHtml(project ? project.title : 'Unknown project')}</td>
      <td>${escapeHtml(freelancer ? freelancer.name : 'Unknown freelancer')}</td>
      <td>${escapeHtml(formatCurrency(proposal.bidAmount))}</td>
      <td><span class="badge ${getStatusBadgeClass(status)}">${escapeHtml(status)}</span></td>
    </tr>`;
  }).join('') : '<tr><td colspan="4">No proposals found.</td></tr>';
}

function renderAdminDashboard() {
  renderAdminStats();
  renderAdminUsers();
  renderAdminProjects();
  renderAdminProposals();
}

if (typeof window !== 'undefined') {
  window.getStats = getStats;
  window.removeUser = removeUser;
  window.removeProject = removeProject;
  window.renderAdminDashboard = renderAdminDashboard;
}
