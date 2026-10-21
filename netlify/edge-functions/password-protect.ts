// Asks for a username and password (HTTP Basic Auth) before serving any page.
// Credentials come from the SITE_USERNAME and SITE_PASSWORD environment variables.
export default async (req: Request) => {
  const username = Netlify.env.get('SITE_USERNAME')
  const password = Netlify.env.get('SITE_PASSWORD')

  // Fail closed: if the credentials haven't been set, don't serve the site.
  if (!username || !password) {
    return new Response('Password protection is not configured yet.', { status: 503 })
  }

  const header = req.headers.get('authorization') || ''
  if (header.startsWith('Basic ')) {
    let decoded = ''
    try {
      decoded = atob(header.slice(6))
    } catch {
      // Malformed header, fall through to the login prompt.
    }
    const separator = decoded.indexOf(':')
    if (separator !== -1) {
      const userMatches = safeEqual(decoded.slice(0, separator), username)
      const passMatches = safeEqual(decoded.slice(separator + 1), password)
      if (userMatches && passMatches) return
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="JS Carpentry", charset="UTF-8"' },
  })
}

// Compares strings without stopping at the first mismatch.
function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  }
  return diff === 0
}

export const config = {
  path: '/*',
}
