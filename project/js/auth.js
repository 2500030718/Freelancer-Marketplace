/**
 * SkillBridge - Authentication & Role Guard System
 *
 * Rules:
 * - Uses storage helpers from storage.js (getAll, addItem, setCurrentUser, getCurrentUser, clearCurrentUser)
 * - Uses generateId() from utils.js
 * - NO direct localStorage calls in this file
 */

/**
 * Display helper for signup inline errors
 * @param {Object} errors - Map of field names to error messages
 */
function displaySignupErrors(errors) {
  clearSignupErrors();

  for (const [field, message] of Object.entries(errors)) {
    if (field === 'general') {
      const generalEl = document.getElementById('signup-general-error');
      if (generalEl) {
        generalEl.textContent = message;
        generalEl.style.display = 'block';
      }
    } else {
      const inputEl = document.getElementById(field);
      const errorEl = document.getElementById(`${field}-error`);
      if (inputEl) {
        inputEl.classList.add('input-error');
      }
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
    }
  }
}

/**
 * Clear all signup validation errors from the DOM
 */
function clearSignupErrors() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const inputs = form.querySelectorAll('.input');
  inputs.forEach((input) => input.classList.remove('input-error'));

  const errorMessages = form.querySelectorAll('.input-error-message');
  errorMessages.forEach((msg) => {
    msg.textContent = '';
    msg.style.display = 'none';
  });
}

/**
 * Display helper for login inline errors
 * @param {Object} errors - Map of error keys to error messages
 */
function displayLoginErrors(errors) {
  clearLoginErrors();

  if (errors.general) {
    const generalEl = document.getElementById('login-general-error');
    if (generalEl) {
      generalEl.textContent = errors.general;
      generalEl.style.display = 'block';
    }
    const emailInput = document.getElementById('login-email') || document.getElementById('email');
    const passwordInput = document.getElementById('login-password') || document.getElementById('password');
    if (emailInput) emailInput.classList.add('input-error');
    if (passwordInput) passwordInput.classList.add('input-error');
  }

  if (errors.email) {
    const emailInput = document.getElementById('login-email') || document.getElementById('email');
    const emailError = document.getElementById('login-email-error') || document.getElementById('email-error');
    if (emailInput) emailInput.classList.add('input-error');
    if (emailError) {
      emailError.textContent = errors.email;
      emailError.style.display = 'block';
    }
  }

  if (errors.password) {
    const passwordInput = document.getElementById('login-password') || document.getElementById('password');
    const passwordError = document.getElementById('login-password-error') || document.getElementById('password-error');
    if (passwordInput) passwordInput.classList.add('input-error');
    if (passwordError) {
      passwordError.textContent = errors.password;
      passwordError.style.display = 'block';
    }
  }
}

/**
 * Clear all login validation errors from the DOM
 */
function clearLoginErrors() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const inputs = form.querySelectorAll('.input');
  inputs.forEach((input) => input.classList.remove('input-error'));

  const errorMessages = form.querySelectorAll('.input-error-message');
  errorMessages.forEach((msg) => {
    msg.textContent = '';
    msg.style.display = 'none';
  });
}

/**
 * Validates and registers a new user.
 * 
 * @param {Object|FormData|HTMLFormElement} [formData] - User data or form container
 * @returns {Object} Result { success: boolean, errors?: Object, user?: Object }
 */
function signup(formData) {
  // If invoked as an event listener directly: signup(event)
  if (formData && typeof formData.preventDefault === 'function') {
    formData.preventDefault();
    formData = undefined;
  }

  let data = {};

  if (typeof HTMLFormElement !== 'undefined' && formData instanceof HTMLFormElement) {
    const fd = new FormData(formData);
    for (const [k, v] of fd.entries()) {
      data[k] = v;
    }
  } else if (typeof FormData !== 'undefined' && formData instanceof FormData) {
    for (const [k, v] of formData.entries()) {
      data[k] = v;
    }
  } else if (typeof formData === 'object' && formData !== null) {
    data = { ...formData };
  } else {
    // Fall back to reading from #signup-form in the DOM
    const form = document.getElementById('signup-form');
    if (form) {
      const fd = new FormData(form);
      for (const [k, v] of fd.entries()) {
        data[k] = v;
      }
    }
  }

  // Fallback checks for specific elements if not captured by FormData
  if (!data.name) {
    const nameEl = document.getElementById('name');
    if (nameEl) data.name = nameEl.value;
  }
  if (!data.email) {
    const emailEl = document.getElementById('email');
    if (emailEl) data.email = emailEl.value;
  }
  if (!data.password) {
    const passEl = document.getElementById('password');
    if (passEl) data.password = passEl.value;
  }
  if (!data.role) {
    const roleEl = document.getElementById('role');
    if (roleEl && roleEl.value) {
      data.role = roleEl.value;
    } else {
      const checkedRadio = document.querySelector('input[name="role"]:checked');
      if (checkedRadio) data.role = checkedRadio.value;
    }
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const password = String(data.password || '');
  const role = String(data.role || '').trim().toLowerCase();

  const errors = {};

  // 1. Validate name
  if (!name) {
    errors.name = 'Full name is required.';
  }

  // 2. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  // 3. Validate password length (>= 6)
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  // 4. Validate selected role ("client" or "freelancer")
  if (!role || (role !== 'client' && role !== 'freelancer')) {
    errors.role = 'Please select a role (client or freelancer).';
  }

  // 5. Check getAll('users') for existing user with same email
  if (!errors.email) {
    const existingUsers = getAll('users');
    const emailExists = existingUsers.some(
      (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      errors.email = 'An account with this email already exists.';
    }
  }

  // If validation fails, display inline errors and do NOT create the account
  if (Object.keys(errors).length > 0) {
    displaySignupErrors(errors);
    return { success: false, errors };
  }

  clearSignupErrors();

  // 6. Build new user object
  const newUser = {
    id: generateId('u'),
    role: role,
    name: name,
    email: email,
    password: password,
    bio: '',
    skills: [],
    portfolio: [],
    createdAt: new Date().toISOString()
  };

  // 7. Persist user using storage helper
  addItem('users', newUser);

  // 8. Redirect to login.html on success
  window.location.href = 'login.html';

  return { success: true, user: newUser };
}

/**
 * Authenticates a user by email and password.
 * 
 * @param {string|Object} [email] - User email or credentials object
 * @param {string} [password] - User password
 * @returns {Object} Result { success: boolean, error?: string, user?: Object }
 */
function login(email, password) {
  // If invoked as an event listener directly: login(event)
  if (email && typeof email.preventDefault === 'function') {
    email.preventDefault();
    email = undefined;
  }

  // If first argument is an object containing credentials
  if (email && typeof email === 'object' && ('email' in email || 'password' in email)) {
    password = email.password;
    email = email.email;
  }

  // If called without string parameters, read from DOM elements
  if (typeof email !== 'string' || typeof password !== 'string') {
    const emailEl = document.getElementById('login-email') || document.getElementById('email');
    const passEl = document.getElementById('login-password') || document.getElementById('password');
    email = emailEl ? emailEl.value : '';
    password = passEl ? passEl.value : '';
  }

  const cleanEmail = String(email || '').trim();
  const cleanPassword = String(password || '');

  const errors = {};
  if (!cleanEmail) {
    errors.email = 'Email address is required.';
  }
  if (!cleanPassword) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    displayLoginErrors(errors);
    return { success: false, errors };
  }

  // Find matching user in getAll('users') by email AND password
  const users = getAll('users');
  const matchedUser = users.find(
    (u) => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase() && u.password === cleanPassword
  );

  // If not found, show inline error on the form and do not redirect
  if (!matchedUser) {
    const errorMsg = 'Invalid email or password.';
    displayLoginErrors({ general: errorMsg });
    return { success: false, error: errorMsg };
  }

  clearLoginErrors();

  // If found, setCurrentUser(user)
  setCurrentUser(matchedUser);

  // Redirect based on role
  if (matchedUser.role === 'client') {
    window.location.href = 'client-dashboard.html';
  } else if (matchedUser.role === 'freelancer') {
    window.location.href = 'freelancer-dashboard.html';
  } else if (matchedUser.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'index.html';
  }

  return { success: true, user: matchedUser };
}

/**
 * Logs out the current user and redirects to login.html.
 */
function logout() {
  clearCurrentUser();
  window.location.href = 'login.html';
}

/**
 * Route guard function to protect authenticated pages.
 * If user is null or currentUser.role !== allowedRole, redirects to login.html.
 * 
 * @param {string|string[]} allowedRole - Allowed role or array of allowed roles
 * @returns {Object|null} Current user if authorized, or null if redirected
 */
function requireRole(allowedRole) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = 'login.html';
    return null;
  }

  if (Array.isArray(allowedRole)) {
    if (!allowedRole.includes(currentUser.role)) {
      window.location.href = 'login.html';
      return null;
    }
  } else if (currentUser.role !== allowedRole) {
    window.location.href = 'login.html';
    return null;
  }

  return currentUser;
}

/**
 * Wires DOM event listeners on signup.html and login.html forms
 */
function initAuthForms() {
  // Wire Signup Form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      signup(new FormData(signupForm));
    });

    // Clear field-level error styling on input
    signupForm.querySelectorAll('.input').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errElem = document.getElementById(`${input.id}-error`);
        if (errElem) {
          errElem.textContent = '';
          errElem.style.display = 'none';
        }
        const generalErr = document.getElementById('signup-general-error');
        if (generalErr) {
          generalErr.textContent = '';
          generalErr.style.display = 'none';
        }
      });

      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
          input.classList.remove('input-error');
          const errElem = document.getElementById(`${input.id}-error`);
          if (errElem) {
            errElem.textContent = '';
            errElem.style.display = 'none';
          }
        });
      }
    });
  }

  // Wire Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('login-email') || document.getElementById('email') || loginForm.elements['email'];
      const passInput = document.getElementById('login-password') || document.getElementById('password') || loginForm.elements['password'];
      const email = emailInput ? emailInput.value : '';
      const password = passInput ? passInput.value : '';
      login(email, password);
    });

    loginForm.querySelectorAll('.input').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errElem = document.getElementById(`${input.id}-error`);
        if (errElem) {
          errElem.textContent = '';
          errElem.style.display = 'none';
        }
        const generalErr = document.getElementById('login-general-error');
        if (generalErr) {
          generalErr.textContent = '';
          generalErr.style.display = 'none';
        }
      });
    });
  }
}

// Auto-initialize form listeners if in a browser document
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthForms);
  } else {
    initAuthForms();
  }
}

// Explicit window bindings for browser global availability
if (typeof window !== 'undefined') {
  window.signup = signup;
  window.login = login;
  window.logout = logout;
  window.requireRole = requireRole;
  window.displaySignupErrors = displaySignupErrors;
  window.clearSignupErrors = clearSignupErrors;
  window.displayLoginErrors = displayLoginErrors;
  window.clearLoginErrors = clearLoginErrors;
  window.initAuthForms = initAuthForms;
}
