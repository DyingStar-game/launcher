import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { playSfx, preloadSoundAssets } from './engine'
import { SOUND_VOLUMES, UI_SOUND_FILES } from './catalog'
import { useSoundStore } from '@stores/sound'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sound engine (Chromium, Web Audio)', () => {
  it('still plays a hover before any click, while the audio context is suspended', async () => {
    const elements = vi.spyOn(window, 'Audio')
    await preloadSoundAssets()
    // Headless Chromium applies the autoplay policy: no user action yet, the context is suspended
    playSfx(UI_SOUND_FILES.default.hover, SOUND_VOLUMES.hover)
    await expect
      .poll(() => elements.mock.calls.filter(([url]) => String(url).includes('ui-hover')))
      .toHaveLength(1)
  })

  it('mixes many hover sounds in one context, decoding the file once, without an Audio per play', async () => {
    // A real click: the context resumes, as in the launcher after the first click
    await userEvent.click(document.body)
    const elements = vi.spyOn(window, 'Audio')
    const contexts = vi.spyOn(window, 'AudioContext')
    const requests = vi.spyOn(XMLHttpRequest.prototype, 'open')
    const decodes = vi.spyOn(AudioContext.prototype, 'decodeAudioData')

    await preloadSoundAssets()
    const decodedAtPreload = decodes.mock.calls.length
    for (let i = 0; i < 20; i++) playSfx(UI_SOUND_FILES.default.hover, SOUND_VOLUMES.hover)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // The music element is the only Audio; the SFX go through Web Audio
    expect(elements.mock.calls.length).toBeLessThanOrEqual(1)
    expect(contexts.mock.calls.length).toBeLessThanOrEqual(1)
    expect(decodes.mock.calls.length).toBe(decodedAtPreload)
    const hoverLoads = requests.mock.calls.filter(([, url]) => String(url).includes('ui-hover'))
    expect(hoverLoads.length).toBeLessThanOrEqual(1)
  })
  it('plays a hover at the volume set, without touching the slider first', async () => {
    await userEvent.click(document.body)
    useSoundStore.setState({ enabled: true, masterVolume: 0.5 })
    // Listen to what reaches the speakers
    const listener: { analyser?: AnalyserNode } = {}
    const connect = AudioNode.prototype.connect as (this: AudioNode, to: AudioNode) => AudioNode
    vi.spyOn(AudioNode.prototype, 'connect').mockImplementation(function (
      this: AudioNode,
      to: AudioNode | AudioParam
    ) {
      if (to instanceof AudioDestinationNode) {
        listener.analyser ??= this.context.createAnalyser()
        connect.call(this, listener.analyser)
      }
      return connect.call(this, to as AudioNode)
    } as typeof AudioNode.prototype.connect)
    await preloadSoundAssets()
    playSfx(UI_SOUND_FILES.default.hover, SOUND_VOLUMES.hover)
    let peak = 0
    const samples = new Float32Array(2048)
    for (let i = 0; i < 8; i++) {
      await new Promise((resolve) => setTimeout(resolve, 40))
      listener.analyser?.getFloatTimeDomainData(samples)
      for (const x of samples) peak = Math.max(peak, Math.abs(x))
    }
    // The file peaks at full scale: catalog level × master volume
    expect(peak).toBeGreaterThan(SOUND_VOLUMES.hover * 0.5 * 0.8)
    expect(peak).toBeLessThanOrEqual(SOUND_VOLUMES.hover * 0.5 * 1.05)
    useSoundStore.setState({ masterVolume: 1 })
  })
})
