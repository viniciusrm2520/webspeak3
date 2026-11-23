// Speech detection for TeamSpeak's "Hybrid" voice activation: the volume
// threshold alone also opens for a keyboard, a door or a fan, so Hybrid only
// transmits when the sound is loud enough AND sounds like speech.
//
// A frame counts as speech when two independent checks agree:
// - WebRTC's own VAD (libfvad, a small GMM model, compiled to WASM by
//   @echogarden/fvad-wasm - ~20 KB, loaded only once Hybrid is picked). On
//   its own it passes speech but also steady noise: measured on synthetic
//   clips it called 100% of loud fan noise and ~45% of typing "speech".
// - Periodicity: voiced speech has a fundamental (70-400 Hz), noise and
//   clicks don't. The normalized autocorrelation peak over those pitch lags
//   took both noise clips to 0% while keeping ~92% of loud speech frames;
//   the rest are unvoiced consonants, which the capture's hangover bridges.

import createFvad from "@echogarden/fvad-wasm";
import fvadWasmUrl from "@echogarden/fvad-wasm/fvad.wasm?url";

interface FvadModule {
  _fvad_new(): number;
  _fvad_free(handle: number): void;
  _fvad_set_mode(handle: number, mode: number): number;
  _fvad_set_sample_rate(handle: number, rate: number): number;
  _fvad_process(handle: number, frame: number, length: number): number;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  setValue(ptr: number, value: number, type: "i16"): void;
}

/** Rates libfvad accepts directly; anything else is resampled to 16 kHz. */
const NATIVE_RATES = [8000, 16000, 32000, 48000];
/** 30 ms frames: the longest libfvad takes, so the fewest calls. */
const FRAME_MS = 30;
/** Pitch range searched for periodicity. */
const MIN_PITCH_HZ = 70;
const MAX_PITCH_HZ = 400;
/** Normalized autocorrelation peak a frame needs to count as voiced. */
const VOICING_THRESHOLD = 0.5;
/** Periodicity is measured at ~16 kHz: plenty for 400 Hz, a third of the work. */
const VOICING_RATE = 16000;

let modulePromise: Promise<FvadModule> | null = null;

function loadModule(): Promise<FvadModule> {
  modulePromise ??= (createFvad as (opts: object) => Promise<FvadModule>)({
    locateFile: () => fvadWasmUrl,
  }).catch((err: unknown) => {
    modulePromise = null;
    throw err;
  });
  return modulePromise;
}

export class SpeechDetector {
  private readonly frameLength: number;
  private readonly frame: Float32Array;
  private filled = 0;
  private readonly step: number;
  private position = 0;
  private readonly framePtr: number;
  private handle: number;
  private readonly fvad: FvadModule;
  /** The most recent frame's verdict. */
  speech = false;

  private constructor(fvad: FvadModule, inputRate: number, aggressiveness: number) {
    this.fvad = fvad;
    const rate = NATIVE_RATES.includes(inputRate) ? inputRate : 16000;
    this.step = inputRate / rate;
    this.frameLength = (rate * FRAME_MS) / 1000;
    this.frame = new Float32Array(this.frameLength);
    this.handle = fvad._fvad_new();
    if (!this.handle) throw new Error("fvad_new failed");
    fvad._fvad_set_sample_rate(this.handle, rate);
    fvad._fvad_set_mode(this.handle, aggressiveness);
    this.framePtr = fvad._malloc(this.frameLength * 2);
    this.decimate = Math.max(1, Math.floor(rate / VOICING_RATE));
    const voicingRate = rate / this.decimate;
    this.voicingFrame = new Float32Array(Math.floor(this.frameLength / this.decimate));
    this.minLag = Math.floor(voicingRate / MAX_PITCH_HZ);
    this.maxLag = Math.min(Math.ceil(voicingRate / MIN_PITCH_HZ), this.voicingFrame.length - 1);
  }

  private readonly decimate: number;
  private readonly voicingFrame: Float32Array;
  private readonly minLag: number;
  private readonly maxLag: number;

  /** Peak normalized autocorrelation over the pitch lags: ~1 for a clean
   *  periodic (voiced) frame, near 0 for noise or clicks. */
  private voicing(): number {
    const x = this.voicingFrame;
    const n = x.length;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += this.frame[i * this.decimate];
    mean /= n;
    for (let i = 0; i < n; i++) x[i] = this.frame[i * this.decimate] - mean;
    let best = 0;
    for (let lag = this.minLag; lag <= this.maxLag; lag++) {
      let num = 0;
      let e0 = 0;
      let e1 = 0;
      for (let i = 0; i + lag < n; i++) {
        const a = x[i];
        const b = x[i + lag];
        num += a * b;
        e0 += a * a;
        e1 += b * b;
      }
      const r = num / Math.sqrt(e0 * e1 + 1e-12);
      if (r > best) best = r;
    }
    return best;
  }

  /** `aggressiveness` 0-3: higher rejects more non-speech, at the risk of
   *  clipping quiet speech. */
  static async create(inputRate: number, aggressiveness = 2): Promise<SpeechDetector> {
    return new SpeechDetector(await loadModule(), inputRate, aggressiveness);
  }

  /** Feeds captured samples (any length); returns whether the latest
   *  complete frame was speech. Frames quieter than `minRms` never count:
   *  the browser's noise suppressor leaves faint tonal residue between
   *  sounds that both checks can mistake for voice (measured: about a third
   *  of the quiet frames between typed keys), which would otherwise keep
   *  "recent speech" alive for the next loud click. */
  process(samples: Float32Array, minRms = 0): boolean {
    if (!this.handle) return false;
    this.minRms = minRms;
    // Nearest-sample pick when resampling: plenty for a speech/no-speech call.
    for (; this.position < samples.length; this.position += this.step) {
      this.frame[this.filled++] = samples[Math.floor(this.position)];
      if (this.filled === this.frameLength) {
        this.filled = 0;
        this.analyze();
      }
    }
    this.position -= samples.length;
    return this.speech;
  }

  private minRms = 0;

  private analyze(): void {
    const { fvad, frame, framePtr } = this;
    let sumSquares = 0;
    for (let i = 0; i < frame.length; i++) {
      const s = Math.max(-1, Math.min(1, frame[i]));
      sumSquares += s * s;
      fvad.setValue(framePtr + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, "i16");
    }
    // Always run the VAD so its noise model keeps adapting, even on quiet frames.
    const result = fvad._fvad_process(this.handle, framePtr, frame.length);
    if (result < 0) return;
    const loud = Math.sqrt(sumSquares / frame.length) >= this.minRms;
    // Cheapest checks first: periodicity only for loud frames the VAD accepts.
    this.speech = loud && result === 1 && this.voicing() >= VOICING_THRESHOLD;
  }

  free(): void {
    if (!this.handle) return;
    this.fvad._free(this.framePtr);
    this.fvad._fvad_free(this.handle);
    this.handle = 0;
  }
}
