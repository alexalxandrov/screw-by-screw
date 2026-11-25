# Local learning progress

## Behaviour

The learning panel saves its current state in browser `localStorage`, separately for each model ID. Reopening the Learn tab or refreshing the page restores the question index, score, currently selected choice, whether the answer was checked, and completion state.

The saved record contains only:
- model ID and stable question IDs;
- question index and score;
- selected choice index, checked state and completion state.

No account, network request, analytics or backend is involved. Progress is local to the browser profile and device. Clearing browser site data or opening the project in another browser profile may remove or hide that progress.

## Package changes and storage failure

A saved record is restored only when its exact model ID and ordered question-ID list match the active package. If questions are added, removed or reordered, stale progress is discarded rather than applied to a different question.

When browser storage is blocked, unavailable or full, the quiz remains usable for the current page session and displays a notice. Restarting a completed quiz clears the saved progress for that model.
