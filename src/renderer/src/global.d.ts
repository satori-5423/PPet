export {}

declare global {
  interface Window {
    bridge: {
      getModels: (file?: File) => Promise<string[]>
      scanDirectory: (dirPath: string) => Promise<string[]>
      setWinResizable: (resizable: boolean) => void
      isWinResizable: () => Promise<boolean>
      getConfig: () => Record<string, any>
    }
  }
}
