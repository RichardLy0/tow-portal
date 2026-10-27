This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Every deployment requires these non-secret configuration values:

- `APP_ENV`: one of `development`, `staging`, or `production`.
- `PORTAL_ORIGIN`: this portal's exact absolute HTTPS origin (for example,
  `https://pricing.towdeputy.com`).
- `TOW_DEPUTY_ORIGIN`: Tow Deputy's exact absolute HTTPS origin (for example,
  `https://towdeputy.com`).

Both origins are required in every tier; there are no defaults and `NODE_ENV`
does not affect them. Each value must be the raw canonical HTTPS origin. The
application rejects, rather than normalizes, uppercase schemes or hostnames,
an explicit port (including `:443`), a trailing slash, path, query, fragment,
credentials, wildcard, or malformed URL. Explicitly configured HTTPS
`localhost`, IP-address, and trailing-dot hostname origins are deployment
trust decisions, not user-supplied redirects. Authentication callbacks are
always derived as the fixed `/auth/tow-deputy/callback` path from
`PORTAL_ORIGIN`, and admin mutations require an `Origin` that exactly matches
it.

For staging and production, use canonical trusted origins. Tow Deputy must set
`PRICING_PORTAL_ORIGIN` equal to this portal's `PORTAL_ORIGIN`. A stale tunnel
URL or a mismatch between the two deployments will cause callback or origin
validation to fail closed, so verify the pair before deploying.

Cookie and authorization settings remain host-only: authentication and state
cookies are `Secure`, `HttpOnly`, `SameSite=Lax`, and scoped to `/` without a
`Domain` attribute. Configuration validation failures fail closed; they do not
fall back to request headers or environment-specific defaults.

## Verification

This repository has no configured test runner or test script. Validate the
configured deployment values with the build, typecheck, and lint commands using
non-secret staging configuration.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
