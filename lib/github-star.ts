export const GITHUB_STAR_MESSAGE_SOURCE = 'personal-theme-blog-github-star';

export type GitHubStarOAuthStatus = 'success' | 'error';

export type GitHubStarOAuthMessage = {
  source: typeof GITHUB_STAR_MESSAGE_SOURCE;
  status: GitHubStarOAuthStatus;
};

/** Validates the same-origin message sent from the OAuth popup to its opener. */
export function isGitHubStarOAuthMessage(value: unknown): value is GitHubStarOAuthMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as Partial<GitHubStarOAuthMessage>;
  return message.source === GITHUB_STAR_MESSAGE_SOURCE
    && (message.status === 'success' || message.status === 'error');
}
