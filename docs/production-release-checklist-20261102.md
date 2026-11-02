# TeHiceEsto — Production release checklist (2026-11-02)

## Release target
- Source repository: `ProtectorRudo/Tehiceesto`, branch `main`
- Vercel project: `prj_1VcOY4n08AEPMH9ltaRLBRJZstKt` (`tehiceesto`)
- Vercel team: `team_CE76WzHKVPy9e28LXIw2r3J4`
- The approved improvements include PR #30 (Dragon Ball and Sticker Bomb previews), PR #31 (commercial prices ARS 25,000 and operations), PR #32 (native email retry), and PR #33 (browser QA for saved text, images and WhatsApp OPUS audio).

## Release safeguards
1. Check `main` commit and required GitHub Actions jobs before release.
2. Prefer a single GitHub `main` release after validation. **Do not repeatedly create Vercel deployments** when Hobby's daily quota is exhausted.
3. Verify that the Vercel production deployment is `READY` and that `/api/version` reports the exact released Git SHA.
4. Verify the two-field checkout, `/mis-regalos`, Dragon Ball and Sticker Bomb experiences and the recipient gift route. Compare the frontend ARS 25,000 base price and ARS 10,000 optional add-on with the backend's authoritative amounts.
5. Test adding a photo and WhatsApp audio on a **test purchase** from a physical phone, closing the editor and reopening to confirm persistence and recipient appearance.
6. Check runtime errors and mobile layout. Passing a build alone is not sufficient for completion.
7. Preserve existing orders, affiliate records, gifts and paid links.

## Important domain distinction
- The canonical `tehiceesto.com` and `www.tehiceesto.com` are currently assigned to the **legacy Vercel Viralio project**, not the standalone `tehiceesto` project.
- Do **not** move domains or aliases as a workaround for the deployment quota. Migrating the domain requires a separate verification plan protecting historical gifts and existing checkout.
- A GitHub/CI success does not itself prove that Vercel accepted a production deploy. Explicitly confirm production `READY` and the commit SHA.

## Current restriction
Vercel Hobby API can report `402 api-deployments-free-per-day`. Historically the GitHub integration did publish after manual API failures, but this is not a guaranteed quota bypass.
