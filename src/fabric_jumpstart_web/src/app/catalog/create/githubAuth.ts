/**
 * GitHub Personal Access Token auth helper.
 *
 * Tokens are stored in sessionStorage so they persist for the browser session
 * but are cleared when the tab is closed. They are only ever sent to api.github.com.
 */

const SESSION_KEY = 'fj_github_token';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export function getStoredToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function storeToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function verifyToken(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid token — please check your PAT and try again.');
    throw new Error(`GitHub API error ${res.status}`);
  }
  const data = await res.json();
  return { login: data.login, name: data.name, avatar_url: data.avatar_url };
}
