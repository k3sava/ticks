#!/usr/bin/env node
// indexnow_ping.mjs — submit URL changes to IndexNow (Bing, Yandex, etc.)
// after a content update. IndexNow is a free open protocol that lets a site
// owner notify search engines of new/changed pages without waiting for the
// next crawl.
//
// Usage:
//   1. Pick a key (32-128 hex chars) and host it at /<key>.txt with the key
//      as the file body. Update INDEXNOW_KEY below to match.
//   2. Run after each data.json or per-tick page change:
//        node scripts/indexnow_ping.mjs              # canonical URLs only
//        node scripts/indexnow_ping.mjs --all-ticks  # every tick page
//
// Bing handles the routing; one ping reaches Bing + Yandex.
// Spec: https://www.indexnow.org/documentation

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

// Configuration. Set INDEXNOW_KEY to your hosted key value before use.
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "REPLACE_WITH_YOUR_INDEXNOW_KEY";
const HOST = "ticks.iamkesava.com";
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const BASE_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/why.md`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/data.json`,
];

async function main(){
  if (INDEXNOW_KEY === "REPLACE_WITH_YOUR_INDEXNOW_KEY"){
    console.error("indexnow_ping: INDEXNOW_KEY not set. Set env var or edit script.");
    process.exit(1);
  }

  let urlList = [...BASE_URLS];

  if (process.argv.includes("--all-ticks")){
    const data = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));
    urlList = urlList.concat(
      data.ticks.map(t => `https://${HOST}/#/walk/${t.id}`)
    );
  }

  // IndexNow accepts up to 10,000 URLs per submission. Chunk if larger.
  const chunks = [];
  for (let i = 0; i < urlList.length; i += 9000) chunks.push(urlList.slice(i, i + 9000));

  let success = 0;
  for (const chunk of chunks){
    const body = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: chunk,
    };
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok || r.status === 200 || r.status === 202){
      success += chunk.length;
      console.log(`indexnow_ping: ${chunk.length} URLs accepted (${r.status})`);
    } else {
      const text = await r.text();
      console.error(`indexnow_ping: ${r.status} ${r.statusText} — ${text}`);
    }
  }

  console.log(`done · ${success} of ${urlList.length} URLs submitted`);
}

main().catch(err => { console.error(err); process.exit(1); });
