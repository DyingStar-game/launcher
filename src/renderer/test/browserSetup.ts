import '@assets/main.css'
import './commonSetup'

/**
 * Rendering test setup (ADR 0033): the launcher's stylesheet (Tailwind, theme, fonts) and the
 * shared setup (English strings, mocked `window.api`, cleanup). Sounds stay real: the engine
 * already ignores a refused playback.
 */
