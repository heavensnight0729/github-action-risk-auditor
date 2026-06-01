import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const WORKFLOW_EXTENSIONS = Object.freeze([
  '.yaml',
  '.yml',
]);

export async function loadWorkflowFiles(workflowPath = '.github/workflows') {
  const pathStat = await stat(workflowPath);

  if (pathStat.isFile()) {
    return [await readWorkflowFile(workflowPath)];
  }

  if (!pathStat.isDirectory()) {
    throw new TypeError('workflowPath must be a file or directory');
  }

  const entries = await readdir(workflowPath, {
    withFileTypes: true,
  });
  const workflowFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(workflowPath, entry.name))
    .filter((filePath) => WORKFLOW_EXTENSIONS.some((extension) => filePath.endsWith(extension)))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(workflowFiles.map(readWorkflowFile));
}

async function readWorkflowFile(filePath) {
  return {
    filePath,
    workflowText: await readFile(filePath, 'utf8'),
  };
}
