# Changelog

## [0.3.0](https://github.com/JasonFreeLab/dsh-superpowers/compare/v0.2.0...v0.3.0) (2026-10-04)


### Features

* **skill:** orchestrate diagnosing fan-outs with DSH workflow + schema ([a385157](https://github.com/JasonFreeLab/dsh-superpowers/commit/a3851574af4d093c189892359e574ad427e76a9b))
* **skills:** upgrade bundled skills to obra/superpowers v6.4.2 ([283e291](https://github.com/JasonFreeLab/dsh-superpowers/commit/283e291d82d06aa59fa278abd42e291d9c582554))


### Bug Fixes

* **docs:** correct DSH tool mapping for 0.2.0-rc.2 ([773370d](https://github.com/JasonFreeLab/dsh-superpowers/commit/773370dcccd3176b22942bb0be3eaecf69acbbe8))

## [0.2.0](https://github.com/JasonFreeLab/dsh-superpowers/compare/v0.1.3...v0.2.0) (2026-09-05)


### Features

* use AGENTS.md/CLAUDE.md guidance instead of dsh.md ([ca2458c](https://github.com/JasonFreeLab/dsh-superpowers/commit/ca2458c24119e1223c1b425be71fff8e802807f0))

## 0.1.0

- Initial release: port the 14 skills from obra/superpowers v6.3.0 to DSH.
- Registers a global-layer SkillProvider via `ctx.skills.registerProvider` (rank 550, overridable by project/user skills).
- 14 skills kept in original English (i18n), mapped onto the DSH toolset.
- Ships `scripts/verify.mjs` structural check + runtime smoke.
