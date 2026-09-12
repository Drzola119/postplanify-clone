# PostPlanify UI Context

## Design intent

PostPlanify should feel calm, capable, and operationally trustworthy: a dense professional workspace without looking cramped. Prefer clear hierarchy, compact controls, restrained color, and honest states over decorative effects.

Both light and dark themes are supported. English, French, and Arabic are supported; every layout must tolerate translated copy and RTL direction.

## Sources of truth

- Theme tokens and compatibility mappings: `src/app/globals.css`
- Shared primitives: `src/components/ui/**`
- Theme provider: `src/components/theme/**`
- Component configuration: `components.json`
- Locale messages and direction helpers: `messages/**`, `src/lib/i18n/**`, `src/i18n/**`

## Tokens

Use semantic utilities backed by CSS custom properties:

- Surfaces: `background`, `surface`, `surface-raised`, `surface-inset`, `card`, `popover`.
- Text: `foreground`, `text-secondary`, `text-tertiary`, `muted-foreground`.
- Actions: `primary`, `primary-foreground`, `secondary`, `accent`, `destructive`.
- Structure: `border`, `border-subtle`, `input`, `ring`.
- Brand: `brand-blue`, `brand-blue-light`.
- Status: success, warning, error, and info token pairs.

Do not add arbitrary gray scales or hard-coded hex colors for ordinary product UI. Platform brand colors and data-series colors are valid only where color carries that identity/meaning.

## Typography and shape

- Use the configured Inter sans stack for Latin UI and Noto Sans Arabic for Arabic.
- Use the semantic radius scale generated from `--radius`.
- Keep headings concise and use weight/spacing before increasing font size.
- Use tabular or monospaced text only for identifiers, timestamps, code, or operational values that benefit from alignment.

## Layout conventions

- Dashboard work uses the existing dashboard shell and navigation patterns.
- Preserve responsive behavior; do not treat desktop-only screenshots as the interface.
- Prefer inline page hierarchy over unnecessary nested cards.
- Dialogs are for bounded decisions or edits, not long multi-page workflows.
- Empty states explain why the area is empty and present one clear next action.
- Loading, unavailable, unsupported, partial-success, and failure states must be visually distinct.

## Interaction conventions

- Reuse shared buttons, inputs, dialogs, menus, tabs, badges, toasts, and tables before creating variants.
- Icons come from Lucide unless a platform-specific mark already exists.
- Every icon-only control needs an accessible name and visible focus state.
- Destructive actions require clear language and confirmation proportional to impact.
- Honor reduced-motion preferences; motion must communicate state, not decorate it.
- Never use color alone to communicate status.

## Content conventions

- Use direct product language: “Scheduled”, “Publishing”, “Partially published”, “Failed”, and “Unsupported” mean different things.
- Never label unknown platform data as a known platform.
- Do not invent successful metrics or delivery status for unsupported integrations.
- Error messages should state what happened and the user's safe next action without revealing secrets.

## UI verification checklist

- Check light and dark themes.
- Check narrow and wide viewports.
- Check keyboard focus and accessible names.
- Check empty, loading, error, unsupported, and partial-result states.
- Check long translations and Arabic/RTL where layout changed.
- Prefer a browser test or screenshot comparison for meaningful visual changes.
