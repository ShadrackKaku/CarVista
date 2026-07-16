# Security Policy

CarVista handles payments and personal identity data, so security is treated as
part of the product, not an afterthought. This document summarises our practices
and how to report a problem. It complements the
[Engineering Playbook](docs/ENGINEERING_PLAYBOOK.md).

## Practices

- **Payments** run through Paystack and Mobile Money — CarVista does not store
  raw card data. Payment confirmation is idempotent and webhook signatures are
  verified.
- **Authentication & authorization** use hashed passwords (bcrypt) and
  role-based access control. Mutating actions are authorized server-side and fail
  closed.
- **Input validation** with Zod on API endpoints; the client is never trusted for
  prices, amounts, or permissions (recomputed server-side).
- **Secrets** live only in environment variables / the host dashboard — never in
  the repository. Any exposed secret is rotated immediately.
- **Database** access is parameterised through Prisma. Sensitive endpoints are
  rate-limited.
- **Data protection**: we aim to collect the minimum data necessary and to align
  with Ghana's Data Protection Act as the platform grows.

## Supported versions

The application is deployed continuously from `main`; the live deployment is the
supported version.

## Reporting a vulnerability

If you believe you have found a security vulnerability, please report it
privately rather than opening a public issue.

- Email: **security@carvista.com.gh** (or the current support address)
- Please include steps to reproduce and the potential impact.
- We will acknowledge the report and work with you on a fix before any public
  disclosure.

Please act in good faith, avoid privacy violations and service disruption, and
give us reasonable time to respond before disclosing publicly.
