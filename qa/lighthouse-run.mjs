import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

const url = 'http://localhost:8080/index.html';

async function run(label, configOverrides) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  const options = { logLevel: 'error', output: 'json', port: chrome.port, ...configOverrides };
  const runnerResult = await lighthouse(url, options);
  const { categories, audits } = runnerResult.lhr;
  console.log(`\n=== ${label} ===`);
  for (const key of Object.keys(categories)) {
    console.log(`${categories[key].title}: ${Math.round(categories[key].score * 100)}`);
  }
  console.log('CLS metric (audit):', audits['cumulative-layout-shift'].displayValue, '| score:', audits['cumulative-layout-shift'].score);
  console.log('LCP:', audits['largest-contentful-paint'].displayValue);
  console.log('TBT:', audits['total-blocking-time'].displayValue);
  fs.writeFileSync(`qa/lighthouse-${label}-after.json`, JSON.stringify(runnerResult.lhr, null, 2));
  try { await chrome.kill(); } catch (e) { console.log('(chrome cleanup warning, ignored):', e.message); }
}

await run('desktop', {
  formFactor: 'desktop',
  screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 }
});

await run('mobile', {
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false }
});
