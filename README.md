# Optimized WhisperX for After Effects

Enhanced version of [AE-WhisperX-Local-Transcriber](https://github.com/JavierJerezAntonetti/AE-WhisperX-Local-Transcriber) with additional features and optimizations for [Support Ukraine with Us](https://www.supportukrainewithus.com/) video editing workflow.

## New Features

### API Enhancements (`whisperAPI.py`)
- **Configurable Processing Modes**
  - Toggle word-level vs. phrase-level timestamps
  - Optional translation to English
  - Voice Activity Detection (VAD) preprocessing
  - Speaker diarization support
- **Performance Improvements**
  - Memory optimization with garbage collection
  - Request parameter configuration
  - Better error handling and logging

### After Effects Panel (`SubtitlesGeneratorWhisper.jsx`)
- **Feature Control Checkboxes**
  - Word-Level Timestamps toggle (phrase mode for cleaner subtitles)
  - Translate to English option
  - VAD toggle for better speech detection
  - Diarization toggle for speaker identification
- **Speaker Visualization**
  - Color-code text by speaker
  - Speaker labels in layer names


## Installation

See [original repository](https://github.com/JavierJerezAntonetti/AE-WhisperX-Local-Transcriber) for setup instructions. Simply replace the two main files with versions from this repository.