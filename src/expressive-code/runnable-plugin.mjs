/**
 * @module runnable-plugin
 *
 * Expressive Code plugin that marks Rust code blocks as runnable.
 *
 * ### Usage in Markdown
 * ````markdown
 * ```rust runnable
 * fn main() { println!("Hello!"); }
 * ```
 * ````
 *
 * ### How it works
 * Expressive Code processes code blocks at build time. This plugin hooks into
 * the `postprocessRenderedBlock` stage and, for any block with the `runnable`
 * meta flag, adds:
 * - CSS class `ec-runnable` on the `<figure>` element
 * - `data-runnable="true"` attribute
 * - `data-language` attribute (used by the client script to skip non-Rust blocks)
 *
 * The client-side script (`public/runnable-code.js`) queries `.ec-runnable`
 * figures on page load and injects a **Run** button into each one.
 *
 * ### Security note
 * Adding `runnable` here only affects the UI. Actual execution is gated by the
 * SHA-256 allowlist in `src/lib/runnable-code.ts` — the API will reject any code
 * that was not present in the documentation at build time.
 */

import { definePlugin, addClassName } from 'expressive-code';

/**
 * Returns the Expressive Code plugin instance.
 * Register this in `astro.config.mjs` under `expressiveCode.plugins`.
 *
 * @returns {import('expressive-code').ExpressiveCodePlugin}
 */
export function runnableCodePlugin() {
  return definePlugin({
    name: 'runnable-code',
    hooks: {
      /**
       * Runs after each code block is rendered.
       * Adds the `ec-runnable` marker when the `runnable` meta flag is present.
       *
       * @param {object} context
       * @param {import('expressive-code').ExpressiveCodeBlock} context.codeBlock
       * @param {object} context.renderData
       */
      postprocessRenderedBlock({ codeBlock, renderData }) {
        // Check for `runnable` in the code fence meta string (e.g. ```rust runnable)
        const isRunnable =
          codeBlock.metaOptions.getBoolean('runnable') ??
          codeBlock.metaOptions.list('runnable').length > 0;
        if (!isRunnable) return;

        // Annotate the rendered <figure> so the client script can find it
        const blockAst = renderData.blockAst;
        addClassName(blockAst, 'ec-runnable');
        blockAst.properties = blockAst.properties || {};
        blockAst.properties['data-runnable'] = 'true';
        blockAst.properties['data-language'] = codeBlock.language || 'text';
      },
    },
  });
}
