// Apple Music Lab - Main Application
class AppleMusicLab {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.currentInstrument = 'piano';
        this.sequence = {};
        this.steps = 32;
        this.bars = 8;
        this.isPlaying = false;
        
        // Initialize instruments with enabled state
        this.instruments = [
            { id: 'piano', name: 'Piano', rows: 8, enabled: true },
            { id: 'drums', name: 'Drums', rows: 8, enabled: true },
            { id: 'bass', name: 'Bass', rows: 8, enabled: true },
            { id: 'synth', name: 'Synth', rows: 8, enabled: true },
            { id: 'guitar', name: 'Guitar', rows: 8, enabled: true },
            { id: 'strings', name: 'Strings', rows: 8, enabled: true },
            { id: 'brass', name: 'Brass', rows: 8, enabled: true },
            { id: 'percussion', name: 'Percussion', rows: 8, enabled: true }
        ];
        
        this.init();
    }
    
    init() {
        this.initSequence();
        this.setupUI();
        this.setupEventListeners();
        this.setupAudioEngine();
        
        // Check for dark mode preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.toggleDarkMode(true);
        }
    }
    
    initSequence() {
        this.instruments.forEach(instrument => {
            this.sequence[instrument.id] = [];
            for (let i = 0; i < instrument.rows; i++) {
                this.sequence[instrument.id][i] = new Array(this.steps).fill(false);
            }
        });
    }
    
    setupUI() {
        this.createTimeline();
        this.createInstrumentLabels();
        this.createSequencerGrid();
        this.createInstrumentButtons();
        this.updateTempoDisplay();
        this.updateBarsDisplay();
    }
    
    createTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';
        
        for (let i = 0; i < this.steps; i++) {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker' + (i % 4 === 0 ? ' beat' : '');
            marker.textContent = i % 4 === 0 ? Math.floor(i / 4) + 1 : '•';
            timeline.appendChild(marker);
        }
    }
    
    createInstrumentLabels() {
        const container = document.getElementById('instrumentLabels');
        container.innerHTML = '';
        
        this.instruments.filter(instrument => instrument.enabled).forEach(instrument => {
            for (let i = 0; i < instrument.rows; i++) {
                const label = document.createElement('div');
                label.className = 'instrument-label';
                label.textContent = `${instrument.name} ${i + 1}`;
                label.dataset.instrument = instrument.id;
                label.dataset.row = i;
                container.appendChild(label);
            }
        });
    }
    
    createSequencerGrid() {
        const container = document.getElementById('sequencerGrid');
        container.innerHTML = '';
        
        this.instruments.filter(instrument => instrument.enabled).forEach(instrument => {
            for (let rowIndex = 0; rowIndex < instrument.rows; rowIndex++) {
                const row = document.createElement('div');
                row.className = 'grid-row';
                row.dataset.instrument = instrument.id;
                row.dataset.row = rowIndex;
                
                for (let step = 0; step < this.steps; step++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.instrument = instrument.id;
                    cell.dataset.row = rowIndex;
                    cell.dataset.step = step;
                    
                    // Set active state based on sequence data
                    if (this.sequence[instrument.id] && 
                        this.sequence[instrument.id][rowIndex] && 
                        this.sequence[instrument.id][rowIndex][step]) {
                        cell.classList.add('active');
                    }
                    
                    cell.addEventListener('click', () => {
                        this.toggleCell(instrument.id, rowIndex, step);
                    });
                    
                    cell.addEventListener('mouseenter', (e) => {
                        if (e.buttons === 1) { // Left mouse button held
                            this.toggleCell(instrument.id, rowIndex, step, true);
                        }
                    });
                    
                    row.appendChild(cell);
                }
                
                container.appendChild(row);
            }
        });
    }
    
    createInstrumentButtons() {
        const container = document.getElementById('instrumentList');
        container.innerHTML = '';
        
        this.instruments.forEach(instrument => {
            const instrumentItem = document.createElement('div');
            instrumentItem.className = 'instrument-item';
            
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.className = 'instrument-toggle';
            toggle.checked = instrument.enabled;
            toggle.addEventListener('change', (e) => {
                instrument.enabled = e.target.checked;
                this.setupUI(); // Rebuild UI when instrument is toggled
                
                // If the currently selected instrument is disabled, select another
                if (!instrument.enabled && this.currentInstrument === instrument.id) {
                    const firstEnabled = this.instruments.find(i => i.enabled);
                    if (firstEnabled) {
                        this.selectInstrument(firstEnabled.id);
                    }
                }
            });
            
            const button = document.createElement('button');
            button.className = `instrument-btn ${instrument.id}`;
            button.textContent = instrument.name;
            button.dataset.instrument = instrument.id;
            
            button.addEventListener('click', () => {
                if (instrument.enabled) {
                    this.selectInstrument(instrument.id);
                }
            });
            
            instrumentItem.appendChild(toggle);
            instrumentItem.appendChild(button);
            container.appendChild(instrumentItem);
        });
        
        // Select first enabled instrument by default
        const firstEnabled = this.instruments.find(i => i.enabled);
        if (firstEnabled) {
            this.selectInstrument(firstEnabled.id);
        }
    }
    
    setupEventListeners() {
        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.togglePlayback();
        });
        
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearSequence();
        });
        
        // Controls
        const tempoSlider = document.getElementById('tempoSlider');
        tempoSlider.addEventListener('input', (e) => {
            this.setTempo(parseInt(e.target.value));
        });
        
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(parseInt(e.target.value));
        });
        
        // Bars control
        const barsSlider = document.getElementById('barsSlider');
        barsSlider.addEventListener('input', (e) => {
            this.setBars(parseInt(e.target.value));
        });
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importSequence(e.target.files[0]);
        });
        
        // Download dropdown
        document.getElementById('downloadBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDownloadMenu();
        });
        
        // Download options
        document.querySelectorAll('.download-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.downloadSequence(format);
                this.closeDownloadMenu();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeDownloadMenu();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.code === 'Escape') {
                this.stop();
            } else if (e.code === 'Delete' || e.code === 'Backspace') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.clearSequence();
                }
            }
        });
        
        // Prevent drag on grid
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('grid-cell')) {
                e.preventDefault();
            }
        });
    }
    
    setupAudioEngine() {
        this.audioEngine.onStepPlay = (step) => {
            this.highlightCurrentStep(step);
        };
    }
    
    toggleCell(instrument, row, step, force = null) {
        const isActive = force !== null ? force : !this.sequence[instrument][row][step];
        this.sequence[instrument][row][step] = isActive;
        
        const cell = document.querySelector(
            `[data-instrument="${instrument}"][data-row="${row}"][data-step="${step}"]`
        );
        
        if (cell) {
            cell.classList.toggle('active', isActive);
        }
        
        // Play preview sound
        if (isActive) {
            this.audioEngine.playNote(instrument, row, 0.2);
        }
    }
    
    selectInstrument(instrumentId) {
        this.currentInstrument = instrumentId;
        
        // Update button states
        document.querySelectorAll('.instrument-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.querySelector(`[data-instrument="${instrumentId}"]`).classList.add('selected');
    }
    
    togglePlayback() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }
    
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.updatePlayButton();
        this.audioEngine.play(this.sequence, this.steps);
    }
    
    stop() {
        this.isPlaying = false;
        this.audioEngine.stop();
        this.updatePlayButton();
        this.clearStepHighlight();
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        const icon = playBtn.querySelector('.icon');
        
        if (this.isPlaying) {
            icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            playBtn.setAttribute('aria-label', 'Pause');
        } else {
            icon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
            playBtn.setAttribute('aria-label', 'Play');
        }
    }
    
    clearSequence() {
        if (confirm('Are you sure you want to clear the entire sequence?')) {
            this.initSequence();
            
            // Update UI
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.classList.remove('active');
            });
        }
    }
    
    setTempo(bpm) {
        this.audioEngine.setTempo(bpm);
        this.updateTempoDisplay();
    }
    
    updateTempoDisplay() {
        const tempoValue = document.getElementById('tempoValue');
        const tempoSlider = document.getElementById('tempoSlider');
        tempoValue.textContent = tempoSlider.value;
    }
    
    setVolume(volume) {
        this.audioEngine.setVolume(volume);
    }
    
    setBars(bars) {
        this.bars = bars;
        this.steps = bars * 4; // 4 steps per bar
        this.updateBarsDisplay();
        this.resizeSequence();
        this.setupUI(); // Rebuild UI with new step count
    }
    
    updateBarsDisplay() {
        const barsValue = document.getElementById('barsValue');
        const barsSlider = document.getElementById('barsSlider');
        barsValue.textContent = barsSlider.value;
    }
    
    resizeSequence() {
        // Resize existing sequence data to match new step count
        this.instruments.forEach(instrument => {
            if (this.sequence[instrument.id]) {
                this.sequence[instrument.id].forEach(row => {
                    if (row.length < this.steps) {
                        // Extend with false values
                        const additionalSteps = this.steps - row.length;
                        row.push(...new Array(additionalSteps).fill(false));
                    } else if (row.length > this.steps) {
                        // Truncate
                        row.splice(this.steps);
                    }
                });
            }
        });
    }
    
    highlightCurrentStep(step) {
        // Clear previous highlights
        document.querySelectorAll('.grid-cell.playing').forEach(cell => {
            cell.classList.remove('playing');
        });
        
        // Add current step highlights
        document.querySelectorAll(`[data-step="${step}"]`).forEach(cell => {
            cell.classList.add('playing');
        });
        
        // Update timeline
        document.querySelectorAll('.timeline-marker').forEach((marker, index) => {
            marker.classList.toggle('active', index === step);
        });
    }
    
    clearStepHighlight() {
        document.querySelectorAll('.grid-cell.playing').forEach(cell => {
            cell.classList.remove('playing');
        });
        
        document.querySelectorAll('.timeline-marker.active').forEach(marker => {
            marker.classList.remove('active');
        });
    }
    
    toggleDarkMode(force = null) {
        const isDark = force !== null ? force : !document.documentElement.hasAttribute('data-theme');
        
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
        
        // Update dark mode button icon
        const darkModeBtn = document.getElementById('darkModeToggle');
        const icon = darkModeBtn.querySelector('.icon');
        
        if (isDark) {
            icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
        } else {
            icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
        }
    }
    
    toggleDownloadMenu() {
        const dropdown = document.querySelector('.download-dropdown');
        dropdown.classList.toggle('open');
    }
    
    closeDownloadMenu() {
        const dropdown = document.querySelector('.download-dropdown');
        dropdown.classList.remove('open');
    }
    
    async downloadSequence(format = 'all') {
        try {
            const timestamp = Date.now();
            
            if (format === 'json' || format === 'all') {
                const exportData = this.audioEngine.exportSequence(this.sequence, this.steps);
                // Add additional metadata
                exportData.bars = this.bars;
                exportData.enabledInstruments = this.instruments.filter(i => i.enabled).map(i => i.id);
                
                const jsonData = JSON.stringify(exportData, null, 2);
                const jsonBlob = new Blob([jsonData], { type: 'application/json' });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                
                const jsonLink = document.createElement('a');
                jsonLink.href = jsonUrl;
                jsonLink.download = `apple-music-lab-${timestamp}.json`;
                jsonLink.click();
                
                setTimeout(() => URL.revokeObjectURL(jsonUrl), 1000);
            }
            
            if (format === 'wav' || format === 'mp3' || format === 'all') {
                const audioBuffer = await this.audioEngine.generateAudioBuffer(this.sequence, this.steps);
                
                if (format === 'wav' || format === 'all') {
                    const wavBlob = this.audioBufferToWav(audioBuffer);
                    const wavUrl = URL.createObjectURL(wavBlob);
                    
                    const wavLink = document.createElement('a');
                    wavLink.href = wavUrl;
                    wavLink.download = `apple-music-lab-${timestamp}.wav`;
                    wavLink.click();
                    
                    setTimeout(() => URL.revokeObjectURL(wavUrl), 1000);
                }
                
                if (format === 'mp3') {
                    // For now, we'll download as WAV since MP3 encoding requires additional libraries
                    // In a real implementation, you'd use a library like lamejs
                    const wavBlob = this.audioBufferToWav(audioBuffer);
                    const wavUrl = URL.createObjectURL(wavBlob);
                    
                    const mp3Link = document.createElement('a');
                    mp3Link.href = wavUrl;
                    mp3Link.download = `apple-music-lab-${timestamp}.wav`; // Note: still WAV for now
                    mp3Link.click();
                    
                    setTimeout(() => URL.revokeObjectURL(wavUrl), 1000);
                    
                    // Show a note to user
                    alert('Note: MP3 export is currently saved as WAV format. MP3 encoding will be added in a future update.');
                }
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    }
    
    async importSequence(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate the imported data
            if (!data.instruments || !data.tempo) {
                throw new Error('Invalid file format');
            }
            
            // Set tempo
            this.audioEngine.setTempo(data.tempo);
            document.getElementById('tempoSlider').value = data.tempo;
            this.updateTempoDisplay();
            
            // Set bars if available
            if (data.bars) {
                this.bars = data.bars;
                this.steps = this.bars * 4;
                document.getElementById('barsSlider').value = this.bars;
                this.updateBarsDisplay();
            } else {
                // Calculate bars from totalSteps
                this.steps = data.totalSteps || 32;
                this.bars = Math.ceil(this.steps / 4);
                document.getElementById('barsSlider').value = this.bars;
                this.updateBarsDisplay();
            }
            
            // Enable/disable instruments if data is available
            if (data.enabledInstruments) {
                this.instruments.forEach(instrument => {
                    instrument.enabled = data.enabledInstruments.includes(instrument.id);
                });
            }
            
            // Clear current sequence
            this.initSequence();
            
            // Load sequence data
            Object.keys(data.instruments).forEach(instrumentId => {
                if (this.sequence[instrumentId]) {
                    data.instruments[instrumentId].forEach(noteGroup => {
                        const rowIndex = noteGroup.noteIndex;
                        if (rowIndex < this.sequence[instrumentId].length) {
                            noteGroup.notes.forEach(note => {
                                if (note.step < this.steps) {
                                    this.sequence[instrumentId][rowIndex][note.step] = true;
                                }
                            });
                        }
                    });
                }
            });
            
            // Rebuild UI
            this.setupUI();
            
            alert('Sequence imported successfully!');
            
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check the file format.');
        }
    }
    
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicLab = new AppleMusicLab();
});

// Handle audio context resume on user interaction
document.addEventListener('click', async () => {
    if (window.musicLab && window.musicLab.audioEngine.audioContext) {
        if (window.musicLab.audioEngine.audioContext.state === 'suspended') {
            await window.musicLab.audioEngine.audioContext.resume();
        }
    }
}, { once: true });