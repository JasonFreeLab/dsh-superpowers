# Final Review and Finish

Part of superpower-subagent-driven-development. Every task in the plan is
complete.

The final whole-branch review gets a package too: run the inline
review-package helper from [SKILL.md](../SKILL.md) with
`MERGE_BASE..HEAD`, from the working tree you're executing in (MERGE_BASE =
the commit the branch started from, e.g. `git merge-base main HEAD`) and
include the printed path in the final review dispatch, so the final reviewer
reads one file instead of re-deriving the branch diff with git commands. That
helper refuses an empty or non-descendant range (exit 3), so a wrong-branch
HEAD cannot produce a clean review of nothing. Dispatch on the most capable
available model (see [SKILL.md](../SKILL.md)'s Model Selection), using
superpower-requesting-code-review's
[code-reviewer.md](../../superpower-requesting-code-review/code-reviewer.md)
(load that skill with the `skill` tool to get the template). Point it at
the ledger's deferred-minor and parked lines so it can triage which must be
fixed before merge.

If the final whole-branch review returns findings, dispatch ONE fix subagent
with the complete findings list — not one fixer per finding.
Per-finding fixers each rebuild context and re-run suites; a real
session's final-review fix wave cost more than all its tasks combined.
Then run exactly one scoped re-review of the fix wave (the inline
review-package helper over the fix range, `FIX_BASE..HEAD`, from the working
tree you're executing in,
[re-review-prompt.md](../re-review-prompt.md)).
Adjudicate any residual findings as in the fix loop's breaker
([fix-loop.md](fix-loop.md)): park with rulings, or rule on the load-bearing
ones and ledger what you decided. Only the four things that stop a running
plan (top of [SKILL.md](../SKILL.md)) stop you here. There is no second fix
wave — residual load-bearing findings surface to your human partner when
superpower-finishing-a-development-branch presents the options.

### Finish

Before you delete anything, collect every ledger line containing `Ruling:` —
preflight rulings, parked findings, breaker adjudications, all of them — into
your final message under "Rulings I made", in the order you made them, each
with what it costs if wrong. The list is exhaustive: if the ledger holds a
ruling, the list holds it. That list is the only place the decisions you
took on your human partner's behalf reach them — they read it and rework
whatever you got wrong. A ruling that dies with the workspace was a decision
made in secret.

When the final whole-branch review is clean and its fixes are merged,
delete this plan's workspace (`rm -rf <workspace>`) — the git history is
the record now. Sibling directories belong to other plans; leave them
alone.

Use superpower-finishing-a-development-branch (load it via the `skill` tool).
