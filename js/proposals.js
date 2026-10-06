/**
 * SkillBridge - Proposals Management Module
 *
 * Rules:
 * - Uses storage helpers from storage.js (getAll, addItem, updateItem, saveAll)
 * - Uses generateId() from utils.js
 * - NO direct localStorage calls in this file
 */

/**
 * Submits a new proposal from a freelancer for a specific project.
 * Blocks duplicate proposals from the same freelancer on the same project.
 *
 * @param {string} projectId - Target project ID
 * @param {string} freelancerId - Freelancer user ID
 * @param {string} message - Cover letter / proposal message
 * @param {number|string} bidAmount - Bid amount in USD
 * @returns {Object} { success: boolean, error?: string, proposal?: Object }
 */
function submitProposal(projectId, freelancerId, message, bidAmount) {
  if (!projectId || !freelancerId) {
    return { success: false, error: 'Project ID and Freelancer ID are required.' };
  }

  // 1. Block if this freelancer already has a proposal on this project
  const existingProposals = getAll('proposals');
  const alreadyProposed = existingProposals.some(
    (p) => String(p.projectId) === String(projectId) && String(p.freelancerId) === String(freelancerId)
  );

  if (alreadyProposed) {
    return {
      success: false,
      error: 'You have already submitted a proposal for this project.'
    };
  }

  const cleanMessage = String(message || '').trim();
  const numBid = Number(bidAmount);

  if (!cleanMessage) {
    return { success: false, error: 'Proposal message cannot be empty.' };
  }

  if (isNaN(numBid) || numBid <= 0) {
    return { success: false, error: 'Please specify a valid bid amount.' };
  }

  // 2. Build proposal object with ID prefix 'pp'
  const newProposal = {
    id: generateId('pp'),
    projectId: String(projectId),
    freelancerId: String(freelancerId),
    message: cleanMessage,
    bidAmount: numBid,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  addItem('proposals', newProposal);

  return { success: true, proposal: newProposal };
}

/**
 * Filter helper: retrieves all proposals for a given project ID.
 * @param {string} projectId
 * @returns {Array} Array of proposals
 */
function getProposalsForProject(projectId) {
  if (!projectId) return [];
  const proposals = getAll('proposals');
  return proposals.filter((p) => String(p.projectId) === String(projectId));
}

/**
 * Filter helper: retrieves all proposals submitted by a given freelancer ID.
 * @param {string} freelancerId
 * @returns {Array} Array of proposals sorted newest first
 */
function getProposalsForFreelancer(freelancerId) {
  if (!freelancerId) return [];
  const proposals = getAll('proposals');
  return proposals
    .filter((p) => String(p.freelancerId) === String(freelancerId))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/**
 * Accepts a specific proposal:
 * - sets target proposal status to 'ACCEPTED'
 * - sets every other proposal on the same projectId to 'REJECTED'
 * - updates the project: status = 'IN_PROGRESS', acceptedProposalId = proposalId
 *
 * @param {string} proposalId
 * @returns {boolean} True if accepted successfully
 */
function acceptProposal(proposalId) {
  if (!proposalId) return false;

  const allProposals = getAll('proposals');
  const targetProposal = allProposals.find((p) => String(p.id) === String(proposalId));

  if (!targetProposal) return false;

  const projectId = targetProposal.projectId;

  // Set this proposal to ACCEPTED, and every other proposal on this project to REJECTED
  allProposals.forEach((p) => {
    if (String(p.projectId) === String(projectId)) {
      if (String(p.id) === String(proposalId)) {
        p.status = 'ACCEPTED';
      } else {
        p.status = 'REJECTED';
      }
    }
  });

  saveAll('proposals', allProposals);

  // Update project status to IN_PROGRESS and link acceptedProposalId
  updateItem('projects', projectId, {
    status: 'IN_PROGRESS',
    acceptedProposalId: String(proposalId)
  });

  return true;
}

/**
 * Rejects a single proposal without modifying the project or other proposals.
 * @param {string} proposalId
 * @returns {boolean} True if rejected successfully
 */
function rejectProposal(proposalId) {
  if (!proposalId) return false;
  const updated = updateItem('proposals', proposalId, { status: 'REJECTED' });
  return updated !== null;
}

/**
 * Marks a project as COMPLETED.
 * Only proceeds if the requesting freelancer is the one associated with the project's acceptedProposalId.
 *
 * @param {string} projectId
 * @param {string} freelancerId
 * @returns {boolean} True if successfully marked completed
 */
function markProjectCompleted(projectId, freelancerId) {
  if (!projectId || !freelancerId) return false;

  const allProjects = getAll('projects');
  const project = allProjects.find((p) => String(p.id) === String(projectId));

  if (!project || !project.acceptedProposalId) {
    return false;
  }

  // Look up the accepted proposal
  const allProposals = getAll('proposals');
  const acceptedProp = allProposals.find((p) => String(p.id) === String(project.acceptedProposalId));

  if (!acceptedProp || String(acceptedProp.freelancerId) !== String(freelancerId)) {
    return false;
  }

  updateItem('projects', projectId, { status: 'COMPLETED' });
  return true;
}

// Browser global bindings
if (typeof window !== 'undefined') {
  window.submitProposal = submitProposal;
  window.getProposalsForProject = getProposalsForProject;
  window.getProposalsForFreelancer = getProposalsForFreelancer;
  window.acceptProposal = acceptProposal;
  window.rejectProposal = rejectProposal;
  window.markProjectCompleted = markProjectCompleted;
}
