/**
 * @file runnable-code.js
 *
 * Client-side handler for interactive Rust code execution.
 *
 * ### Flow
 * 1. On page load, query all `figure.ec-runnable` elements (marked at build
 *    time by `src/expressive-code/runnable-plugin.mjs`).
 * 2. Send a warm-up GET to `/api/run-rust` so the Fly.io sandbox machine
 *    wakes up before the user clicks Run.
 * 3. Inject a **Run** button into each code block's header toolbar and a
 *    terminal-style output panel immediately after the `<figure>`.
 * 4. On click, POST the code to `/api/run-rust` and render the result.
 *
 * ### Astro SPA compatibility
 * Re-runs on `astro:page-load` and `astro:after-swap` to handle client-side
 * navigation. A `data-run-attached` guard prevents duplicate buttons.
 */

/** @type {string} API endpoint for code execution and warm-up pings */
const RUN_ENDPOINT = '/api/run-rust';

/** Maximum characters of stdout/stderr to display before truncating */
const OUTPUT_LIMIT = 8192;

/**
 * Decode the code string stored in Expressive Code's copy button.
 * EC encodes newlines as U+007F (`\x7f`) in the `data-code` attribute.
 *
 * @param {HTMLButtonElement} button
 * @returns {string} Decoded, normalised source code
 */
function decodeCodeFromCopyButton(button) {
  const raw = button.getAttribute('data-code') || '';
  return raw.replace(/\u007f/g, '\n').replace(/\r\n/g, '\n').trimEnd();
}

/**
 * Build the terminal output DOM structure and return live references.
 *
 * Rendered structure:
 * ```
 * div.ec-runnable-output
 *   div.ec-runnable-output-header   (traffic-light dots + "Output" label)
 *   div.ec-runnable-output-body
 *     pre.ec-runnable-output-pre    ← stdout / stderr rendered here
 *   div.ec-runnable-output-footer   ← exit-code badge + duration
 * ```
 *
 * @returns {{ wrapper: HTMLDivElement, pre: HTMLPreElement, footer: HTMLDivElement }}
 */
function createOutputElement() {
  const wrapper = document.createElement('div');
  wrapper.className = 'ec-runnable-output';
  wrapper.hidden = true;

  // Header: macOS-style traffic-light dots + "Output" label
  const header = document.createElement('div');
  header.className = 'ec-runnable-output-header';

  const dots = document.createElement('span');
  dots.className = 'ec-runnable-output-dots';
  dots.innerHTML =
    '<span class="dot dot-red"></span>' +
    '<span class="dot dot-yellow"></span>' +
    '<span class="dot dot-green"></span>';

  const title = document.createElement('span');
  title.className = 'ec-runnable-output-title';
  title.textContent = 'Output';

  header.appendChild(dots);
  header.appendChild(title);

  // Body: pre element that holds stdout / stderr text
  const body = document.createElement('div');
  body.className = 'ec-runnable-output-body';

  const pre = document.createElement('pre');
  pre.className = 'ec-runnable-output-pre';
  body.appendChild(pre);

  // Footer: exit-code badge + wall-clock duration
  const footer = document.createElement('div');
  footer.className = 'ec-runnable-output-footer';
  footer.hidden = true;

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  wrapper.appendChild(footer);

  return { wrapper, pre, footer };
}

/**
 * Populate the output panel with the result of a run.
 *
 * @param {HTMLPreElement} pre
 * @param {HTMLDivElement} footer
 * @param {{ error?: string, stdout?: string, stderr?: string, exitCode?: number, durationMs?: number }} payload
 */
function setOutputContent(pre, footer, payload) {
  pre.innerHTML = '';
  footer.innerHTML = '';
  footer.hidden = false;

  // API-level error (network failure, 403 not-allowed, 502 runner error, etc.)
  if (payload.error) {
    const span = document.createElement('span');
    span.className = 'ec-out-stderr';
    span.textContent = payload.error;
    pre.appendChild(span);
    return;
  }

  const stdout = payload.stdout || '';
  const stderr = payload.stderr || '';
  const exitCode = payload.exitCode ?? 0;
  const durationMs = payload.durationMs ?? 0;

  if (stdout) {
    const span = document.createElement('span');
    span.className = 'ec-out-stdout';
    span.textContent = stdout.length > OUTPUT_LIMIT
      ? stdout.slice(0, OUTPUT_LIMIT) + '\n...output truncated'
      : stdout;
    pre.appendChild(span);
  }

  if (stderr) {
    const span = document.createElement('span');
    span.className = 'ec-out-stderr';
    // Prepend newline when stdout is also present to visually separate them
    span.textContent = (stdout ? '\n' : '') + (stderr.length > OUTPUT_LIMIT
      ? stderr.slice(0, OUTPUT_LIMIT) + '\n...output truncated'
      : stderr);
    pre.appendChild(span);
  }

  if (!stdout && !stderr) {
    const span = document.createElement('span');
    span.className = 'ec-out-muted';
    span.textContent = '(no output)';
    pre.appendChild(span);
  }

  // Exit-code badge: green for 0, red for anything else
  const badge = document.createElement('span');
  badge.className = exitCode === 0 ? 'ec-out-badge ec-out-badge-ok' : 'ec-out-badge ec-out-badge-err';
  badge.textContent = exitCode === 0 ? '✓ exit 0' : `✗ exit ${exitCode}`;

  const time = document.createElement('span');
  time.className = 'ec-out-duration';
  time.textContent = `${durationMs}ms`;

  footer.appendChild(badge);
  footer.appendChild(time);
}

/**
 * POST code to the API and update the output panel.
 *
 * @param {{ code: string, outputPre: HTMLPreElement, outputFooter: HTMLDivElement, outputWrapper: HTMLDivElement, runButton: HTMLButtonElement }} opts
 */
async function runCode({ code, outputPre, outputFooter, outputWrapper, runButton }) {
  runButton.disabled = true;
  runButton.textContent = 'Running...';
  outputWrapper.hidden = false;
  outputPre.innerHTML = '<span class="ec-out-muted">Compiling...</span>';
  outputFooter.hidden = true;

  try {
    const response = await fetch(RUN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const payload = await response.json();
    setOutputContent(outputPre, outputFooter, response.ok ? payload : { error: payload?.error || 'Execution failed.' });
  } catch (error) {
    setOutputContent(outputPre, outputFooter, {
      error: error instanceof Error ? error.message : 'Execution failed.',
    });
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run';
  }
}

/**
 * Fire-and-forget GET ping to wake the Fly.io sandbox machine.
 * Called once per page if any runnable blocks are present.
 */
function warmUpRunner() {
  fetch(RUN_ENDPOINT, { method: 'GET' }).catch(() => {});
}

/**
 * Find all unprocessed `figure.ec-runnable` blocks on the current page,
 * attach a Run button and terminal output panel to each.
 *
 * Idempotent — skips blocks already marked with `data-run-attached="true"`.
 */
function setupRunnableBlocks() {
  const runnableBlocks = document.querySelectorAll('figure.ec-runnable');
  if (!runnableBlocks.length) return;

  warmUpRunner();

  runnableBlocks.forEach((figure) => {
    // Skip blocks already initialised (e.g. on repeated astro:page-load events)
    if (figure.dataset.runAttached === 'true') return;
    figure.dataset.runAttached = 'true';

    // Only process Rust blocks (data-language set by the EC plugin)
    const language = figure.dataset.language;
    if (language && language !== 'rust') return;

    // EC renders a visually hidden copy button that holds the raw source code
    const copyButton = figure.querySelector('button[data-code]');
    if (!copyButton) return;

    const code = decodeCodeFromCopyButton(copyButton);
    if (!code) return;

    const header = figure.querySelector('figcaption.header');
    if (!header) return;

    // Insert the terminal output panel immediately after the code block
    const { wrapper, pre: outputPre, footer: outputFooter } = createOutputElement();
    figure.insertAdjacentElement('afterend', wrapper);

    // Inject the Run button into the code block's header toolbar
    const actions = document.createElement('div');
    actions.className = 'ec-runnable-actions';

    const runButton = document.createElement('button');
    runButton.className = 'ec-run-button';
    runButton.type = 'button';
    runButton.textContent = 'Run';
    runButton.addEventListener('click', () =>
      runCode({ code, outputPre, outputFooter, outputWrapper: wrapper, runButton })
    );

    actions.appendChild(runButton);
    header.appendChild(actions);
  });
}

// --- Initialisation ---

// Standard page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupRunnableBlocks);
} else {
  setupRunnableBlocks();
}

// Astro View Transitions / client-side navigation
document.addEventListener('astro:page-load', setupRunnableBlocks);
document.addEventListener('astro:after-swap', setupRunnableBlocks);
