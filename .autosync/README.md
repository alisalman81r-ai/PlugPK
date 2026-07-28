# autosync

Everything saved under `F:\plugPK` is committed and pushed to
[alisalman81r-ai/PlugPK](https://github.com/alisalman81r-ai/PlugPK) automatically,
usually within 10–20 seconds of the save.

## How it works

`autosync.ps1` polls `git status --porcelain` every 5 seconds. When it sees
changes it waits for one more poll to confirm the change set has stopped moving
— that way a file still being written is never committed half-finished — then
commits everything and pushes to `origin/main`. If the push is rejected because
the remote moved ahead (a GitHub web edit, another machine), it rebases onto
`origin/main` with `--autostash` and retries once.

It runs as the scheduled task **PlugPK-AutoSync**, which starts at logon.
Auth is Git Credential Manager, so pushes are silent.

## Controls

```powershell
# is it running?
Get-Content F:\plugPK\.autosync\autosync.lock          # pid, if alive
Get-Content F:\plugPK\.autosync\autosync.log -Tail 20  # recent activity

# stop it (graceful — clears its own lock)
Set-Content F:\plugPK\.autosync\autosync.stop 'stop'

# start it again
Start-ScheduledTask -TaskName PlugPK-AutoSync

# turn autostart off / on
Disable-ScheduledTask -TaskName PlugPK-AutoSync
Enable-ScheduledTask  -TaskName PlugPK-AutoSync

# remove it entirely
Unregister-ScheduledTask -TaskName PlugPK-AutoSync -Confirm:$false
```

## Notes

- `.gitignore` decides what is *excluded*; anything else you save gets pushed.
  Secrets belong in `.env` (already ignored) or outside the repo.
- Commits are machine-made (`autosync: N file(s) at <time>`). Nothing stops you
  from committing by hand with a real message — the watcher only acts when the
  tree is dirty.
- Its own `autosync.log` and `autosync.lock` are gitignored, so logging cannot
  trigger a commit loop.
- If a rebase conflicts, autosync aborts it and logs `ERROR` rather than
  guessing. Resolve by hand, and it resumes on the next poll.
