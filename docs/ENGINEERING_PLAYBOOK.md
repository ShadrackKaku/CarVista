# CarVista Engineering Playbook

> How we build CarVista. This is the operating agreement between the **Founder**
> (product owner) and the **AI engineering partner** (developer). It exists so
> that a solo founder working with an AI can ship a money- and identity-handling
> platform **safely** — the safety comes from process and discipline, not from a
> second person in the room.
>
> This is a living document. It evolves as we learn.

---

## 1. Roles

**Founder — product owner.** Sets priorities, makes product and business
decisions, reviews changes, learns to read the code, owns the vision. Does not
need to write code, but should understand and question what ships.

**AI engineering partner — developer.** Designs, builds, tests, and **explains**
every change in plain English. Guards security and quality. Flags risks and
trade-offs. Never ships money- or identity-related code without walking the
founder through it first.

---

## 2. How we ship — the workflow

Safety lives in this loop. We do not skip steps.

1. **One change at a time**, on its own branch with a descriptive name.
2. **Pull request to `main`** — never commit directly to `main`.
3. **CI must be green**: typecheck, lint, build.
4. **Preview deploy reviewed** — the founder sees the change live before it merges.
5. **Plain-English PR summary**: what changed, why, what could break, how to test it.
6. **Merge only when** CI is green **and** the founder is comfortable.
7. `main` stays deployable at all times.

---

## 3. Standing security & quality guarantees

Applied to **every** change. This is our answer to "eliminate insecurities and
bugs" — realistically: catch them early, on a preview, before they ever reach a
real customer or real money.

- **Validate all input** at the boundary (Zod schemas on every endpoint).
- **Never trust the client.** Recompute prices, amounts, and permissions on the
  server. The browser is an untrusted source.
- **Authorization on every mutating action.** Check the user is allowed to do
  this. Fail **closed** (deny by default).
- **Idempotent payments & fulfilment.** A payment path must be safe to run twice
  without double-charging or double-granting. Verify webhook signatures.
- **Secrets never in the repo.** Only in environment variables / the host
  dashboard. If a secret is ever exposed, **rotate it immediately**.
- **Rate-limit** sensitive and abusable endpoints.
- **Parameterised database access** via Prisma — no string-built SQL with user
  input.
- **Least privilege & minimal exposure.** Return only the data a screen needs.
- **Test money and identity flows** before merge; run a **security review** on
  sensitive changes.
- **Graceful degradation** and **error monitoring** in production.

> **Honest caveat:** no one — human or AI — can promise *zero* bugs. This process
> makes bugs **cheap and early** instead of expensive and public.

---

## 4. Definition of done

A change is done when:

- [ ] Typecheck, lint, and build are green.
- [ ] The feature was verified on the preview deploy.
- [ ] The PR explains what/why/risks/how-to-test in plain English.
- [ ] No secrets are in the diff.
- [ ] The security checklist (section 3) was considered for anything touching
      money, identity, auth, or data.

---

## 5. The learning path (for the founder)

The goal: the founder can **detect and explain** what is happening in the code
at any time.

- Every change is explained in plain English. **"Explain this like I'm not an
  engineer"** is always a valid request.
- Read-the-diff coaching: how to read a PR and understand what changed.
- "How it works" walkthroughs of the key systems — **auth, payments, the data
  model** — on request.
- A short, growing list of red flags to watch for (below).

---

## 6. Red flags the founder can learn to spot

If you see any of these in a change, stop and ask about it:

- A **price or amount that comes from the browser** and is not re-checked on the
  server.
- A **new endpoint with no authentication / authorization** check.
- **Secrets or API keys** appearing in a diff or a committed file.
- A **payment path that could run twice** (no idempotency guard).
- A **database migration that drops or renames columns** without a stated plan.
- A **"just trust me" change** with no explanation and no test.

---

## 7. Rules of engagement — getting the best out of the partner

- Give the **problem or goal**, not the solution — let the partner propose the
  approach and the trade-offs.
- Ask for a **plan before anything big**.
- Ask for the **security and risk implications** of any change.
- Surface **product-gut concerns early** — founder judgment catches what the
  code cannot see.
- Use the partner for **reviews** — a security review can be run on any change.

---

## 8. Incident basics

- If something is wrong in production: **revert first** (safe), diagnose second.
- Keep `main` deployable. A green `main` is a promise, not a preference.
- After an incident, write down what happened and the one change that prevents a
  repeat.

---

_CarVista Engineering Playbook · v1 · a living document._
