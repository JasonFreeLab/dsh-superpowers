---
name: superpower-subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching a fresh implementer subagent per task, a task review (spec compliance + code quality) after each, and a broad whole-branch review at the end.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + task review (spec + quality) + broad final review = high quality, fast iteration

**Narration:** between tool calls, narrate at most one short line — the
ledger and the tool results carry the record.

**Continuous execution:** Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are the four named below, or all tasks complete. "Should I continue?" prompts and progress summaries waste their time — they asked you to execute the plan, so execute it.

**Rulings, not stalls.** A running plan does not wait on a human. Conflicts,
ambiguities, plan defects, a cap you would have asked to exceed — decide
them. The spec is the binding authority, the plan is its argument, and your
judgment settles what neither answers. Record every decision in the ledger as
`Ruling: <what you decided> — <why> — <what it costs if wrong>`, and keep
going. A wrong ruling costs rework your human partner can see and undo; a
session parked on a question costs their whole day and buys nothing.

Four things stop you, and only these: an irreversible or destructive
operation; a security-sensitive action; a side effect outside this worktree
that norms say you ask about first (a merge, a push to a shared branch, a
publish); and a plan so broken that every path forward is a guess. For those,
stop and ask.

## When to Use

```dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Partner chose inline, or no subagent tool?" [shape=diamond];
    "superpower-subagent-driven-development" [shape=box];
    "superpower-executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Partner chose inline, or no subagent tool?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Partner chose inline, or no subagent tool?" -> "superpower-executing-plans" [label="yes"];
    "Partner chose inline, or no subagent tool?" -> "superpower-subagent-driven-development" [label="no"];
}
```

**vs. Executing Plans (inline) — superpower-executing-plans:**
- Fresh subagent per task (no context pollution) instead of one context doing every task
- Review after each task (spec compliance + code quality) instead of only at the end
- Costs a fresh context per task and per review; inline costs one context plus one final reviewer
- Both run in this session, share the same plan workspace and ledger, and never pause between tasks

## The Process

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer asks questions?" [shape=diamond];
        "Answer questions, provide context" [shape=box];
        "Implementer implements, tests, commits, self-reviews" [shape=box];
        "Generate review package, dispatch task reviewer (./task-reviewer-prompt.md)" [shape=box];
        "Spec ✅ and quality approved?" [shape=diamond];
        "Fix loop: read references/fix-loop.md before every round" [shape=box];
        "Append completion to ledger, mark todo complete" [shape=box];
    }

    "Setup: worktree, ledger check, read plan, pre-flight review" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Final review and finish: read references/final-review.md" [shape=box];
    "Final review clean: delete this plan's workspace" [shape=box];
    "Use superpower-finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Setup: worktree, ledger check, read plan, pre-flight review" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer asks questions?";
    "Implementer asks questions?" -> "Answer questions, provide context" [label="yes"];
    "Answer questions, provide context" -> "Implementer implements, tests, commits, self-reviews";
    "Implementer asks questions?" -> "Implementer implements, tests, commits, self-reviews" [label="no"];
    "Implementer implements, tests, commits, self-reviews" -> "Generate review package, dispatch task reviewer (./task-reviewer-prompt.md)";
    "Generate review package, dispatch task reviewer (./task-reviewer-prompt.md)" -> "Spec ✅ and quality approved?";
    "Spec ✅ and quality approved?" -> "Append completion to ledger, mark todo complete" [label="yes"];
    "Spec ✅ and quality approved?" -> "Fix loop: read references/fix-loop.md before every round" [label="no"];
    "Fix loop: read references/fix-loop.md before every round" -> "Append completion to ledger, mark todo complete" [label="addressed, or parked at the cap"];
    "Append completion to ledger, mark todo complete" -> "More tasks remain?";
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Final review and finish: read references/final-review.md" [label="no"];
    "Final review and finish: read references/final-review.md" -> "Final review clean: delete this plan's workspace";
    "Final review clean: delete this plan's workspace" -> "Use superpower-finishing-a-development-branch";
}
```

## Setup

Ensure the work happens in an isolated workspace: use
superpower-using-git-worktrees (load it via the `skill` tool) to create one
or verify the existing one. Never start implementation on a main/master
branch without your human partner's explicit consent.

Conversation memory does not survive compaction. In real sessions,
controllers that lost their place have re-dispatched entire completed task
sequences — the single most expensive failure observed. Track progress in
a ledger file, not only in todos.

This port bundles no `scripts/` directory: the upstream helpers
(`scripts/sdd-repo`, `scripts/sdd-workspace`, `scripts/task-brief`, and
`scripts/review-package`) are inlined below. Every helper starts by
resolving the repository the same way: run it **from inside the git working
tree you are executing in**, and never let the plan path pick the
repository. An executor in a linked worktree commonly holds an absolute
path to the plan in the main checkout, and its workspace and commits belong
to the worktree it is working in; guessing a repository from the plan would
silently act on the wrong checkout. The inline form of the
`--with-commit` resolution, which every helper below opens with, is:

```bash
root=$(git rev-parse --show-toplevel) || { echo "SDD helpers must run from inside the git working tree you're executing in" >&2; exit 2; }
git -C "$root" rev-parse --verify --quiet HEAD >/dev/null || { echo "SDD helpers need at least one commit in $root" >&2; exit 2; }
```

**Workspace helper** (upstream `scripts/sdd-workspace`): run this by
`bash` from the working tree you are executing in. It prints the plan's
git-ignored directory under `<repo-root>/.superpowers/sdd/`, home to every
artifact for THIS plan: ledger, briefs, reports, review packages.

```bash
# workspace: plan=PLAN_FILE; capture stdout as this plan's workspace directory.
root=$(git rev-parse --show-toplevel) || { echo "SDD helpers must run from inside the git working tree you're executing in" >&2; exit 2; }
git -C "$root" rev-parse --verify --quiet HEAD >/dev/null || { echo "SDD helpers need at least one commit in $root" >&2; exit 2; }
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }
slug=$(basename "$plan" .md)
[ -n "$slug" ] && [ "$slug" != "." ] && [ "$slug" != ".." ] \
  || { echo "cannot derive a workspace name from: $plan" >&2; exit 2; }
base="$root/.superpowers/sdd"
plan_dir=$(CDPATH='' cd -- "$(dirname "$plan")" && pwd -P)
plan_abs="$plan_dir/$(basename "$plan")"
case "$plan_abs" in "$root"/*) plan_id=${plan_abs#"$root"/} ;; *) plan_id=$plan_abs ;; esac
owns() { # $1 = candidate dir; a plan-path marker settles ownership
  if [ -e "$1/plan-path" ]; then [ "$(cat "$1/plan-path")" = "$plan_id" ]
  else mkdir -p "$1"; printf '%s\n' "$plan_id" > "$1/plan-path"; fi
}
dir="$base/$slug"
if ! owns "$dir"; then
  parent=$(basename "$plan_dir"); dir="$base/$slug-$parent"
  if ! owns "$dir"; then
    n=2
    while ! owns "$base/$slug-$parent-$n"; do n=$((n + 1)); done
    dir="$base/$slug-$parent-$n"
  fi
fi
[ -e "$base/.gitignore" ] || printf '*\n' > "$base/.gitignore"
printf '%s\n' "$dir"
```

This mirrors upstream's collision rule: two plans whose filenames match
(`docs/alpha/plan.md` vs `docs/beta/plan.md`) get separate directories,
each recording its owning plan in a `plan-path` marker. A workspace with
no marker predates the marker scheme and is adopted by the first plan to
claim it, so in-flight workspaces keep resolving. The `.gitignore` is
created only when absent: a repo may commit its own ignore file here, and
overwriting it would revert that on every run. Another plan's directory is
never yours to read or write.

- Check for this plan's ledger at `<workspace>/progress.md`. If one exists,
  read [references/resuming.md](references/resuming.md) before anything
  else: it says whose ledger it is and where to resume.
- Create the ledger with its identity as the first line:
  `# SDD ledger — plan: <plan file path>`.
- The ledger is your recovery map: the commits it names exist in git even
  when your context no longer remembers creating them. After compaction,
  trust the ledger and `git log` over your own recollection.
- `git clean -fdx` will destroy the workspace (it's git-ignored scratch); if
  that happens, recover from `git log`.

Read the plan once, note its context and Global Constraints, and create a
todo per task (via `todo_write`, sending the entire list every call). If the
plan names a Spec, read that too: the spec is the authority the plan argues
from, and conflicts inside the plan resolve against it. A plan with no
reachable spec gets a ledger note saying so — rulings made without one are
provisional.

Before dispatching Task 1, read [references/preflight.md](references/preflight.md)
and run the conflict scan it describes. Its table and rulings go in the
ledger.

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

**Architecture and design tasks**: use the most capable available model.
The final whole-branch review is one of these — dispatch it on the most
capable available model, not the session default.

**Review tasks**: choose the model with the same judgment, scaled to the
diff's size, complexity, and risk. A small mechanical diff does not need the
most capable model; a subtle concurrency change does. Scoped re-reviews of
small fix diffs take a cheap-to-mid tier.

**Fix-loop escalation (rounds 4-5)**: use a model at least one tier above
the implementer that got stuck.

**Always specify the model explicitly when dispatching a subagent.** An
omitted model inherits your session's model — often the most capable and
most expensive — which silently defeats this section. In DSH, child model
selection is opt-in: the `modelSelection` and `modelDiscovery` options
default to `false`, so `subagent` and `subagent_fork` expose no
`provider`/`model` arguments until the host enables them. When enabled,
discover routes with `list_subagent_models`, then pass `provider` + `model`
(and optionally `reasoning_effort`); an effort-only override is rejected —
`provider` and `model` must be supplied together. The `workflow` tool's
`agent()` also accepts `provider`/`model` overrides. Where none of that is
available, pin the tier through session or profile configuration and keep
the role tiering above; for escalation rounds, re-dispatch on a stronger
tier once it is configured.

**Turn count beats token price.** Wall-clock and context cost scale with how
many turns a subagent takes, and the cheapest models routinely take 2-3× the
turns on multi-step work — costing more overall. Use a mid-tier model as the
floor for reviewers and for implementers working from prose descriptions.
When the task's plan text contains the complete code to write, the
implementation is transcription plus testing: use the cheapest tier for
that implementer. Single-file mechanical fixes also take the cheapest tier.

**Task complexity signals (implementation tasks):**
- Touches 1-2 files with a complete spec → cheap model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

## The Task Loop

**Small same-shape work:** when the plan lists several small edits of the
same kind across files, read [references/batching.md](references/batching.md)
before dispatching them.

Everything you paste into a dispatch prompt — and everything a subagent
prints back — stays resident in your context for the rest of the session
and is re-read on every later turn. Hand artifacts over as files.

**Waiting on dispatched subagents:** never poll a wait interface with
short timeouts, and never sit in one silent, open-ended wait either.
While you have local work — ledger updates, packaging the next review,
reading reports — keep working; child results arrive on their own.
When you are genuinely idle, wait in bounded stretches (five to ten
minutes, where your platform allows), and between stretches post one
line of status and reconcile your live children: list them, and chase
any that finished without reporting. A bounded stretch keeps nearly
all of a long wait's efficiency while guaranteeing a stuck or lost
child is noticed within minutes, not at the end of the session. (DSH:
`subagent` runs in the background by default and you are notified when a
run settles; reconcile live children with `list_agents`, which returns
`{ name, status, description? }`. Never poll with short timeouts.)

**DSH dispatch contract.** `subagent` and `subagent_fork` accept an optional
`name`; the dispatch result reads `started subagent <name>` (or the
activation object `{ kind: 'activation', name }`). Record that NAME for the
implementer — fix-loop rounds 1-3 resume it with
`send_message({ agent: "<name>", message })`. Address subagents by name
everywhere: `agent_id` fails validation. `interrupt_agent({ agent })`
exists, but the standard Web `standard`, `cordis`, and `ptc` presets
disable it (`config.interrupt: false`), so do not promise interruption
unless the profile restores it; message the agent or wait for it to settle.
Ordinary session forks are independent: they do not carry
`parentSession` and are not subagents (identify subagent sessions by
`origin === 'subagent'`). That only matters here if you are resuming or
forking, not for the normal dispatch loop.

**Inline task-brief and review-package helpers** (upstream
`scripts/task-brief` and `scripts/review-package`): both write to this
plan's workspace, and both run from inside the working tree you are
executing in, with `workspace` set from Setup.

Task brief — extract one task's full text into a file the implementer reads
in one call, so the task text never has to pass through your context. The
awk compares task IDs whole (`3`, `6b`, `A1`, `2.1`; never a regex), keeps
deeper sub-tasks in their parent's brief (`### Task 7` keeps
`#### Task 7a`), refuses (exit 4) when an unclosed code fence hides the
requested task rather than letting the brief run on through later tasks,
and prints the translated-heading hint when the plan has no English "Task"
headings:

```bash
# task-brief: plan=PLAN_FILE; n=TASK_NUMBER; workspace=<from Setup>
root=$(git rev-parse --show-toplevel) || { echo "SDD helpers must run from inside the git working tree you're executing in" >&2; exit 2; }
git -C "$root" rev-parse --verify --quiet HEAD >/dev/null || { echo "SDD helpers need at least one commit in $root" >&2; exit 2; }
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }
[ -n "${workspace:-}" ] && [ -d "$workspace" ] || { echo "workspace must be this plan's workspace directory (see Setup)" >&2; exit 2; }
out="$workspace/task-${n}-brief.md"
rc=0
TASK_BRIEF_PLAN="$plan" awk -v n="$n" '
  /^```/ { infence = !infence; if (infence) { fence_line = NR; hidden = 0 } }
  infence && /^#+[ \t]+Task[ \t]/ { hidden = 1 }
  !infence && /^#+[ \t]+Task[ \t]/ {
    id = $0
    sub(/^#+[ \t]+Task[ \t]+/, "", id)
    if (match(id, /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*/) && substr(id, 1, RLENGTH) ~ /[0-9]/) {
      tasks++
      id = substr(id, 1, RLENGTH)
      match($0, /^#+/)
      subtask = intask && RLENGTH > level && substr(id, 1, length(n)) == n \
        && substr(id, length(n) + 1, 1) ~ /[A-Za-z.]/
      if (!subtask) {
        intask = (id == n)
        level = RLENGTH
      }
    }
  }
  !infence && /^#+[ \t]+[^ \t]+[ \t]+[A-Za-z0-9.]*[0-9]/ && shaped < 5 { shaped_heading[++shaped] = $0 }
  intask { print; found = 1 }
  END {
    where = "the code fence opened at line " fence_line " of " ENVIRON["TASK_BRIEF_PLAN"] " never closes"
    if (infence && hidden && (intask || !found)) {
      print "task-brief: " where ", so no Task heading after it can be seen; close that fence in the plan and rerun" | "cat >&2"
      if (intask) exit 4
    } else if (infence && intask) {
      print "task-brief: warning: " where "; it hides no Task heading, so this brief is complete" | "cat >&2"
    }
    # An open fence that hid Task headings already explains why none were
    # seen; the English-word hint would contradict it.
    if (!tasks && shaped && !(infence && hidden)) {
      print "task-brief: no task headings found. Task headings must use the English word \"Task\" (\"### Task 1: ...\"), even when the rest of the plan is in another language. Headings shaped like tasks:" | "cat >&2"
      for (i = 1; i <= shaped; i++) print "  " shaped_heading[i] | "cat >&2"
    }
  }
' "$plan" > "$out" || rc=$?
if [ "$rc" -ne 0 ]; then
  rm -f "$out"
  exit "$rc"
fi
if [ ! -s "$out" ]; then
  rm -f "$out"
  echo "task ${n} not found in ${plan} (no heading matching 'Task ${n}')" >&2
  exit 3
fi
echo "wrote ${out}: $(wc -l < "$out" | tr -d ' ') lines"
```

Review package — write the commit list, stat summary, and the net diff with
extended context to one file the reviewer reads in a single call. Using the
recorded per-task BASE (not `HEAD~1`) keeps multi-commit tasks intact. The
output never enters your own context. The range guards reject an empty or
non-descendant `BASE..HEAD` (exit 3), so an implementer that committed to
the wrong branch cannot produce a "clean" review of nothing. Every git
command runs as `git -C "$repo"`, against the working tree the helper
resolved:

```bash
# review-package: plan=PLAN_FILE; base=BASE; head=HEAD; workspace=<from Setup>
repo=$(git rev-parse --show-toplevel) || { echo "SDD helpers must run from inside the git working tree you're executing in" >&2; exit 2; }
git -C "$repo" rev-parse --verify --quiet HEAD >/dev/null || { echo "SDD helpers need at least one commit in $repo" >&2; exit 2; }
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }
[ -n "${workspace:-}" ] && [ -d "$workspace" ] || { echo "workspace must be this plan's workspace directory (see Setup)" >&2; exit 2; }
git -C "$repo" rev-parse --verify --quiet "$base" >/dev/null || { echo "bad BASE: $base" >&2; exit 2; }
git -C "$repo" rev-parse --verify --quiet "$head" >/dev/null || { echo "bad HEAD: $head" >&2; exit 2; }
git -C "$repo" merge-base --is-ancestor "$base" "$head" || { echo "HEAD is not a descendant of BASE: ${base}..${head}" >&2; exit 3; }
[ "$(git -C "$repo" rev-list --count "${base}..${head}")" -gt 0 ] || { echo "empty commit range: ${base}..${head}" >&2; exit 3; }
out="$workspace/review-$(git -C "$repo" rev-parse --short "$base")..$(git -C "$repo" rev-parse --short "$head").diff"
{ echo "# Review package: ${base}..${head}"; echo
  echo "## Commits"; git -C "$repo" log --oneline "${base}..${head}"; echo
  echo "## Files changed"; git -C "$repo" diff --stat "${base}..${head}"; echo
  echo "## Diff"; git -C "$repo" diff -U10 "${base}..${head}"; } > "$out"
echo "wrote ${out}: $(git -C "$repo" rev-list --count "${base}..${head}") commit(s), $(wc -c < "$out" | tr -d ' ') bytes"
```

A failed or empty brief is deleted rather than left behind: a later reader
must never mistake a partial file for requirements, or an empty one for a
task with no text. Likewise, a review package that fails a range guard is
never written, so it is never dispatched.

### 1. Dispatch the implementer

Record BASE (`git rev-parse HEAD`) before dispatching — the review package
and fix-round diffs need it.

- **Task brief:** before dispatching an implementer, run the inline
  task-brief helper above with `PLAN_FILE` and the task number — it
  extracts the task's full text to a uniquely named file and prints the
  path. Compose the dispatch so the brief stays the single source of
  requirements. Your dispatch should contain: (1) one line on where this
  task fits in the project; (2) the brief path, introduced as "read this
  first — it is your requirements, with the exact values to use verbatim";
  (3) interfaces and decisions from earlier tasks that the brief cannot
  know; (4) your resolution of any ambiguity you noticed in the brief;
  (5) the report-file path and report contract. Exact values (numbers,
  magic strings, signatures, test cases) appear only in the brief. Never
  make a subagent read the whole plan file.
- **Report file:** name the implementer's report file after the brief
  (brief `…/task-N-brief.md` → report `…/task-N-report.md`) and put it in
  the dispatch prompt. The implementer writes the full report there and
  returns only status, commits, a one-line test summary, and concerns.
- A dispatch prompt describes one task, not the session's history. Do not
  paste accumulated prior-task summaries ("state after Tasks 1-3") into
  later dispatches — a real session's dispatch hit 42k chars of which 99%
  was pasted history. A fresh subagent needs its task, the interfaces it
  touches, and the global constraints. Nothing else.
- The dispatch carries the no-subagents contract (it is in the
  implementer template): the implementer never dispatches subagents —
  not helpers, and never a reviewer. Review arrives from you, after the
  report. In real sessions, every reviewer a worker spawned duplicated
  the task review the controller dispatched anyway — a full extra
  review seat per task.
- If an earlier task parked a finding in the area this task touches, carry
  a pointer to that ledger entry in the dispatch.
- Record the implementer's agent NAME from the dispatch result
  (`subagent`/`subagent_fork` accept an optional `name` and return
  `started subagent <name>`, or `{ kind: 'activation', name }`) — fix-loop
  rounds 1-3 resume this agent with
  `send_message({ agent: "<name>", message })`.
- Never dispatch multiple implementation subagents in parallel (conflicts).

Template: [implementer-prompt.md](implementer-prompt.md)

### 2. Handle the report

Implementer subagents report one of four statuses. Handle each appropriately:

**DONE:** Generate the review package (run the inline review-package helper
above with `BASE..HEAD`; it prints the unique file path it wrote; BASE is
the commit you recorded before dispatching the implementer — never
`HEAD~1`, which silently drops all but the last commit of a multi-commit
task), then dispatch the task reviewer with the printed path.

**Any other status** (DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED): read
[references/handling-reports.md](references/handling-reports.md) and follow
it, every time you get one.

If the implementer asks questions — before starting or mid-task — answer
clearly and completely, provide additional context if needed, and don't
rush it into implementation.

### 3. Review the task

Per-task reviews are task-scoped gates. The broad review happens once, at the
final whole-branch review. Never skip the task review, and never accept a
report missing either verdict — spec compliance AND task quality are both
required. Implementer self-review never replaces the task review; both are
needed.

- Hand the reviewer its diff as a file: run the inline review-package helper
  above with `BASE..HEAD` and pass the reviewer the file path it prints (or,
  without bash: `git log --oneline`, `git diff --stat`, and `git diff -U10`
  for the range, redirected to one uniquely named file). The output never
  enters your own context, and the reviewer sees the commit list, stat
  summary, and full diff with context in one `read` call. Use the BASE you
  recorded before dispatching the implementer — never `HEAD~1`, which
  silently truncates multi-commit tasks. Never dispatch a task reviewer
  without a diff file.
- **Reviewer inputs:** the task reviewer gets three paths — the same brief
  file, the report file, and the review package — plus the global
  constraints that bind the task.
- The global-constraints block you hand the reviewer is its attention
  lens. Copy the binding requirements verbatim from the plan's Global
  Constraints section or the spec: exact values, exact formats, and the
  stated relationships between components ("same layout as X", "matches
  Y"). The reviewer's template already carries the process rules (YAGNI,
  test hygiene, review method) — the constraints block is for what THIS
  project's spec demands.
- Do not add open-ended directives like "check all uses" or "run race tests
  if useful" without a concrete, task-specific reason
- Do not ask a reviewer to re-run tests the implementer already ran on the
  same code — the implementer's report carries the test evidence
- Do not pre-judge findings for the reviewer — never instruct a reviewer to
  ignore or not flag a specific issue. If you believe a finding would be a
  false positive, let the reviewer raise it and adjudicate it in the review
  loop. If the prompt you are writing contains "do not flag," "don't treat X
  as a defect," "at most Minor," or "the plan chose" — stop: you are
  pre-judging, usually to spare yourself a review loop.
If the reviewer reports "⚠️ Cannot verify from diff" items, read
[references/cannot-verify.md](references/cannot-verify.md) before you mark
the task complete.

Template: [task-reviewer-prompt.md](task-reviewer-prompt.md)

### 4. The fix loop

The loop triggers when the review reports spec ❌, any Critical or Important
finding, or a ⚠️ item you confirmed as a real gap.

When it triggers, read [references/fix-loop.md](references/fix-loop.md) and
follow it. Read it again before every round, even if you read it earlier in
this session: it holds the round cap, the breaker, and the ledger line each
round writes, and your memory of it does not survive compaction.

### 5. Complete the task

When the review comes back clean — or every open finding is parked with a
ruling at the cap — append the completion line to the ledger in the same
message as your other bookkeeping:

- `Task <N>: complete (commits <base7>..<head7>, review clean)`
- `Task <N>: complete (commits <base7>..<head7>, <K> parked)` after a
  tripped breaker

Then mark the todo complete (via `todo_write`, sending the entire list) and
move on. Never move to the next task while the review has open
Critical/Important issues that are neither fixed nor parked-with-ruling at
the cap.

## Final Review

When every task is complete, read
[references/final-review.md](references/final-review.md) and follow it. It
covers the whole-branch review, its single fix wave, and how you finish.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Close enough on spec compliance" | Reviewer found spec gaps = not done. Fix or hit the cap and adjudicate — those are the only exits. |
| "I'll fix it myself, dispatching is overhead" | Controller fixes pollute your context and skip review. Resume the implementer. |
| "One more round will converge" | Past the cap, rounds don't converge — the failure is structural. Adjudicate and route. |
| "The reviewer will just find something new anyway" | Scoped re-reviews verify fixes; they cannot wander. New findings on untouched code go to the ledger, not the loop. |
| "This finding is obviously wrong, I'll drop it" | You adjudicate only at the cap, and every ruling is a ledger entry. Silent discards are forbidden. |
| "The fix was small, skip the re-review" | Unreviewed fixes are how regressions land. Every round ends with a scoped re-review. |
| "Reviews slow the loop down" | The loop without reviews is just unverified churn. Reviews are the loop's brakes and steering. |
| "Ledger bookkeeping is overhead" | The ledger is what survives compaction. Controllers without one have re-dispatched entire completed task sequences. |
| "The implementer spawned its own reviewer — free extra assurance" | It's a duplicate seat reviewing the same diff; the task review is the gate. A worker-spawned reviewer is a defect to flag, not rigor. |
