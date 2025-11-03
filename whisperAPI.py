import os
import tempfile
import time
import sys
import gc
from flask import Flask, request, jsonify
import whisperx
from werkzeug.utils import secure_filename

# --- Determine the script's directory (especially for PyInstaller) ---
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    SCRIPT_DIR = sys._MEIPASS
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Configuration for UPLOAD_FOLDER ---
TEMP_DIR_BASE = tempfile.gettempdir()
UPLOAD_FOLDER = os.path.join(TEMP_DIR_BASE, "whisperx_api_uploads")
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'opus'}

# --- Configuration ---
MODEL_SIZE = "large-v3"
DEVICE = "cpu"
COMPUTE_TYPE = "int8"
BATCH_SIZE = 16

# --- HuggingFace Token for Diarization ---
# Get your token from: https://huggingface.co/settings/tokens
# Accept terms at: https://huggingface.co/pyannote/speaker-diarization
# Accept terms at: https://huggingface.co/pyannote/segmentation
HF_AUTH_TOKEN = os.getenv('HF_TOKEN')

# --- Initialize Flask App ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# --- Load WhisperX Model ---
print(f"Loading WhisperX model: {MODEL_SIZE} (language: auto-detect) on {DEVICE} with {COMPUTE_TYPE} compute type...")
model = None
try:
    model = whisperx.load_model(
        MODEL_SIZE,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        language=None
    )
    print(f"WhisperX Model {MODEL_SIZE} (Language: auto-detect) loaded successfully.")
except Exception as e:
    print(f"Error loading WhisperX model: {e}")
    print("Please ensure you have a working internet connection for the first download,")
    print("and that the model size/type is correct and WhisperX is installed properly.")

# --- Create UPLOAD_FOLDER if it doesn't exist ---
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        print(f"Successfully created/ensured uploads folder at: {UPLOAD_FOLDER}")
    except PermissionError as e:
        print(f"Critical Error: Could not create uploads folder at '{UPLOAD_FOLDER}'. Permission denied: {e}")
    except Exception as e:
        print(f"Critical Error: Failed to create uploads folder at '{UPLOAD_FOLDER}': {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if model is None:
        return jsonify({"error": "WhisperX model is not loaded. Check server logs."}), 500

    if 'audio' not in request.files:
        return jsonify({"error": "No audio file part in the request"}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        temp_file_path = None
        audio = None

        try:
            if not os.path.exists(app.config['UPLOAD_FOLDER']):
                print(f"Upload folder {app.config['UPLOAD_FOLDER']} not found during request. Attempting to create.")
                try:
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                except Exception as e_mkdir:
                    print(f"Failed to create upload folder during request: {e_mkdir}")
                    return jsonify({"error": "Server configuration issue: cannot create upload directory."}), 500

            temp_fd, temp_file_path = tempfile.mkstemp(
                suffix=os.path.splitext(filename)[1],
                dir=app.config['UPLOAD_FOLDER']
            )

            with os.fdopen(temp_fd, 'wb') as tmp:
                file.save(tmp)

            # Get options from request form data
            use_translate = request.form.get('translate', 'false').lower() == 'true'
            use_word_timestamps = request.form.get('word_timestamps', 'true').lower() == 'true'
            use_vad = request.form.get('vad', 'false').lower() == 'true'
            use_diarization = request.form.get('diarization', 'false').lower() == 'true'

            task = "translate" if use_translate else "transcribe"

            print(f"\n{'='*60}")
            print(f"Processing: {filename}")
            print(f"Task: {task}")
            print(f"Word Timestamps: {use_word_timestamps}")
            print(f"VAD: {use_vad}")
            print(f"Diarization: {use_diarization}")
            print(f"{'='*60}")

            print(f"Loading audio for WhisperX: {temp_file_path}")
            audio = whisperx.load_audio(temp_file_path)

            # --- VAD (Voice Activity Detection) ---
            vad_info = None
            if use_vad:
                try:
                    print("Running Voice Activity Detection (VAD)...")
                    vad_start = time.time()
                    
                    vad_model = whisperx.vad.load_vad_model(DEVICE)
                    
                    vad_segments = whisperx.vad.merge_vad_segments(
                        whisperx.vad.get_speech_timestamps(
                            audio,
                            vad_model,
                            threshold=0.5,
                            min_speech_duration_ms=250,
                            min_silence_duration_ms=100
                        ),
                        threshold=0.5
                    )
                    
                    vad_duration = time.time() - vad_start
                    print(f"VAD completed in {vad_duration:.2f}s - Found {len(vad_segments)} speech segments")
                    
                    vad_info = {
                        "enabled": True,
                        "segments_found": len(vad_segments),
                        "duration": vad_duration
                    }
                    
                    del vad_model
                    gc.collect()
                    
                except Exception as vad_e:
                    print(f"VAD failed: {vad_e}. Continuing without VAD.")
                    vad_info = {"enabled": False, "error": str(vad_e)}

            # --- Transcription ---
            print(f"Transcribing with WhisperX model ({MODEL_SIZE}, Language: auto-detect, Task: {task})...")
            transcribe_start_time = time.time()
            
            result = model.transcribe(audio, batch_size=BATCH_SIZE, task=task)
            
            transcribe_duration = time.time() - transcribe_start_time

            detected_language = result.get("language")
            if not detected_language:
                print("Error: WhisperX could not detect the language of the audio.")
                return jsonify({"error": "Language detection failed."}), 500

            print(f"Initial transcription completed in {transcribe_duration:.2f}s. Detected language: {detected_language}")

            final_segments = result["segments"]
            full_text = " ".join([segment['text'].strip() for segment in final_segments if 'text' in segment])

            alignment_info = None
            
            # --- Alignment (Word-level timestamps) ---
            if use_word_timestamps:
                try:
                    print(f"Loading alignment model for detected language: {detected_language}...")
                    align_model_start_time = time.time()
                    align_model, metadata = whisperx.load_align_model(language_code=detected_language, device=DEVICE)
                    align_model_duration = time.time() - align_model_start_time
                    print(f"Alignment model for '{detected_language}' loaded in {align_model_duration:.2f}s.")

                    print("Aligning transcription...")
                    align_start_time = time.time()
                    result_aligned = whisperx.align(
                        result["segments"], 
                        align_model, 
                        metadata, 
                        audio, 
                        DEVICE, 
                        return_char_alignments=False
                    )
                    align_duration = time.time() - align_start_time
                    print(f"Alignment completed in {align_duration:.2f}s.")

                    final_segments = result_aligned["segments"]
                    full_text = " ".join([segment['text'].strip() for segment in final_segments if 'text' in segment])
                    
                    alignment_info = {
                        "enabled": True,
                        "duration": align_duration
                    }

                    del align_model, metadata
                    gc.collect()

                except Exception as align_e:
                    print(f"Could not align transcription for language '{detected_language}': {align_e}")
                    print("Proceeding with segment-level timestamps only from initial transcription.")
                    alignment_info = {
                        "enabled": False,
                        "error": str(align_e)
                    }
                    for seg in final_segments:
                        seg['words_error'] = f"Alignment failed for language {detected_language}: {str(align_e)}"
            else:
                print("Word-level timestamps disabled. Using phrase-level timestamps only.")
                alignment_info = {"enabled": False, "reason": "Disabled by user"}

            # --- Diarization (Speaker Detection) ---
            diarization_info = None
            if use_diarization:
                if HF_AUTH_TOKEN:
                    try:
                        print("Running speaker diarization...")
                        diarize_start = time.time()
                        
                        diarize_model = whisperx.DiarizationPipeline(
                            use_auth_token=HF_AUTH_TOKEN,
                            device=DEVICE
                        )
                        
                        diarize_segments = diarize_model(audio)
                        
                        result_with_speakers = whisperx.assign_word_speakers(
                            diarize_segments,
                            final_segments
                        )
                        
                        diarize_duration = time.time() - diarize_start
                        
                        speakers = set()
                        for segment in result_with_speakers:
                            if 'speaker' in segment:
                                speakers.add(segment['speaker'])
                            if 'words' in segment:
                                for word in segment['words']:
                                    if 'speaker' in word:
                                        speakers.add(word['speaker'])
                        
                        print(f"Diarization completed in {diarize_duration:.2f}s")
                        print(f"Detected {len(speakers)} unique speakers: {sorted(speakers)}")
                        
                        final_segments = result_with_speakers
                        diarization_info = {
                            "enabled": True,
                            "speakers_detected": len(speakers),
                            "speaker_labels": sorted(list(speakers)),
                            "duration": diarize_duration
                        }
                        
                        del diarize_model
                        gc.collect()
                        
                    except Exception as diarize_e:
                        print(f"Diarization failed: {diarize_e}")
                        diarization_info = {
                            "enabled": False,
                            "error": str(diarize_e)
                        }
                else:
                    print("Diarization requested but HF_AUTH_TOKEN not configured.")
                    diarization_info = {
                        "enabled": False,
                        "error": "HF_AUTH_TOKEN not configured in whisperAPI.py"
                    }
            else:
                print("Diarization disabled by user.")
                diarization_info = {"enabled": False, "reason": "Disabled by user"}

            audio_duration = 0
            if final_segments and 'end' in final_segments[-1]:
                audio_duration = final_segments[-1]['end']

            total_words = 0
            if use_word_timestamps:
                total_words = sum(len(seg.get('words', [])) for seg in final_segments)

            response_data = {
                "language": detected_language,
                "duration_seconds": audio_duration,
                "full_text": full_text.strip(),
                "segments": final_segments,
                "task": task,
                "word_timestamps": use_word_timestamps,
                "stats": {
                    "total_segments": len(final_segments),
                    "total_words": total_words,
                    "transcription_time": transcribe_duration,
                }
            }

            if vad_info:
                response_data["vad"] = vad_info
            if alignment_info:
                response_data["alignment"] = alignment_info
            if diarization_info:
                response_data["diarization"] = diarization_info

            print(f"\n{'='*60}")
            print(f"Processing complete!")
            if use_word_timestamps:
                print(f"Total words: {total_words}")
            else:
                print(f"Total segments: {len(final_segments)}")
            print(f"{'='*60}\n")

            return jsonify(response_data), 200

        except Exception as e:
            print(f"Error during WhisperX transcription or alignment: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Transcription failed: {str(e)}"}), 500
        finally:
            if audio is not None:
                del audio
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"Cleaned up temporary file: {temp_file_path}")
                except Exception as e_remove:
                    print(f"Error cleaning up temporary file {temp_file_path}: {e_remove}")
            gc.collect()
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    if model is not None:
        return jsonify({
            "status": "API is running",
            "model_loaded": True,
            "model_type": "WhisperX",
            "model_size": MODEL_SIZE,
            "language_setting": "auto-detect",
            "device": DEVICE,
            "diarization_available": HF_AUTH_TOKEN is not None
        }), 200
    else:
        return jsonify({
            "status": "API is running",
            "model_loaded": False,
            "language_setting": "auto-detect",
            "error": "WhisperX Model failed to load"
        }), 500

if __name__ == '__main__':
    if model is None:
        print("CRITICAL: WhisperX model could not be loaded. The API will not function correctly.")

    if not os.path.exists(UPLOAD_FOLDER):
        print(f"Upload folder '{UPLOAD_FOLDER}' does not exist at startup. Attempting to create it.")
        try:
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            print(f"Successfully created/ensured uploads folder: {UPLOAD_FOLDER}")
        except Exception as e:
            print(f"CRITICAL FAILURE: Could not create uploads folder '{UPLOAD_FOLDER}' at startup: {e}")

    print(f"\n{'='*60}")
    print("WhisperX API Server")
    print(f"{'='*60}")
    print(f"Server: http://127.0.0.1:5000")
    print(f"Model: {MODEL_SIZE}")
    print(f"Device: {DEVICE}")
    print(f"Diarization: {'Available' if HF_AUTH_TOKEN else 'Not configured (set HF_AUTH_TOKEN)'}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"{'='*60}\n")
    
    print("Starting Flask server on host 127.0.0.1, port 5000")
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)