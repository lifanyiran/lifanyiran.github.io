import assert from 'node:assert/strict';
import test from 'node:test';

import { injectGiscusComments } from './ensure-giscus-comments.mjs';

test('adds pathname-mapped Giscus before the next-article block', () => {
  const input = [
    "<article class='content md post'><p>新文章</p></article>",
    '<div class="related-wrap reveal" id="read-next">下一篇</div>',
  ].join('\n');

  const output = injectGiscusComments(input);

  assert.match(output, /id="comments"/);
  assert.match(output, /data-mapping="pathname"/);
  assert.ok(output.indexOf('id="comments"') < output.indexOf('id="read-next"'));
});

test('does not add a second comment block', () => {
  const input = [
    "<article class='content md post'></article>",
    '<div id="comments"></div>',
  ].join('\n');

  assert.equal(injectGiscusComments(input), input);
});

test('ignores non-article pages', () => {
  const input = '<main class="post-list"></main>';
  assert.equal(injectGiscusComments(input), input);
});
