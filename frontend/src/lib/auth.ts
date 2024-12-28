const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCSRFToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
}

export async function login(username: string, password: string) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

export async function logout() {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/logout/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
}

export async function signup(username: string, password: string) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/signup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Signup failed');
  }

  return response.json();
}

export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/user/`, {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
