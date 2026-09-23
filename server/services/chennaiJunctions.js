import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIST_PATH = path.join(__dirname, '../data/chennai_junctions.json');

let cache = null;

export function getChennaiJunctions() {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));
  }
  return cache;
}

export function getChennaiJunctionById(id) {
  return getChennaiJunctions().find((j) => j.id === String(id));
}
