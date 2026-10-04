# Discover the session history

Resolve the session your human partner named from DSH's own session store.
Your knowledge can suggest where to look; verify the result against the
actual history.

Use DSH's exposed session tools, the configured storage under the DSH home,
local help, or bounded filesystem inspection. Measure files before reading
their content and follow `references/context-safety.md`. Inspect archives or
indexes when the environment points to them. A supplied usable path does not
need another search.

## Where DSH keeps session history

DSH session history lives under the DSH home, default `~/.dsh`; honor
`$DSH_HOME` when it is set:

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
ls -l "$DSH_HOME/sessions"
```

- `$DSH_HOME/sessions/` holds one directory per working directory, named by
  encoding the cwd: `--` + the absolute cwd with every `/` replaced by `-` +
  `--`. For cwd `/home/jason/dsh-superpowers` the directory is
  `--home-jason-dsh-superpowers--`:

  ```bash
  DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
  CWD_ENC="--$(printf '%s' "$PWD" | tr '/' '-')--"
  ls -l "$DSH_HOME/sessions/$CWD_ENC"
  ```

- Inside that directory there is one directory per session:
  `<session-id>/session.v4.jsonl.zstd`, plus `session.lock`. Session ids look
  like `session-<uuid>` in newer files and `<uuid>` in older ones.

  ```bash
  DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
  SESS="$DSH_HOME/sessions/$CWD_ENC/<session-id>"
  ls -l "$SESS"
  ls -l "$SESS/session.v4.jsonl.zstd"             # compressed size in bytes
  zstd -dc "$SESS/session.v4.jsonl.zstd" | wc -lc # lines and bytes, decompressed
  ```

- The file is zstd-compressed JSON Lines. Stream it through `zstd -dc` into a
  narrow filter; never decompress a whole file into the terminal blindly, and
  never decompress a session file in place. Measure `ls -l` and
  `zstd -dc FILE | wc -lc` first.
- Interpreter availability may vary; the examples below assume `python3` for
  JSON parsing. Substitute an equivalent bounded extractor if it is missing.

  ```bash
  F="$SESS/session.v4.jsonl.zstd"
  zstd -dc "$F" | sed -n '1p' | python3 -c "import sys,json;h=json.load(sys.stdin);print({k:h.get(k) for k in ('type','version','id','createdAt','cwd','parentSession','isSeeded','origin','delegationDepth','agentPreset')})"
  zstd -dc "$F" | python3 -c "import sys,json,collections;c=collections.Counter();[c.update([json.loads(l).get('type')]) for l in sys.stdin if l.strip()];print(c.most_common())"
  ```

- Existing `$DSH_HOME/storages/session_projcache/sessions/<id>.json` files are
  a per-session projection cache (not the transcript); use them only as a
  secondary index when one helps locate an id, and never as evidence.

## Record format

The first line is a header:

```json
{"type":"session","version":4,"id":"...","createdAt":<epoch-ms>,"cwd":"...","parentSession":...,"isSeeded":...,"origin":"subagent","delegationDepth":<n>,"agentPreset":...}
```

Every later line is `{"type":...,"seq":<n>,"time":<epoch-ms>,"data":{...}}`.
Observed types and shapes:

- `user/message` — `data.content[]` of `{"type":"text","text":...}`; these are
  human-typed prompts for a top-level session. `agent/inbox/spliced` is an
  injected parent-agent dispatch, not a human prompt.
- `assistant/message` — `data.turn`, `data.step`, `data.message.content[]`
  with parts `{"type":"text"|"reasoning"|"tool-call",...}`; tool-call parts
  carry `id`, `name`, `arguments` (a JSON string).
- `tool/call` — `data.callId`, `data.name`, `data.arguments` (JSON string),
  `data.turn`, `data.step`.
- `tool/result` — `data.message.toolCallId`, `data.message.content[].text`,
  `data.message.isError`; `data.sourceEventSeqs` links it to its call.
- `step/start`, `step/end` (`data.turn`, `data.step`); `turn/start`,
  `turn/end` (`data.turn`, and on end `data.reason`, for example
  `{"kind":"aborted",...}`); `session/title` (`data.title`); `request/header`
  (`data.header.config.provider`, `data.header.config.model`, tools list);
  `request/context` (`data.provider`, `data.model`, `data.contextWindow`);
  `subagent/descriptor` (`data.label`, `data.provider`, `data.agentModel`,
  `data.mode`); `system/message` (harness system prompt).
- Subagent/child sessions have `delegationDepth > 0` and/or a
  `parentSession` in the header.
- `time` and `createdAt` are epoch milliseconds. The human-visible order is
  file order (line numbers).
- No dedicated token-usage record was observed in DSH session files. Record
  usage counters as unavailable in the case file unless discovery finds an
  evidenced counter; never invent one.

## Confirm identity

Confirm identity using the available session id, working directory,
timestamps, and matching conversation content. Recency alone is not
confirmation. Quote the first human prompt and its timestamp, for example:

```bash
F="$SESS/session.v4.jsonl.zstd"
zstd -dc "$F" | python3 -c "
import sys, json
for n, line in enumerate(sys.stdin, 1):
    line = line.strip()
    if not line:
        continue
    o = json.loads(line)
    if o.get('type') == 'user/message':
        text = ' '.join(p.get('text','') for p in o.get('data',{}).get('content',[]) if p.get('type') == 'text')
        print(n, o.get('time'), text[:120]); break
"
```

Distinguish the requested session from its children and unrelated candidates.
Enumerate child sessions by reading headers for `parentSession` and
`delegationDepth > 0`:

```bash
for d in "$DSH_HOME"/sessions/*/*/; do
  f="$d/session.v4.jsonl.zstd"
  [ -f "$f" ] || continue
  zstd -dc "$f" | sed -n '1p' | python3 -c "import sys,json;h=json.load(sys.stdin);print(h.get('id'), h.get('cwd'), h.get('parentSession'), h.get('delegationDepth'))"
done
```

Ask for a missing identifying fact when the available evidence cannot
distinguish sessions.

For each filesystem source, obtain its full absolute path from the
environment, with home-directory shorthand and variables expanded. Use that
same path in the case record and in the discovery answer you give your human
partner.

Establish the record meanings needed for the requested investigation from
observed records or documentation. Distinguish human messages from injected
messages, tool results, and a parent agent's dispatch. Match tool calls to
their results through `data.callId` / `data.message.toolCallId` and
`data.sourceEventSeqs`. Establish usage-counter semantics before calculating
totals. Do not infer a format from another harness or turn a missing field
into a zero.

Record the exact sources, relevant field meanings, supporting record
locations, associated sessions, rejected plausible candidates, and unresolved
information in the case file. Subsequent readers use that record rather than
repeating discovery. If history is missing, inaccessible, or ambiguous, state
the specific limitation and ask for the missing path, export, or identifying
detail.

This discovery is read-only and context-safe: use `zstd -dc` to read, never
mutate, move, or delete a session file, and never print a whole record.
