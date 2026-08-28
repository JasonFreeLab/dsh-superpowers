# Changelog

## 0.1.0

- 首次发布：移植 obra/superpowers v6.3.0 的 14 个技能到 DSH。
- 通过 `ctx.skills.registerProvider` 注册全局层 SkillProvider（rank 550，项目/用户级技能可覆盖）。
- 14 个技能保持英文原文（国际化），并映射到 DSH 工具集。
- 附带 `scripts/verify.mjs` 结构校验 + 运行时冒烟。
