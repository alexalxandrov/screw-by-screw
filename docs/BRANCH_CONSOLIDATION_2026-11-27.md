# Branch consolidation and cleanup readiness

**Snapshot:** 27 November 2026  
**Canonical branch:** `main`  
**Consolidation review branch:** `maintenance/consolidate-branches-2026-11-27`  
**Pre-change safety reference:** `backup/main-before-consolidation-2026-11-27`

## What this consolidation does

- Adds the semantic model-package comparison feature to the current viewer, including UI, independent package comparison logic, unit tests and a browser test.
- Keeps the current mainline implementation of IBM PC 5150 / Dell OptiPlex 5060 family packages; it does not replace newer package content with older branch snapshots.
- Preserves the history of all 22 divergent branch heads as additional parents of consolidation commit `4a0fa798e200300c5d3f670467bced1eef2368d0`. Once this review branch is merged, their commits and historical files remain reachable from `main`, even where an older version is no longer part of the current working tree.

## Preserved divergent branch heads

- `docs/refresh-v1-acceptance-status` — `7544d3b6a42d4001b43d8f9821fcf996bbafbb31`
- `feat/assembly-evidence-timeline` — `838cf0d84c4aa9a3fb784ac4087d182fc8dd7f84`
- `feat/claim-inspection-main` — `8ca2a27fdbed1d8bf83b5a12fb19284bbde242c8`
- `feat/component-relationship-inspector` — `fcae3d87ecd45ebbf760e1026348a6c635cf90f2`
- `feat/component-relationship-inspector-main` — `93c7a6d657808bfff25eac86e915ae9dde86f287`
- `feat/evidence-aware-search` — `15ae252be615767c4aee82375f79889573bda3f2`
- `feat/evidence-aware-search-main` — `33d62d7d6c51c101da1aa350ffa3ed92770704fd`
- `feat/gpu-running-physics-overlays` — `7485415561b98fb5527961084be96e41aa7a662f`
- `feat/local-learning-progress` — `844ebb5af35657e0b787f6b5a38ad092aedd0b91`
- `feat/model-measurement-tool` — `7828189e363c00f11a8d1952e093f41aa7c0e80e`
- `feat/model-package-comparison` — `d6405879d63d3f6d15657d9c00408c97c147ac27`
- `feat/offline-model-catalog` — `5310b96678103837349160191a9339b109d36105`
- `feat/optiplex-5060-tower-model` — `7408a152637961a61f851a2e68693ef367d20500`
- `feat/package-authored-animation-runtime` — `124a1314257c603159a2c1addfd9ee97034ff2d1`
- `feat/package-authored-animation-runtime-v2` — `93b76190a4e72c2cd78ba5a42b970690935d0ff3`
- `feat/release-readiness-ux` — `b741baf4d7acc47191752b6e173f541a8d672d56`
- `feat/semantic-inventory-export` — `4393837d85ac67fa60076d00d5f082e8d7d89ef1`
- `feat/source-backed-claim-inspection` — `4451523ec989a461fccedd8ced7076b23ec634cf`
- `feat/verified-fan-rotor-components` — `5d8ce54bdce498a923f252dc410a0bc5e5f7e1af`
- `feature/rtx3060-operating-simulation` — `71930db72b5554deb4762f063158b7b822116c38`
- `fix/preserve-user-interaction-during-bundle-load` — `92e9e74a35a257482093b2189d7b3a7670761582`
- `integration/optiplex-v03-json-envelope` — `11f7c43e3ed0052986b3348b9e976d24f1f959fb`

## Historic content intentionally not restored into the active tree

The following branch-only material is retained in Git history, rather than reintroduced as active application files, because a newer mainline replacement exists or the material is tied to an older model baseline:

- Dell OptiPlex 5060 MT v0.1 package and its dedicated blockout generator; the active tree now has the newer Tower-family v0.3 package and current validation pipeline.
- OptiPlex v0.1/v0.2 bundled package snapshots; v0.3 is the current package.
- Earlier standalone animation-controller implementation; the active viewer uses the later AnimationPlayer runtime.
- RTX 3060 operating-mode audit/test from the earlier GPU-default baseline; the GPU package is now retained as research material and is not the active catalogue default.

These are not deleted from Git object history by the consolidation commit.

## Cleanup gate

Do not delete old branch refs until:

1. This consolidation PR is merged into `main`.
2. All required GitHub Actions checks pass on the resulting `main` head.
3. A fresh branch inventory confirms every old branch tip is an ancestor of `main`.
4. The obsolete comparison PR #36 is closed as superseded by the consolidated implementation.

No branch refs are deleted by this change.

## Final state — merged and cleanup-ready

- Consolidation PR [#39](https://github.com/alexalxandrov/screw-by-screw/pull/39) was merged with a regular merge commit, not squash or rebase.
- Final merge commit on `main`: `3f97a936555dff88517f8b0e3f7e31b81e952e5d`.
- Superseded comparison PR [#36](https://github.com/alexalxandrov/screw-by-screw/pull/36) was closed.
- All 22 divergent branch tips listed above were re-compared against the merged `main`; each returned `ahead_by = 0` and `total_commits = 0`. Every unique branch tip is now an ancestor of `main`.
- The remaining old refs were already ancestors of the pre-consolidation `main`. The temporary safety branch `backup/main-before-consolidation-2026-11-27` points to the old main commit, and `maintenance/consolidate-branches-2026-11-27` points to the merged PR head; both are ancestors of the new `main`.

**Cleanup status:** 44 branches are currently present, including `main`. All 43 non-`main` refs (the 41 pre-existing refs plus the temporary backup and maintenance refs created for this consolidation) are safe to delete from a history-preservation standpoint. No branch refs have been deleted in this operation. Once the refs are deleted, keep `main` as the only branch; tags and the commit graph remain separate from branch refs.
