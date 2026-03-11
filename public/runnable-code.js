const RUN_ENDPOINT = '/api/run-rust';
const OUTPUT_LIMIT = 8192;

function decodeCodeFromCopyButton(button) {
  const raw = button.getAttribute('data-code') || '';
  return raw.replace(/\u007f/g, '\n').replace(/\r\n/g, '\n').trimEnd();
}

function createOutputElement() {
  const wrapper = document.createElement('div');
  wrapper.className = 'ec-runnable-output';
  wrapper.hidden = true;

  // Terminal header
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

  // Body
  const body = document.createElement('div');
  body.className = 'ec-runnable-output-body';

  const pre = document.createElement('pre');
  pre.className = 'ec-runnable-output-pre';
  body.appendChild(pre);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'ec-runnable-output-footer';
  footer.hidden = true;

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  wrapper.appendChild(footer);

  return { wrapper, pre, footer };
}

function setOutputContent(pre, footer, payload) {
  // Clear previous content
  pre.innerHTML = '';
  footer.innerHTML = '';
  footer.hidden = false;

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

  // Footer: exit code badge + duration
  const badge = document.createElement('span');
  badge.className = exitCode === 0 ? 'ec-out-badge ec-out-badge-ok' : 'ec-out-badge ec-out-badge-err';
  badge.textContent = exitCode === 0 ? '✓ exit 0' : `✗ exit ${exitCode}`;

  const time = document.createElement('span');
  time.className = 'ec-out-duration';
  time.textContent = `${durationMs}ms`;

  footer.appendChild(badge);
  footer.appendChild(time);
}

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

function warmUpRunner() {
  fetch(RUN_ENDPOINT, { method: 'GET' }).catch(() => {});
}

function setupRunnableBlocks() {
  const runnableBlocks = document.querySelectorAll('figure.ec-runnable');
  if (!runnableBlocks.length) return;

  warmUpRunner();

  runnableBlocks.forEach((figure) => {
    if (figure.dataset.runAttached === 'true') return;
    figure.dataset.runAttached = 'true';
    const language = figure.dataset.language;
    if (language && language !== 'rust') return;
    const copyButton = figure.querySelector('button[data-code]');
    if (!copyButton) return;

    const code = decodeCodeFromCopyButton(copyButton);
    if (!code) return;

    const header = figure.querySelector('figcaption.header');
    if (!header) return;

    const { wrapper, pre: outputPre, footer: outputFooter } = createOutputElement();
    figure.insertAdjacentElement('afterend', wrapper);

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupRunnableBlocks);
} else {
  setupRunnableBlocks();
}

document.addEventListener('astro:page-load', setupRunnableBlocks);
document.addEventListener('astro:after-swap', setupRunnableBlocks);
