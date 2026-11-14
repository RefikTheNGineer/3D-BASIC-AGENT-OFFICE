---
mode: agent
description: Runs Tester, Reviewer, and Fixer agents in an automated QA loop.
tools: ['codebase', 'editFiles', 'terminal', 'problems', 'search']
---
STRICT RULE: Only inspect and modify files inside the currently open workspace. Never traverse outside the root folder.

Execute this 3-step QA loop (max 3 iterations) until all checks pass:
1. **Test:** Follow `.github/chatmodes/tester.chatmode.md` to test the workspace.
2. **Review:** Follow `.github/chatmodes/reviewer.chatmode.md` to audit the code.
3. **Fix & Re-verify:** If any test fails or Reviewer outputs **REJECTED**, apply `.github/chatmodes/fixer.chatmode.md` to fix the issues and repeat from Step 1.