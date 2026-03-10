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

  const pre = document.createElement('pre');
  pre.className = 'ec-runnable-output-pre';
  wrapper.appendChild(pre);

  return { wrapper, pre };
}

async function runCode({ code, outputPre, outputWrapper, runButton }) {
  runButton.disabled = true;
  runButton.textContent = 'Running...';
  outputWrapper.hidden = false;
  outputPre.textContent = 'Running...';

  try {
    const response = await fetch(RUN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error || 'Execution failed.';
      outputPre.textContent = message;
      return;
    }

    const stdout = payload.stdout || '';
    const stderr = payload.stderr || '';
    const exitCode = payload.exitCode ?? 0;
    const durationMs = payload.durationMs ?? 0;

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;

    if (!output) output = '(no output)';
    if (output.length > OUTPUT_LIMIT) {
      output = output.slice(0, OUTPUT_LIMIT) + '\n...output truncated';
    }

    outputPre.textContent = `${output}\n\n(exit ${exitCode}, ${durationMs}ms)`;
  } catch (error) {
    outputPre.textContent = error instanceof Error ? error.message : 'Execution failed.';
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run';
  }
}

function setupRunnableBlocks() {
  const runnableBlocks = document.querySelectorAll('figure.ec-runnable');
  if (!runnableBlocks.length) return;

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

    const { wrapper, pre: outputPre } = createOutputElement();
    figure.insertAdjacentElement('afterend', wrapper);

    const actions = document.createElement('div');
    actions.className = 'ec-runnable-actions';

    const runButton = document.createElement('button');
    runButton.className = 'ec-run-button';
    runButton.type = 'button';
    runButton.textContent = 'Run';
    runButton.addEventListener('click', () =>
      runCode({ code, outputPre, outputWrapper: wrapper, runButton })
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
