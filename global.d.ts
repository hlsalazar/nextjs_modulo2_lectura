// global.d.ts
export {};

declare global {
  interface Window {
    GazeCloudAPI: any; // Usa "any" si no tienes los tipos exactos
  }
}
