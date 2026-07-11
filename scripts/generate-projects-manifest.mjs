import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const projectsDir = path.join(root, 'proyectos');
const manifestPath = path.join(projectsDir, 'projects.json');
const configPath = path.join(projectsDir, 'projects.config.json');

const titleCase = (value) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const readIfExists = async (filePath) => {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
};

const firstMeaningfulReadmeLine = (markdown) => {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const heading = lines.find((line) => /^#\s+/.test(line));
  const paragraph = lines.find((line) => line && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('!'));
  return {
    title: heading?.replace(/^#\s+/, '').trim(),
    description: paragraph?.replace(/[`*_]/g, '').trim(),
  };
};

const projectTypeFor = (slug) => {
  if (/design.system/i.test(slug)) return 'Design system';
  if (/hero|module/i.test(slug)) return 'Prototype';
  if (/budget|planner/i.test(slug)) return 'Tool';
  return 'Project';
};

const entries = await readdir(projectsDir, { withFileTypes: true });
let projectConfig = {};
try {
  projectConfig = JSON.parse(await readFile(configPath, 'utf8'));
} catch {
  projectConfig = {};
}
const projects = [];

for (const entry of entries) {
  if (!entry.isDirectory() || entry.name === 'node_modules') continue;

  const dir = path.join(projectsDir, entry.name);
  const index = path.join(dir, 'index.html');
  const indexContents = await readIfExists(index);
  if (!indexContents) continue;

  const packageJson = await readIfExists(path.join(dir, 'package.json'));
  const readme =
    (await readIfExists(path.join(dir, 'README.md'))) ||
    (await readIfExists(path.join(dir, 'readme.md')));

  let packageName = '';
  let packageDescription = '';
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      packageName = parsed.displayName || parsed.name || '';
      packageDescription = parsed.description || '';
    } catch {
      // Ignore invalid package metadata and fall back to README/index-derived content.
    }
  }

  const readmeMeta = firstMeaningfulReadmeLine(readme);
  const htmlTitle = indexContents.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
  const htmlDescription = indexContents.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();

  const override = projectConfig[entry.name] || {};
  if (override.hidden) continue;

  const title = override.title || readmeMeta.title || htmlTitle || titleCase(packageName || entry.name);
  // description is a string, or a { en, es, fr, pt, de } object when the config override provides per-language copy.
  const description = override.description || packageDescription || htmlDescription || readmeMeta.description || `Interactive ${title} project.`;

  projects.push({
    slug: entry.name,
    title,
    description,
    type: override.type || projectTypeFor(entry.name),
    url: `proyectos/${encodeURIComponent(entry.name)}/index.html`,
  });
}

// External projects live purely in projects.config.json (no local folder/index.html
// to scan) — anything whose override url is absolute is treated as one.
for (const [key, override] of Object.entries(projectConfig)) {
  if (override.hidden || !override.url || !/^https?:\/\//i.test(override.url)) continue;
  projects.push({
    slug: key,
    title: override.title || key,
    description: override.description || '',
    type: override.type || 'Project',
    url: override.url,
  });
}

projects.sort((a, b) => a.title.localeCompare(b.title));

await writeFile(
  manifestPath,
  `${JSON.stringify({ projects }, null, 2)}\n`,
);

console.log(`Generated ${path.relative(root, manifestPath)} with ${projects.length} projects.`);
