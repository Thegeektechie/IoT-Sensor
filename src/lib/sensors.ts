/**
 * Simplified Sensor Pipeline (no TensorFlow dependency)
 * Uses Web Audio API for noise detection and simulated object detection
 */

export interface DetectionResult {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export interface SensorReading {
  noise_level: number;
  people_count: number;
  detected_objects: DetectionResult[];
  timestamp: number;
}

class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;

  async initialize(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
    } catch (error) {
      console.warn('[IoT] Audio analyzer unavailable, using simulated data');
    }
  }

  getNoiseLevel(): number {
    if (!this.analyser) {
      // Simulate noise between 30-70dB
      return 30 + Math.random() * 40 + Math.sin(Date.now() / 2000) * 10;
    }
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const db = 20 * Math.log10(Math.max(rms, 0.00001));
    return Math.max(20, Math.min(120, db + 100));
  }

  stop(): void {
    this.microphone?.disconnect();
    this.analyser?.disconnect();
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
  }
}

export class SensorPipeline {
  private audioAnalyzer: AudioAnalyzer | null = null;
  private running = false;
  private captureInterval: ReturnType<typeof setInterval> | null = null;
  private onSensorDataCallback: ((data: SensorReading) => void) | null = null;

  async initialize(_videoElement?: HTMLVideoElement): Promise<void> {
    this.audioAnalyzer = new AudioAnalyzer();
    await this.audioAnalyzer.initialize();
  }

  start(intervalMs: number = 1000, onData?: (data: SensorReading) => void): void {
    if (this.running) return;
    this.onSensorDataCallback = onData || null;
    this.running = true;

    this.captureInterval = setInterval(() => {
      this.capture();
    }, intervalMs);
  }

  stop(): void {
    if (!this.running) return;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.running = false;
    this.audioAnalyzer?.stop();
  }

  private capture(): void {
    // Simulated object detection (since we don't have TF.js)
    const simulatedObjects: DetectionResult[] = [];
    const objectTypes = ['person', 'chair', 'laptop', 'cup', 'phone', 'book'];
    const numObjects = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numObjects; i++) {
      simulatedObjects.push({
        class: objectTypes[Math.floor(Math.random() * objectTypes.length)],
        score: 0.6 + Math.random() * 0.35,
        bbox: [Math.random() * 200, Math.random() * 200, 50 + Math.random() * 100, 50 + Math.random() * 100],
      });
    }

    const reading: SensorReading = {
      noise_level: this.audioAnalyzer?.getNoiseLevel() || 40 + Math.random() * 30,
      people_count: simulatedObjects.filter(o => o.class === 'person' && o.score > 0.5).length,
      detected_objects: simulatedObjects,
      timestamp: Date.now(),
    };

    this.onSensorDataCallback?.(reading);
  }

  isRunning_(): boolean {
    return this.running;
  }
}
