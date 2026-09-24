import { ImportResult } from './import-export';
export interface ImportHistory { id: string; startedAt: string; targetId: string; total: number; result?: ImportResult; }
const KEY = 'import-history-v1';
export async function readImportHistory(): Promise<ImportHistory[]> {
  return new Promise((resolve, reject) => chrome.storage.local.get(KEY, data => {
    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message)); else resolve(data[KEY] || []);
  }));
}
export async function saveImportHistory(entry: ImportHistory): Promise<void> {
  const old = await readImportHistory();
  await new Promise<void>((resolve, reject) => chrome.storage.local.set({[KEY]: [...old.filter(r => r.id !== entry.id), entry].slice(-20)}, () => {
    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message)); else resolve();
  }));
}
