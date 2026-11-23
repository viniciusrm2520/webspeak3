/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

/** Injected by vite.config.ts; matches the `buildId` in version.json. */
declare const __BUILD_ID__: string

/** Emscripten module factory of WebRTC's VAD (see src/vad.ts). */
declare module "@echogarden/fvad-wasm" {
  const createFvad: (moduleArg?: object) => Promise<unknown>;
  export default createFvad;
}
