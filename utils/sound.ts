let audioContext: AudioContext | null = null;
let isMuted = false;

// Initialize Audio Context on first user interaction
export const initAudio = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
};

export const toggleMute = () => {
    isMuted = !isMuted;
    return isMuted;
};

export const getMutedState = () => isMuted;

// Helper for simple tones (Click, Flag)
const playTone = (type: OscillatorType, freq: number, duration: number, volume: number = 0.1, detune: number = 0) => {
    if (!audioContext || isMuted) return;
    
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        if (detune) osc.detune.setValueAtTime(detune, audioContext.currentTime);
        
        // Envelope to avoid clicking artifacts
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Ignore audio errors
    }
};

export const playClick = () => {
    // High pitched "tick"
    playTone('sine', 800, 0.1, 0.05);
};

export const playFlag = () => {
    // Lower pitched "thud"
    playTone('square', 300, 0.1, 0.03);
};

export const playUnflag = () => {
    playTone('square', 250, 0.1, 0.03);
};

export const playExplosion = () => {
    if (!audioContext || isMuted) return;

    try {
        const bufferSize = audioContext.sampleRate * 0.5; // 0.5 seconds
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate White Noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // Lowpass filter to make it sound like an explosion/rumble
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        noise.start();
    } catch (e) {
        console.error(e);
    }
};

export const playWin = () => {
    if (!audioContext || isMuted) return;
    const now = audioContext.currentTime;
    // C Major Arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    
    notes.forEach((freq, i) => {
        try {
            const osc = audioContext!.createOscillator();
            const gain = audioContext!.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
            
            osc.connect(gain);
            gain.connect(audioContext!.destination);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        } catch(e) {}
    });
};