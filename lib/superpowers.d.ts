/**
 * dsh-superpowers — obra/superpowers 的 DSH 移植。
 *
 * 把 obra/superpowers 的 14 个技能以 DSH 原生 SkillProvider 形式暴露：
 * 通过 `ctx.skills.registerProvider` 注册到全局层。rank 取 550，使
 * filesystem 提供商（项目 100–300 / 用户 400–500）提供的同名技能可以覆盖
 * 本包内置技能，而本包又优先于其它打包提供商（BUNDLED_SKILL_RANK = 600）。
 *
 * 内容源：skills/ 目录下的每个 <name>/SKILL.md，frontmatter 解析 name、
 * description 与调用策略；正文按需惰性加载。
 */
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const Config: Schema<Schemastery.ObjectS<{
    /** 注册到 ctx.skills 的 provider 名称，默认 superpowers；不可为保留名 runtime */
    providerName: Schema<string, string>;
    /** skill 目录绝对路径；缺省取包内 skills/，便于本地调试指向其它目录 */
    skillDir: Schema<string, string>;
}>, Schemastery.ObjectT<{
    /** 注册到 ctx.skills 的 provider 名称，默认 superpowers；不可为保留名 runtime */
    providerName: Schema<string, string>;
    /** skill 目录绝对路径；缺省取包内 skills/，便于本地调试指向其它目录 */
    skillDir: Schema<string, string>;
}>>;
export interface Config {
    providerName: string;
    skillDir?: string;
}
export declare const name = "superpowers";
export declare const inject: readonly ["skills"];
export declare function apply(ctx: Context, config: Config): void;
declare const _default: {
    name: string;
    inject: readonly ["skills"];
    Config: Schema<Schemastery.ObjectS<{
        /** 注册到 ctx.skills 的 provider 名称，默认 superpowers；不可为保留名 runtime */
        providerName: Schema<string, string>;
        /** skill 目录绝对路径；缺省取包内 skills/，便于本地调试指向其它目录 */
        skillDir: Schema<string, string>;
    }>, Schemastery.ObjectT<{
        /** 注册到 ctx.skills 的 provider 名称，默认 superpowers；不可为保留名 runtime */
        providerName: Schema<string, string>;
        /** skill 目录绝对路径；缺省取包内 skills/，便于本地调试指向其它目录 */
        skillDir: Schema<string, string>;
    }>>;
    apply: typeof apply;
};
export default _default;
