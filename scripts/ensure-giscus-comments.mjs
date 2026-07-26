import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const COMMENTS_MARKUP = `
<div class='related-wrap md reveal' id="comments">
  <div class='cmt-title cap theme'><p>留言</p></div>
  <div class='cmt-body giscus-comments'>
    <div class="giscus"></div>
    <script src="https://giscus.app/client.js"
            data-repo="lifanyiran/lifanyiran.github.io"
            data-repo-id="MDEwOlJlcG9zaXRvcnkzOTAyNjA2MjU="
            data-category="Announcements"
            data-category-id="DIC_kwDOF0Lnkc4DB_WB"
            data-mapping="pathname"
            data-strict="1"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="dark"
            data-lang="zh-CN"
            data-loading="lazy"
            crossorigin="anonymous"
            async>
    </script>
  </div>
</div>
`;

export function injectGiscusComments(html) {
  if (!/<article\b[^>]*class=(["'])[^"']*\bpost\b[^"']*\1/i.test(html)) {
    return html;
  }

  if (/<[^>]+\bid=(["'])comments\1/i.test(html)) {
    return html;
  }

  const readNext = /<div\b[^>]*\bid=(["'])read-next\1/i.exec(html);
  if (readNext) {
    return `${html.slice(0, readNext.index)}${COMMENTS_MARKUP}\n${html.slice(readNext.index)}`;
  }

  const articleEnd = html.indexOf('</article>');
  if (articleEnd === -1) {
    return html;
  }

  const insertionPoint = articleEnd + '</article>'.length;
  return `${html.slice(0, insertionPoint)}\n${COMMENTS_MARKUP}${html.slice(insertionPoint)}`;
}

async function findArticlePages(root) {
  const pages = [];
  const years = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name));

  for (const year of years) {
    const yearPath = path.join(root, year.name);
    const months = (await readdir(yearPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name));

    for (const month of months) {
      const monthPath = path.join(yearPath, month.name);
      const days = (await readdir(monthPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name));

      for (const day of days) {
        const dayPath = path.join(monthPath, day.name);
        const posts = (await readdir(dayPath, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory());

        for (const post of posts) {
          pages.push(path.join(dayPath, post.name, 'index.html'));
        }
      }
    }
  }

  return pages;
}

async function main() {
  const root = process.cwd();
  const pages = await findArticlePages(root);
  let updated = 0;

  for (const page of pages) {
    let html;
    try {
      html = await readFile(page, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    const nextHtml = injectGiscusComments(html);
    if (nextHtml !== html) {
      await writeFile(page, nextHtml);
      updated += 1;
    }
  }

  console.log(`Checked ${pages.length} article pages; updated ${updated}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
