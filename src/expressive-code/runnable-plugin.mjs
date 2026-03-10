import { definePlugin, addClassName } from 'expressive-code';

export function runnableCodePlugin() {
  return definePlugin({
    name: 'runnable-code',
    hooks: {
      postprocessRenderedBlock({ codeBlock, renderData }) {
        const isRunnable =
          codeBlock.metaOptions.getBoolean('runnable') ??
          codeBlock.metaOptions.list('runnable').length > 0;
        if (!isRunnable) return;

        const blockAst = renderData.blockAst;
        addClassName(blockAst, 'ec-runnable');
        blockAst.properties = blockAst.properties || {};
        blockAst.properties['data-runnable'] = 'true';
        blockAst.properties['data-language'] = codeBlock.language || 'text';
      },
    },
  });
}
