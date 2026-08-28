# Changelog

## 0.1.0

- Initial release: port the 14 skills from obra/superpowers v6.3.0 to DSH.
- Registers a global-layer SkillProvider via `ctx.skills.registerProvider` (rank 550, overridable by project/user skills).
- 14 skills kept in original English (i18n), mapped onto the DSH toolset.
- Ships `scripts/verify.mjs` structural check + runtime smoke.
