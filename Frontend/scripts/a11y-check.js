import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

async function run() {
  const distIndex = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('No se encontró dist/index.html. Ejecuta `npm run build` primero.');
    process.exit(2);
  }

  const html = fs.readFileSync(distIndex, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  const { window } = dom;

  // wait briefly for resources to parse
  await new Promise((res) => setTimeout(res, 500));

  // inject axe source
  const script = window.document.createElement('script');
  script.textContent = axe.source;
  window.document.head.appendChild(script);

  // run axe
  const results = await window.axe.run(window.document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa']
    }
  });

  if (results.violations && results.violations.length > 0) {
    console.log('Violaciones de accesibilidad encontradas:');
    results.violations.forEach((v) => {
      console.log(`\n[${v.id}] ${v.description}`);
      v.nodes.forEach((n, i) => {
        console.log(`  ${i + 1}) Target: ${n.target.join(', ')}`);
        console.log(`     Failure summary: ${n.failureSummary}`);
      });
    });
    process.exit(1);
  }

  console.log('No se encontraron violaciones de accesibilidad (WCAG2A/AA).');
}

run().catch((e) => {
  console.error('Error ejecutando auditoría a11y:', e);
  process.exit(3);
});
