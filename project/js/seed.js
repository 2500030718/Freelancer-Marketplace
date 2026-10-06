/** Adds the prototype's fixed administrator once, using the shared storage API. */
function seedAdmin() {
  const adminEmail = 'admin@skillbridge.local';
  const existing = getAll('users').find((user) =>
    String(user.email || '').toLowerCase() === adminEmail
  );
  if (existing) return existing;

  const admin = {
    id: 'u_admin_skillbridge',
    name: 'SkillBridge Admin',
    email: adminEmail,
    password: 'admin123',
    role: 'admin',
    bio: '',
    skills: [],
    portfolio: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  addItem('users', admin);
  return admin;
}

if (typeof window !== 'undefined') window.seedAdmin = seedAdmin;
