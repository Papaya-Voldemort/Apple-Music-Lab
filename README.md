# Apple Music Lab

Chrome Music Lab but better - an Apple-branded song maker tool with enhanced features

## Features

✨ **Core Functionality**
- Grid-based sequencer interface with 32 steps and 8 tracks per instrument
- 8 different instruments: Piano, Drums, Bass, Synth, Guitar, Strings, Brass, Percussion
- Real-time playback with adjustable tempo (60-200 BPM)
- Volume control and visual feedback

🎨 **Apple Design Language**
- Beautiful Apple-inspired interface with rounded corners and glass effects
- Dark mode support with automatic detection
- Smooth animations and transitions
- Responsive design for mobile and desktop

🎵 **Enhanced Audio**
- Web Audio API for high-quality sound synthesis
- No limitations on song length (unlike Chrome Music Lab)
- Extended sound ranges and multiple synthesis methods
- Real-time audio generation with professional quality

💾 **Export Features**
- Download songs as JSON (sequence data)
- Export audio as WAV files
- Preserve all composition data for later editing

⚡ **Performance**
- Optimized for smooth performance
- Progressive Web App ready
- GitHub Pages deployment ready

## Live Demo

[🎵 Try Apple Music Lab](https://papaya-voldemort.github.io/Apple-Music-Lab/)

## Usage

1. **Select an Instrument**: Click on any instrument button at the bottom
2. **Add Notes**: Click on grid cells to activate/deactivate notes
3. **Control Playback**: Use the play button to start/stop playback
4. **Adjust Settings**: Change tempo and volume using the sliders
5. **Switch Themes**: Toggle dark mode with the moon/sun button
6. **Download**: Export your creation using the download button

## Keyboard Shortcuts

- `Space` - Play/Pause
- `Escape` - Stop playback
- `Ctrl/Cmd + Delete` - Clear sequence

## Development

This is a pure HTML/CSS/JavaScript application that requires no build process.

### Local Development

```bash
# Clone the repository
git clone https://github.com/Papaya-Voldemort/Apple-Music-Lab.git

# Navigate to the directory
cd Apple-Music-Lab

# Start a local server
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

### Deployment

The app automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main branch.

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Audio**: Web Audio API with custom synthesis
- **Styling**: CSS Grid and Flexbox with CSS Custom Properties
- **Compatibility**: Modern browsers with Web Audio API support

## License

MIT License - Feel free to use and modify!

---

Made with ❤️ by AI • Inspired by Chrome Music Lab • Enhanced with Apple design
