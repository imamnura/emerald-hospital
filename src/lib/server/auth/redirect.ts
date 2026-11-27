/** Landing page after sign-in when no (valid) `redirect` target was given. */
export function homeFor(role: 'manager' | 'patient'): '/manager' | '/home' {
	return role === 'manager' ? '/manager' : '/home';
}

/**
 * Accept only same-site absolute paths as a post-login target: must start with `/`,
 * not `//` (protocol-relative) and not `/login` (would loop). Anything else is `null`.
 */
export function sanitizeRedirect(path: string | null | undefined): string | null {
	if (!path) return null;
	if (!path.startsWith('/') || path.startsWith('//')) return null;
	if (path.startsWith('/login')) return null;
	return path;
}
