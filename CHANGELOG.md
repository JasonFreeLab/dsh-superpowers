# Changelog

## [0.2.0](https://github.com/JasonFreeLab/dsh-superpowers/compare/v0.1.3...v0.2.0) (2026-09-05)


### Features

* use AGENTS.md/CLAUDE.md guidance instead of dsh.md ([ca2458c](https://github.com/JasonFreeLab/dsh-superpowers/commit/ca2458c24119e1223c1b425be71fff8e802807f0))

## 0.1.0

- Initial release: port the 14 skills from obra/superpowers v6.3.0 to DSH.
- Registers a global-layer SkillProvider via `ctx.skills.registerProvider` (rank 550, overridable by project/user skills).
- 14 skills kept in original English (i18n), mapped onto the DSH toolset.
- Ships `scripts/verify.mjs` structural check + runtime smoke.
