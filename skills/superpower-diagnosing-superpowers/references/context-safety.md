# Context safety for session transcripts

One transcript record can exceed a megabyte or embed a whole history. Printing
one whole record can overflow the context of the session doing the diagnosis.
Every reader of a session file, controller or subagent, follows these rules for
every file, every time. DSH session transcripts are zstd-compressed JSON Lines,
so every measurement and extraction streams through `zstd -dc`; `zstd -dc`
writes to stdout only and never writes to the session file.

1. **Measure before reading.**

   ```bash
   F="$SESS/session.v4.jsonl.zstd"   # absolute path to a session transcript
   ls -l "$F"                        # compressed size in bytes
   zstd -dc "$F" | wc -lc            # decompressed lines and bytes
   zstd -dc "$F" | awk '{ if (length($0) > 100000) print NR, length($0) }'   # long lines
   ```

2. **Never `cat` or `grep` for content.** Get line numbers and counts
   first, then small fields from specific lines. Use the field-extraction
   commands established during discovery for the source in front of you.
   Interpreter availability may vary; substitute an equivalent bounded
   extractor when `python3` is not installed.

   ```bash
   # count record types, largest first
   zstd -dc "$F" | python3 -c "import sys,json,collections;c=collections.Counter();[c.update([json.loads(l).get('type')]) for l in sys.stdin if l.strip()];print(c.most_common())"

   # line numbers of a marker only
   zstd -dc "$F" | grep -n 'some marker' | cut -d: -f1

   # one field from one specific line
   zstd -dc "$F" | sed -n 'Np' | python3 -c "import sys,json;o=json.load(sys.stdin);print(o.get('type'))"

   # a bounded character slice of one specific line
   zstd -dc "$F" | sed -n 'Np' | cut -c1-500
   ```

3. **Narrow anything over 500 characters.** If a command returns more than
   500 characters for one record, tighten the field or the slice.
4. **Read-only.** Never modify, move, or delete a session file. Decompress
   with `zstd -dc` (stdout) only; never decompress or rewrite a session file
   in place, and never leave a decompressed copy beside it.
