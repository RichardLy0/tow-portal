import 'server-only';

const DEPLOYMENT_TIERS = ['development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof DEPLOYMENT_TIERS)[number];

export function getAppEnvironment(): AppEnvironment {
  const appEnvironment = process.env.APP_ENV;
  if (!appEnvironment || !DEPLOYMENT_TIERS.includes(appEnvironment as AppEnvironment)) {
    throw new Error('APP_ENV must be one of: development, staging, production.');
  }
  return appEnvironment as AppEnvironment;
}

function validatedHttpsOrigin(value: string | undefined, name: string): string {
  if (!value || value.length > 255) throw new Error(`${name} is not configured.`);

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.hostname.includes('*') ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error(`${name} must be an exact HTTPS origin.`);
  }
}

/** Every deployment must explicitly supply the complete, trusted origin pair. */
function getOrigins(): { portalOrigin: string; towDeputyOrigin: string } {
  getAppEnvironment();
  return {
    portalOrigin: validatedHttpsOrigin(process.env.PORTAL_ORIGIN, 'PORTAL_ORIGIN'),
    towDeputyOrigin: validatedHttpsOrigin(process.env.TOW_DEPUTY_ORIGIN, 'TOW_DEPUTY_ORIGIN'),
  };
}

export function getPortalOrigin(): string {
  return getOrigins().portalOrigin;
}

export function getTowDeputyOrigin(): string {
  return getOrigins().towDeputyOrigin;
}
