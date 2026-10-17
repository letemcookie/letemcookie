# Working on this repository

This file guides contributors to letemcookie itself. It does not install this library into another project or make it a universal default.

- Library API and limits: LIBRARY.md. Consumer integration skill: skills/letemcookie/SKILL.md.
- Run `npm test`, `python3 tests/schema_test.py`, and applicable local browser fixtures before changes ship.
- Never add real trackers to examples or tests. Test gating before optional service startup and real shutdown on withdrawal.
- Keep root index.html and share/index.html identical certificate pages. The owner chose this layout. No demo, counter, legal disclaimer or sales section on the homepage.
- Keep extension and library releases distinct. The public Chrome extension is not necessarily the pending extension source version.
- No automatic posting, telemetry or fabricated legal guarantees. Do not treat the extension marker as proof of consent.
