// Audio Engine for Apple Music Lab
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.tempo = 120;
        this.isPlaying = false;
        this.currentStep = 0;
        this.scheduleInterval = null;
        this.nextNoteTime = 0;
        this.lookahead = 25.0; // milliseconds
        this.scheduleAheadTime = 0.1; // seconds
        
        this.instruments = {
            piano: { type: 'oscillator', wave: 'sine', freq: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] },
            drums: { type: 'noise', samples: ['kick', 'snare', 'hihat', 'openhat', 'crash', 'ride', 'tom1', 'tom2'] },
            bass: { type: 'oscillator', wave: 'sawtooth', freq: [82.41, 87.31, 92.50, 98.00, 103.83, 110.00, 116.54, 123.47] },
            synth: { type: 'oscillator', wave: 'square', freq: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] },
            guitar: { type: 'pluck', freq: [196.00, 246.94, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25] },
            strings: { type: 'oscillator', wave: 'triangle', freq: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00] },
            brass: { type: 'oscillator', wave: 'sawtooth', freq: [174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23] },
            percussion: { type: 'noise', samples: ['conga1', 'conga2', 'bongo1', 'bongo2', 'shaker', 'bell', 'cowbell', 'clap'] }
        };
        
        this.noteSchedule = [];
        this.initAudio();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7;
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    setTempo(bpm) {
        this.tempo = bpm;
    }
    
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume / 100;
        }
    }
    
    playNote(instrument, noteIndex, duration = 0.2, time = null) {
        if (!this.audioContext || !this.instruments[instrument]) return;
        
        const playTime = time || this.audioContext.currentTime;
        const instrumentData = this.instruments[instrument];
        
        switch (instrumentData.type) {
            case 'oscillator':
                this.playOscillatorNote(instrumentData, noteIndex, duration, playTime);
                break;
            case 'noise':
                this.playNoiseNote(instrumentData, noteIndex, duration, playTime);
                break;
            case 'pluck':
                this.playPluckNote(instrumentData, noteIndex, duration, playTime);
                break;
        }
    }
    
    playOscillatorNote(instrumentData, noteIndex, duration, time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        oscillator.type = instrumentData.wave;
        oscillator.frequency.value = instrumentData.freq[noteIndex] || 440;
        
        // Apply filter based on instrument
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 2000 + (noteIndex * 200);
        filterNode.Q.value = 1;
        
        // Envelope
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + duration);
    }
    
    playNoiseNote(instrumentData, noteIndex, duration, time) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate different noise patterns for different drum sounds
        const samples = instrumentData.samples;
        const sampleType = samples[noteIndex] || 'kick';
        
        for (let i = 0; i < bufferSize; i++) {
            switch (sampleType) {
                case 'kick':
                    // Low frequency emphasis for kick
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1)) * 
                             (1 + Math.sin(i * 0.001) * 0.5);
                    break;
                case 'snare':
                    // High frequency noise for snare
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
                    break;
                case 'hihat':
                    // Very high frequency for hihat
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.02)) * 
                             (Math.random() > 0.7 ? 1 : 0.1);
                    break;
                default:
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
            }
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        // Different filter settings for different drum sounds
        switch (sampleType) {
            case 'kick':
                filterNode.type = 'lowpass';
                filterNode.frequency.value = 100;
                break;
            case 'snare':
                filterNode.type = 'bandpass';
                filterNode.frequency.value = 200;
                filterNode.Q.value = 0.5;
                break;
            case 'hihat':
                filterNode.type = 'highpass';
                filterNode.frequency.value = 8000;
                break;
            default:
                filterNode.type = 'bandpass';
                filterNode.frequency.value = 1000;
        }
        
        gainNode.gain.setValueAtTime(0.4, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        source.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start(time);
        source.stop(time + duration);
    }
    
    playPluckNote(instrumentData, noteIndex, duration, time) {
        // Karplus-Strong pluck synthesis
        const frequency = instrumentData.freq[noteIndex] || 440;
        const sampleRate = this.audioContext.sampleRate;
        const delayTime = 1 / frequency;
        const delayLength = Math.floor(delayTime * sampleRate);
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const delayNode = this.audioContext.createDelay(1);
        const feedbackGain = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = frequency;
        
        delayNode.delayTime.value = delayTime;
        feedbackGain.gain.value = 0.5;
        
        filterNode.type = 'lowpass';
        filterNode.frequency.value = frequency * 2;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        oscillator.connect(delayNode);
        delayNode.connect(filterNode);
        filterNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.1); // Short burst for pluck
    }
    
    play(sequence, steps = 32) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        
        this.scheduler(sequence, steps);
    }
    
    stop() {
        this.isPlaying = false;
        if (this.scheduleInterval) {
            clearTimeout(this.scheduleInterval);
        }
        this.currentStep = 0;
    }
    
    scheduler(sequence, steps) {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime && this.isPlaying) {
            this.scheduleNote(sequence, this.currentStep, this.nextNoteTime);
            this.nextNote();
        }
        
        if (this.isPlaying) {
            this.scheduleInterval = setTimeout(() => this.scheduler(sequence, steps), this.lookahead);
        }
    }
    
    scheduleNote(sequence, step, time) {
        // Play notes for each instrument at current step
        Object.keys(sequence).forEach(instrument => {
            sequence[instrument].forEach((noteIndex, rowIndex) => {
                if (noteIndex !== null && step < noteIndex.length && noteIndex[step]) {
                    this.playNote(instrument, rowIndex, 60 / this.tempo / 4, time);
                }
            });
        });
        
        // Trigger visual feedback
        this.onStepPlay?.(step);
    }
    
    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat / 4; // 16th notes
        this.currentStep = (this.currentStep + 1) % 32;
    }
    
    // Export sequence as MIDI-like data
    exportSequence(sequence) {
        const export_data = {
            tempo: this.tempo,
            instruments: {},
            totalSteps: 32
        };
        
        Object.keys(sequence).forEach(instrument => {
            export_data.instruments[instrument] = [];
            sequence[instrument].forEach((row, rowIndex) => {
                const notes = [];
                row.forEach((active, step) => {
                    if (active) {
                        notes.push({
                            step: step,
                            note: rowIndex,
                            frequency: this.instruments[instrument].freq?.[rowIndex] || 440,
                            duration: 60 / this.tempo / 4
                        });
                    }
                });
                if (notes.length > 0) {
                    export_data.instruments[instrument].push({
                        noteIndex: rowIndex,
                        notes: notes
                    });
                }
            });
        });
        
        return export_data;
    }
    
    // Generate audio buffer for download
    async generateAudioBuffer(sequence, duration = null) {
        if (!duration) {
            duration = (32 * 60 / this.tempo / 4) + 1; // Full sequence + 1 second
        }
        
        const offlineContext = new OfflineAudioContext(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const masterGain = offlineContext.createGain();
        masterGain.connect(offlineContext.destination);
        masterGain.gain.value = 0.7;
        
        // Schedule all notes in offline context
        let currentTime = 0;
        const stepDuration = 60 / this.tempo / 4;
        
        for (let step = 0; step < 32; step++) {
            Object.keys(sequence).forEach(instrument => {
                sequence[instrument].forEach((row, rowIndex) => {
                    if (row[step]) {
                        this.playNoteOffline(offlineContext, masterGain, instrument, rowIndex, stepDuration, currentTime);
                    }
                });
            });
            currentTime += stepDuration;
        }
        
        return await offlineContext.startRendering();
    }
    
    playNoteOffline(context, destination, instrument, noteIndex, duration, time) {
        const instrumentData = this.instruments[instrument];
        
        if (instrumentData.type === 'oscillator' || instrumentData.type === 'pluck') {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            const filterNode = context.createBiquadFilter();
            
            oscillator.type = instrumentData.wave || 'sine';
            oscillator.frequency.value = instrumentData.freq[noteIndex] || 440;
            
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 2000 + (noteIndex * 200);
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(destination);
            
            oscillator.start(time);
            oscillator.stop(time + duration);
        }
        // Add noise generation for offline context if needed
    }
}