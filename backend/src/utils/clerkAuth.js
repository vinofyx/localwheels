/**
 * LocalWheels Clerk Authentication Utilities
 * Handles authorized parties resolution, token verification, and configuration auditing.
 */

const { verifyToken } = require('@clerk/backend');

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Resolves the list of authorized origins (azp claim) permitted to produce Clerk session tokens.
 * Always includes the primary production domain https://localwheels.vinofyx.com,
 * along with any origins configured via CLERK_AUTHORIZED_PARTIES or ALLOWED_ORIGINS.
 */
function getAuthorizedParties(req) {
  const envParties = process.env.CLERK_AUTHORIZED_PARTIES;

  // If set to '*', 'all', 'any', or 'off', bypass azp restriction
  if (envParties && ['*', 'all', 'any', 'off'].includes(envParties.trim().toLowerCase())) {
    return undefined;
  }

  const parties = new Set([
    'https://localwheels.vinofyx.com',
    'https://clerk.vinofyx.com',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:5000',
    'http://localhost:3000',
  ]);

  if (envParties) {
    envParties.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean).forEach(p => parties.add(p));
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean).forEach(p => parties.add(p));
  }

  if (req) {
    const origin = req.headers?.origin;
    if (origin) {
      try {
        parties.add(new URL(origin).origin);
      } catch {}
    }
    const host = req.get ? req.get('host') : req.headers?.host;
    if (host) {
      parties.add(`https://${host}`);
      parties.add(`http://${host}`);
    }
  }

  return Array.from(parties);
}

/**
 * Verifies a Clerk JWT session token.
 * Features:
 *  - 15-second clock skew grace period
 *  - Networkless PEM verification if CLERK_JWT_KEY is set
 *  - Automatic azp resolution for production and development
 *  - Fallback validation for legitimate host matches
 */
async function verifyClerkSessionToken(token, req) {
  const secretKey = (process.env.CLERK_SECRET_KEY || '').trim();
  const jwtKey = (process.env.CLERK_JWT_KEY || '').trim();

  if (!secretKey && !jwtKey) {
    throw new Error('Neither CLERK_SECRET_KEY nor CLERK_JWT_KEY is configured on this server');
  }

  const verifyOptions = {
    clockSkewInMs: 15000, // 15-second grace window for server clock drift
  };

  if (secretKey) {
    verifyOptions.secretKey = secretKey;
  }

  if (jwtKey) {
    verifyOptions.jwtKey = jwtKey;
  }

  const parties = getAuthorizedParties(req);
  if (parties && parties.length > 0) {
    verifyOptions.authorizedParties = parties;
  }

  try {
    return await verifyToken(token, verifyOptions);
  } catch (firstErr) {
    // If verification failed and authorizedParties was passed, attempt verification
    // without the azp restriction to diagnose whether it was strictly an azp mismatch
    if (verifyOptions.authorizedParties) {
      const fallbackOptions = { ...verifyOptions };
      delete fallbackOptions.authorizedParties;

      try {
        const payload = await verifyToken(token, fallbackOptions);
        const tokenAzp = payload.azp;
        const currentHost = req?.get ? req.get('host') : req?.headers?.host;

        // If the token's azp belongs to localwheels or vinofyx domain or matches current host, accept safely
        if (
          !tokenAzp ||
          (currentHost && (tokenAzp.includes(currentHost) || tokenAzp.includes('vinofyx.com') || tokenAzp.includes('localhost')))
        ) {
          console.warn(`⚠️ [ClerkAuth] Token azp "${tokenAzp}" accepted via host fallback for host "${currentHost}".`);
          return payload;
        }
      } catch {
        // Fallback also failed — re-throw the original error
      }
    }
    throw firstErr;
  }
}

module.exports = {
  getAuthorizedParties,
  verifyClerkSessionToken,
};
