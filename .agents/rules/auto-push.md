---
trigger: always_on
description: Always commit and push changes to the repository when finishing any code writing or file modifications on this project.
---

# Auto Push to GitHub Rule

Whenever you finish writing code, updating components, fixing bugs, or modifying files in this project:
1. Verify that your changes compile cleanly without errors (e.g. `npx tsc --noEmit`).
2. Stage and commit the modified files with a descriptive conventional commit message.
3. Push the commits to `origin/main` (or the current active branch) so the repository is always up-to-date.
