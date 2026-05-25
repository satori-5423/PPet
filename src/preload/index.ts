import { contextBridge, ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'

async function findModelFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const subResults = await findModelFiles(fullPath)
      results.push(...subResults)
    } else if (
      entry.name.endsWith('model.json') ||
      entry.name.endsWith('.model3.json')
    ) {
      results.push(fullPath)
    }
  }
  return results
}

const getModels = async (file: File) => {
  const filePath = (file as any).path
  if (filePath.endsWith('model.json') || filePath.endsWith('.model3.json')) {
    return [filePath]
  }

  const stat = await fs.promises.stat(filePath)
  if (stat.isDirectory()) {
    return findModelFiles(filePath)
  }
  return []
}

// Get config synchronously during preload initialization
const config = ipcRenderer.sendSync('get-config')

contextBridge.exposeInMainWorld('bridge', {
  getModels,
  scanDirectory: async (dirPath: string) => {
    const models = await findModelFiles(dirPath)
    return models.map((p) => 'ppet:///' + p)
  },
  setWinResizable: (resizable: boolean) =>
    ipcRenderer.send('set-resizable', resizable),
  isWinResizable: () => ipcRenderer.invoke('is-resizable'),
  getConfig: () => config,
})
