if (typeof JSON !== "object") {
  JSON = {};
}

(function () {
  "use strict";

  var rx_one = /^[\],:{}\s]*$/;
  var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  var rx_three =
    /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
  var rx_escapable =
    /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var rx_dangerous =
    /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    return n < 10 ? "0" + n : n;
  }

  function this_value() {
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== "function") {
    Date.prototype.toJSON = function () {
      return isFinite(this.valueOf())
        ? this.getUTCFullYear() +
            "-" +
            f(this.getUTCMonth() + 1) +
            "-" +
            f(this.getUTCDate()) +
            "T" +
            f(this.getUTCHours()) +
            ":" +
            f(this.getUTCMinutes()) +
            ":" +
            f(this.getUTCSeconds()) +
            "Z"
        : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap;
  var indent;
  var meta;
  var rep;

  function quote(string) {
    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
      ? '"' +
          string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === "string"
              ? c
              : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
          }) +
          '"'
      : '"' + string + '"';
  }

  function str(key, holder) {
    var i;
    var k;
    var v;
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];

    if (
      value &&
      typeof value === "object" &&
      typeof value.toJSON === "function"
    ) {
      value = value.toJSON(key);
    }

    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }

    switch (typeof value) {
      case "string":
        return quote(value);

      case "number":
        return isFinite(value) ? String(value) : "null";

      case "boolean":
      case "null":
        return String(value);

      case "object":
        if (!value) {
          return "null";
        }

        gap += indent;
        partial = [];

        if (Object.prototype.toString.apply(value) === "[object Array]") {
          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          }

          v =
            partial.length === 0
              ? "[]"
              : gap
              ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
              : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }

        if (rep && typeof rep === "object") {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === "string") {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        } else {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        }

        v =
          partial.length === 0
            ? "{}"
            : gap
            ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
            : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }

  if (typeof JSON.stringify !== "function") {
    meta = {
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      '"': '\\"',
      "\\": "\\\\",
    };
    JSON.stringify = function (value, replacer, space) {
      var i;
      gap = "";
      indent = "";

      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        }
      } else if (typeof space === "string") {
        indent = space;
      }

      rep = replacer;
      if (
        replacer &&
        typeof replacer !== "function" &&
        (typeof replacer !== "object" || typeof replacer.length !== "number")
      ) {
        throw new Error("JSON.stringify");
      }

      return str("", { "": value });
    };
  }

  if (typeof JSON.parse !== "function") {
    JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
        var k;
        var v;
        var value = holder[key];
        if (value && typeof value === "object") {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }

      text = String(text);
      rx_dangerous.lastIndex = 0;
      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      if (
        rx_one.test(
          text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, "")
        )
      ) {
        j = eval("(" + text + ")");

        return typeof reviver === "function" ? walk({ "": j }, "") : j;
      }

      throw new SyntaxError("JSON.parse");
    };
  }
})();

(function createAndRunWhisperPanel(thisObj) {
  // --- Configuration ---
  var SCRIPT_VERSION = "3.0";
  var GITHUB_RAW_URL = null; //maybe add my own github raw link later
  var WHISPER_API_URL = "http://127.0.0.1:5000/transcribe";
  var SCRIPT_NAME = "AE Whisper X Local Transcriber";

  function getNewVersionMessage(remoteVersion) {
    return (
      "A new version (" +
      remoteVersion +
      ") of " +
      SCRIPT_NAME +
      " is available.\n\n" +
      "Please visit the GitHub repository to download the update."
    );
  }

  var TEMP_FOLDER_PATH;
  if (Folder.temp) {
    TEMP_FOLDER_PATH = Folder.temp.fsName;
  } else {
    TEMP_FOLDER_PATH = $.os.indexOf("Windows") > -1 ? $.getenv("TEMP") : "/tmp";
  }

  var SCRIPT_TEMP_SUBFOLDER = "AETempWhisper";
  var TEMP_RESPONSE_FILENAME = "whisper_api_response.json";
  var MAX_LAYER_NAME_WORD_LENGTH = 15;
  var RENDERED_AUDIO_SUBFOLDER = "Rendered_Audio";
  var PRECOMP_NAME = "Subtitles";

  // --- RTL Configuration ---
  var RTL_LANGUAGES = ["ar", "he", "fa", "ur", "yi", "syr", "dv"];
  var isRtlMode = false;

  // --- Speaker Colors for Diarization ---
  var SPEAKER_COLORS = {
    "SPEAKER_00": [1.0, 0.3, 0.3],    // Red
    "SPEAKER_01": [0.3, 0.6, 1.0],    // Blue
    "SPEAKER_02": [0.3, 1.0, 0.4],    // Green
    "SPEAKER_03": [1.0, 0.8, 0.2],    // Yellow
    "SPEAKER_04": [1.0, 0.5, 0.0],    // Orange
    "SPEAKER_05": [0.8, 0.3, 1.0],    // Purple
    "SPEAKER_06": [0.5, 0.5, 0.5],    // Gray
    "SPEAKER_07": [1.0, 0.4, 0.7],    // Pink
  };

  // --- Default Styling ---
  var DEFAULT_TEXT_FONT_POSTSCRIPT_NAME = "Poppins-SemiBold";
  var DEFAULT_TEXT_FONT_SIZE = 60;
  var DEFAULT_TEXT_FILL_COLOR = [1, 1, 1];
  var DEFAULT_TEXT_STROKE_COLOR = [0, 0, 0];
  var DEFAULT_TEXT_STROKE_WIDTH = 0;
  var DEFAULT_MAX_CHARS_PER_LINE = 20;
  var DEFAULT_MAX_WORDS_PER_LINE = 3;

  // --- UI Element Variables ---
  var fontNameInput, fontSizeInput;
  var isFontDropdown = false;
  var fontSearchInput;
  var availableFonts = [];
  var fillRInput, fillGInput, fillBInput;
  var strokeRInput, strokeGInput, strokeBInput;
  var strokeWidthInput;
  var maxCharsInput, maxWordsInput;
  var forceRtlCheckbox;
  var enableAnimationsCheckbox;
  var presetDropdown, savePresetBtn, deletePresetBtn;
  
  // --- NEW: Feature Checkboxes ---
  var useWordTimestampsCheckbox;
  var useTranslateCheckbox;
  var useVadCheckbox;
  var useDiarizationCheckbox;
  var colorBySpeakerCheckbox;

  // --- Settings & Preset Configuration ---
  var SETTINGS_SECTION = "WhisperTranscriberPanel";
  var PRESET_LIST_KEY = "PresetList";
  var LAST_PRESET_KEY = "LastUsedPreset";
  var PRESET_PREFIX = "Preset_";

  var sanitizeFileName = function (name) {
    return name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
  };

  var getSetting = function (key) {
    if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
      return app.settings.getSetting(SETTINGS_SECTION, key);
    }
    return null;
  };

  var saveSetting = function (key, value) {
    app.settings.saveSetting(SETTINGS_SECTION, key, value);
  };

  var deleteSetting = function (key) {
    if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
      app.settings.saveSetting(SETTINGS_SECTION, key, "");
    }
  };

  var getPresetList = function () {
    var listStr = getSetting(PRESET_LIST_KEY);
    if (listStr) {
      try {
        return JSON.parse(listStr);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  var savePresetList = function (list) {
    saveSetting(PRESET_LIST_KEY, JSON.stringify(list));
  };

  var loadPreset = function (presetName) {
    var presetStr = getSetting(PRESET_PREFIX + presetName);
    if (presetStr) {
      try {
        return JSON.parse(presetStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  var savePreset = function (presetName, settingsObj) {
    saveSetting(PRESET_PREFIX + presetName, JSON.stringify(settingsObj));
    var presetList = getPresetList();
    if (indexOfArray(presetList, presetName) === -1) {
      presetList.push(presetName);
      savePresetList(presetList);
    }
  };

  var deletePreset = function (presetName) {
    deleteSetting(PRESET_PREFIX + presetName);
    var presetList = getPresetList();
    var index = indexOfArray(presetList, presetName);
    if (index > -1) {
      presetList.splice(index, 1);
      savePresetList(presetList);
    }
  };

  var indexOfArray = function (arr, item) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) return i;
    }
    return -1;
  };

  // --- Main Transcription Function ---
  var runTranscriptionProcess = function (selectedAudioFile) {
    if (!selectedAudioFile || !selectedAudioFile.exists) {
      alert("Critical script error: Selected audio file is invalid.");
      return;
    }

    try {
      app.beginUndoGroup("Whisper Transcription & Pre-comp Subtitles");

      var comp = app.project.activeItem;
      if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition first.");
        app.endUndoGroup();
        return;
      }

      // Get Styling Values
      var currentFontName;
      if (isFontDropdown) {
        currentFontName = fontNameInput.selection
          ? fontNameInput.selection.properties.postScriptName
          : DEFAULT_TEXT_FONT_POSTSCRIPT_NAME;
      } else {
        currentFontName = fontNameInput.text || DEFAULT_TEXT_FONT_POSTSCRIPT_NAME;
      }

      var currentFontSize = parseFloat(fontSizeInput.text);
      if (isNaN(currentFontSize) || currentFontSize <= 0) {
        currentFontSize = DEFAULT_TEXT_FONT_SIZE;
        alert("Invalid Font Size. Using default: " + DEFAULT_TEXT_FONT_SIZE);
      }

      var currentFillR = parseFloat(fillRInput.text);
      var currentFillG = parseFloat(fillGInput.text);
      var currentFillB = parseFloat(fillBInput.text);
      var currentFillColor;
      if (
        isNaN(currentFillR) || isNaN(currentFillG) || isNaN(currentFillB) ||
        currentFillR < 0 || currentFillR > 1 ||
        currentFillG < 0 || currentFillG > 1 ||
        currentFillB < 0 || currentFillB > 1
      ) {
        currentFillColor = DEFAULT_TEXT_FILL_COLOR;
        alert("Invalid Fill Color. Using default.");
      } else {
        currentFillColor = [currentFillR, currentFillG, currentFillB];
      }

      var currentStrokeWidth = parseFloat(strokeWidthInput.text);
      if (isNaN(currentStrokeWidth) || currentStrokeWidth < 0) {
        currentStrokeWidth = DEFAULT_TEXT_STROKE_WIDTH;
        alert("Invalid Stroke Width. Using default: " + DEFAULT_TEXT_STROKE_WIDTH);
      }

      var currentStrokeR = parseFloat(strokeRInput.text);
      var currentStrokeG = parseFloat(strokeGInput.text);
      var currentStrokeB = parseFloat(strokeBInput.text);
      var currentStrokeColor;
      if (
        isNaN(currentStrokeR) || isNaN(currentStrokeG) || isNaN(currentStrokeB) ||
        currentStrokeR < 0 || currentStrokeR > 1 ||
        currentStrokeG < 0 || currentStrokeG > 1 ||
        currentStrokeB < 0 || currentStrokeB > 1
      ) {
        currentStrokeColor = DEFAULT_TEXT_STROKE_COLOR;
        if (currentStrokeWidth > 0) {
          alert("Invalid Stroke Color. Using default.");
        }
      } else {
        currentStrokeColor = [currentStrokeR, currentStrokeG, currentStrokeB];
      }

      var scriptTempFolder = new Folder(TEMP_FOLDER_PATH + "/" + SCRIPT_TEMP_SUBFOLDER);
      if (!scriptTempFolder.exists) {
        if (!scriptTempFolder.create()) {
          alert("Error: Could not create temporary folder at: " + scriptTempFolder.fsName);
          app.endUndoGroup();
          return;
        }
      }

      var audioFile = selectedAudioFile;
      var responseFilePath = scriptTempFolder.fsName + "/" + TEMP_RESPONSE_FILENAME;
      var responseFile = new File(responseFilePath);
      if (responseFile.exists) responseFile.remove();

      // Build curl command with feature flags
      var curlCommand;
      var audioPathForCurl = audioFile.fsName.replace(/\\/g, "/");
      var responsePathForCurl = responseFile.fsName.replace(/\\/g, "/");
      
      // Add feature parameters
      var useWordTimestamps = useWordTimestampsCheckbox.value ? "true" : "false";
      var useTranslate = useTranslateCheckbox.value ? "true" : "false";
      var useVad = useVadCheckbox.value ? "true" : "false";
      var useDiarization = useDiarizationCheckbox.value ? "true" : "false";
      
      curlCommand =
        'curl -s -S -X POST ' +
        '-F "audio=@\\"' + audioPathForCurl + '\\"" ' +
        '-F "word_timestamps=' + useWordTimestamps + '" ' +
        '-F "translate=' + useTranslate + '" ' +
        '-F "vad=' + useVad + '" ' +
        '-F "diarization=' + useDiarization + '" ' +
        '"' + WHISPER_API_URL + '" -o "' + responsePathForCurl + '"';

      var systemCallResult = "";
      try {
        if ($.os.indexOf("Windows") > -1) {
          systemCallResult = system.callSystem('cmd.exe /c "' + curlCommand + '"');
        } else {
          systemCallResult = system.callSystem(curlCommand);
        }
      } catch (e_curl_exec) {
        alert(
          "Error calling curl: " + e_curl_exec.toString() +
          "\nEnsure curl is installed and in your PATH.\nCommand: " + curlCommand
        );
        app.endUndoGroup();
        return;
      }

      if (!responseFile.exists || responseFile.length === 0) {
        var errorMsg = "API call failed or produced no response.\n";
        errorMsg += "Check if Python API is running at " + WHISPER_API_URL;
        alert(errorMsg);
        app.endUndoGroup();
        return;
      }

      // Parse JSON Response
      var transcriptionData;
      var responseContent = "";
      try {
        responseFile.open("r");
        responseContent = responseFile.read();
        responseFile.close();

        if (responseContent.length > 0 && responseContent.charAt(0) === "<") {
          throw new Error("Received HTML instead of JSON. Check API server logs.");
        }
        transcriptionData = JSON.parse(responseContent);
      } catch (e_json) {
        alert(
          "Error parsing API response: " + e_json.toString() +
          "\nResponse: " + responseContent.substring(0, 500)
        );
        if (responseFile.exists) responseFile.remove();
        app.endUndoGroup();
        return;
      }

      // Check for API errors
      if (transcriptionData.error) {
        alert("API Error: " + transcriptionData.error);
        if (responseFile.exists) responseFile.remove();
        app.endUndoGroup();
        return;
      }

      // RTL Detection
      isRtlMode = forceRtlCheckbox.value;
      if (
        !isRtlMode &&
        transcriptionData &&
        transcriptionData.language &&
        indexOfArray(RTL_LANGUAGES, transcriptionData.language) > -1
      ) {
        isRtlMode = true;
        forceRtlCheckbox.value = true;
      }

      var createdTextLayers = [];
      var useColorBySpeaker = colorBySpeakerCheckbox.value;
      
      if (transcriptionData && transcriptionData.segments && transcriptionData.segments.length > 0) {
        var totalItemsCreated = 0;
        var segmentsWithIssues = 0;
        var frameDuration = comp.frameDuration;
        var timeOffset = 0;

        if (frameDuration <= 0) {
          alert("Error: Invalid composition frame duration.");
        } else {
          timeOffset = 3 * frameDuration;
        }

        // Check if we're using word-level or phrase-level timestamps
        var usingWordLevel = transcriptionData.word_timestamps === true;

        if (usingWordLevel) {
          // WORD-LEVEL PROCESSING (original behavior)
          for (var i = 0; i < transcriptionData.segments.length; i++) {
            var segment = transcriptionData.segments[i];
            if (segment.words_error || !segment.words || segment.words.length === 0) {
              segmentsWithIssues++;
              continue;
            }

            for (var j = 0; j < segment.words.length; j++) {
              var wordData = segment.words[j];
              var wordText = "";
              if (wordData && typeof wordData.word !== "undefined" && wordData.word !== null) {
                wordText = String(wordData.word);
              }

              if (wordText.slice(-1) === ".") {
                wordText = wordText.slice(0, -1);
              }

              var originalApiStartTime = parseFloat(wordData.start);
              var originalApiEndTime = parseFloat(wordData.end);

              if (
                wordText &&
                !isNaN(originalApiStartTime) &&
                !isNaN(originalApiEndTime) &&
                originalApiEndTime > originalApiStartTime
              ) {
                var adjustedStartTime = originalApiStartTime - timeOffset;
                if (adjustedStartTime < 0) adjustedStartTime = 0;
                var adjustedOriginalEndTime = originalApiEndTime - timeOffset;

                var textLayer = comp.layers.addText(wordText);
                
                // Add speaker prefix to layer name if available
                var speakerPrefix = "";
                if (wordData.speaker) {
                  speakerPrefix = wordData.speaker.replace("SPEAKER_", "S") + "_";
                }
                
                var safeWordText = wordText
                  .replace(/[^a-zA-Z0-9_]/g, "")
                  .substring(0, MAX_LAYER_NAME_WORD_LENGTH);
                textLayer.name = speakerPrefix + "W_" + i + "_" + j + "_" + safeWordText;
                
                textLayer.inPoint = adjustedStartTime;

                var determinedOutPoint = adjustedOriginalEndTime;

                if (j < segment.words.length - 1) {
                  var nextWordInSegmentData = segment.words[j + 1];
                  if (nextWordInSegmentData && typeof nextWordInSegmentData.start !== "undefined") {
                    var nextWordOriginalApiStartTime = parseFloat(nextWordInSegmentData.start);
                    if (!isNaN(nextWordOriginalApiStartTime)) {
                      var nextWordAdjustedStartTime = nextWordOriginalApiStartTime - timeOffset;
                      if (nextWordAdjustedStartTime > adjustedStartTime) {
                        determinedOutPoint = nextWordAdjustedStartTime;
                      }
                    }
                  }
                } else if (i < transcriptionData.segments.length - 1) {
                  var nextSegmentData = transcriptionData.segments[i + 1];
                  if (nextSegmentData && nextSegmentData.words && nextSegmentData.words.length > 0) {
                    var firstWordInNextSegmentData = nextSegmentData.words[0];
                    if (firstWordInNextSegmentData && typeof firstWordInNextSegmentData.start !== "undefined") {
                      var nextSegmentFirstWordOriginalApiStartTime = parseFloat(firstWordInNextSegmentData.start);
                      if (!isNaN(nextSegmentFirstWordOriginalApiStartTime)) {
                        var nextSegmentFirstWordAdjustedStartTime = nextSegmentFirstWordOriginalApiStartTime - timeOffset;
                        if (nextSegmentFirstWordAdjustedStartTime > adjustedStartTime) {
                          determinedOutPoint = nextSegmentFirstWordAdjustedStartTime;
                        }
                      }
                    }
                  }
                }
                
                textLayer.outPoint = determinedOutPoint;

                if (textLayer.outPoint <= textLayer.inPoint) {
                  if (frameDuration > 0) {
                    textLayer.outPoint = textLayer.inPoint + frameDuration;
                  } else {
                    textLayer.outPoint = textLayer.inPoint + 0.04;
                  }
                }

                var textProp = textLayer.property("Source Text");
                if (textProp && textProp.numKeys === 0) {
                  var textDocument = textProp.value;
                  textDocument.font = currentFontName;
                  textDocument.fontSize = currentFontSize;
                  
                  // Determine fill color (speaker-based or default)
                  var layerFillColor = currentFillColor;
                  if (useColorBySpeaker && wordData.speaker && SPEAKER_COLORS[wordData.speaker]) {
                    layerFillColor = SPEAKER_COLORS[wordData.speaker];
                  }
                  textDocument.fillColor = layerFillColor;
                  
                  textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
                  
                  try {
                    textDocument.tracking = -55;
                  } catch (e_tracking_set) {}
                  
                  try {
                    if (typeof FontCapsOption !== "undefined" && typeof textDocument.fontCapsOption !== "undefined") {
                      textDocument.fontCapsOption = FontCapsOption.FONT_NORMAL_CAPS;
                    } else {
                      if (typeof textDocument.allCaps !== "undefined") {
                        textDocument.allCaps = false;
                      }
                      if (typeof textDocument.smallCaps !== "undefined") {
                        textDocument.smallCaps = false;
                      }
                    }
                  } catch (e_fontcaps) {}
                  
                  if (currentStrokeWidth > 0) {
                    textDocument.applyStroke = true;
                    textDocument.strokeColor = currentStrokeColor;
                    textDocument.strokeWidth = currentStrokeWidth;
                    textDocument.strokeOverFill = false;
                    textDocument.lineJoinType = LineJoinType.LINE_JOIN_ROUND;
                  } else {
                    textDocument.applyStroke = false;
                  }
                  textProp.setValue(textDocument);
                }

                try {
                  var textLayerMoreOptions = textLayer.property("Text").property("More Options");
                  if (textLayerMoreOptions) {
                    textLayerMoreOptions.property("Fill & Stroke").setValue(2);
                  }
                } catch (e_render_order) {}

                try {
                  var rect = textLayer.sourceRectAtTime(adjustedStartTime, false);
                  if (rect && rect.width > 0 && rect.height > 0) {
                    var newAnchorX = rect.left + rect.width / 2;
                    var newAnchorY = 0;
                    textLayer.property("Transform").property("Anchor Point").setValue([newAnchorX, newAnchorY]);
                  }
                } catch (e_anchor) {}
                
                var positionProp = textLayer.property("Transform").property("Position");
                positionProp.setValue([comp.width / 2, comp.height / 2]);

                if (frameDuration > 0 && enableAnimationsCheckbox && enableAnimationsCheckbox.value) {
                  var scaleProp = textLayer.property("Transform").property("Scale");
                  var keyTime1 = adjustedStartTime;
                  var keyTime2 = adjustedStartTime + 2 * frameDuration;
                  var keyTime3 = adjustedStartTime + 4 * frameDuration;

                  scaleProp.setValueAtTime(keyTime1, [95, 95]);
                  if (keyTime2 < textLayer.outPoint) {
                    scaleProp.setValueAtTime(keyTime2, [105, 105]);
                    if (keyTime3 < textLayer.outPoint) {
                      scaleProp.setValueAtTime(keyTime3, [100, 100]);
                    } else {
                      scaleProp.setValueAtTime(textLayer.outPoint, [100, 100]);
                    }
                  } else {
                    scaleProp.setValueAtTime(textLayer.outPoint, [100, 100]);
                  }
                }
                
                totalItemsCreated++;
                createdTextLayers.push(textLayer);
              }
            }
          }
        } else {
          // PHRASE-LEVEL PROCESSING (segment timestamps only)
          for (var i = 0; i < transcriptionData.segments.length; i++) {
            var segment = transcriptionData.segments[i];
            
            if (!segment.text || segment.text === "") {
              continue;
            }

            var segmentText = segment.text.trim();
            var segmentStartTime = parseFloat(segment.start);
            var segmentEndTime = parseFloat(segment.end);

            if (isNaN(segmentStartTime) || isNaN(segmentEndTime) || segmentEndTime <= segmentStartTime) {
              segmentsWithIssues++;
              continue;
            }

            var adjustedStartTime = segmentStartTime - timeOffset;
            if (adjustedStartTime < 0) adjustedStartTime = 0;
            var adjustedEndTime = segmentEndTime - timeOffset;

            var textLayer = comp.layers.addText(segmentText);
            
            // Add speaker prefix if available
            var speakerPrefix = "";
            if (segment.speaker) {
              speakerPrefix = segment.speaker.replace("SPEAKER_", "S") + "_";
            }
            
            var safeSegmentText = segmentText
              .replace(/[^a-zA-Z0-9_]/g, "")
              .substring(0, MAX_LAYER_NAME_WORD_LENGTH);
            textLayer.name = speakerPrefix + "Phrase_" + i + "_" + safeSegmentText;
            
            textLayer.inPoint = adjustedStartTime;
            textLayer.outPoint = adjustedEndTime;

            if (textLayer.outPoint <= textLayer.inPoint) {
              if (frameDuration > 0) {
                textLayer.outPoint = textLayer.inPoint + frameDuration;
              } else {
                textLayer.outPoint = textLayer.inPoint + 0.04;
              }
            }

            var textProp = textLayer.property("Source Text");
            if (textProp && textProp.numKeys === 0) {
              var textDocument = textProp.value;
              textDocument.font = currentFontName;
              textDocument.fontSize = currentFontSize;
              
              // Determine fill color (speaker-based or default)
              var layerFillColor = currentFillColor;
              if (useColorBySpeaker && segment.speaker && SPEAKER_COLORS[segment.speaker]) {
                layerFillColor = SPEAKER_COLORS[segment.speaker];
              }
              textDocument.fillColor = layerFillColor;
              
              textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
              
              try {
                textDocument.tracking = -55;
              } catch (e_tracking_set) {}
              
              try {
                if (typeof FontCapsOption !== "undefined" && typeof textDocument.fontCapsOption !== "undefined") {
                  textDocument.fontCapsOption = FontCapsOption.FONT_NORMAL_CAPS;
                } else {
                  if (typeof textDocument.allCaps !== "undefined") {
                    textDocument.allCaps = false;
                  }
                  if (typeof textDocument.smallCaps !== "undefined") {
                    textDocument.smallCaps = false;
                  }
                }
              } catch (e_fontcaps) {}
              
              if (currentStrokeWidth > 0) {
                textDocument.applyStroke = true;
                textDocument.strokeColor = currentStrokeColor;
                textDocument.strokeWidth = currentStrokeWidth;
                textDocument.strokeOverFill = false;
                textDocument.lineJoinType = LineJoinType.LINE_JOIN_ROUND;
              } else {
                textDocument.applyStroke = false;
              }
              textProp.setValue(textDocument);
            }

            try {
              var textLayerMoreOptions = textLayer.property("Text").property("More Options");
              if (textLayerMoreOptions) {
                textLayerMoreOptions.property("Fill & Stroke").setValue(2);
              }
            } catch (e_render_order) {}

            try {
              var rect = textLayer.sourceRectAtTime(adjustedStartTime, false);
              if (rect && rect.width > 0 && rect.height > 0) {
                var newAnchorX = rect.left + rect.width / 2;
                var newAnchorY = rect.top + rect.height / 2;
                textLayer.property("Transform").property("Anchor Point").setValue([newAnchorX, newAnchorY]);
              }
            } catch (e_anchor) {}
            
            var positionProp = textLayer.property("Transform").property("Position");
            positionProp.setValue([comp.width / 2, comp.height / 2]);

            if (frameDuration > 0 && enableAnimationsCheckbox && enableAnimationsCheckbox.value) {
              var scaleProp = textLayer.property("Transform").property("Scale");
              var keyTime1 = adjustedStartTime;
              var keyTime2 = adjustedStartTime + 2 * frameDuration;
              var keyTime3 = adjustedStartTime + 4 * frameDuration;

              scaleProp.setValueAtTime(keyTime1, [95, 95]);
              if (keyTime2 < textLayer.outPoint) {
                scaleProp.setValueAtTime(keyTime2, [105, 105]);
                if (keyTime3 < textLayer.outPoint) {
                  scaleProp.setValueAtTime(keyTime3, [100, 100]);
                } else {
                  scaleProp.setValueAtTime(textLayer.outPoint, [100, 100]);
                }
              } else {
                scaleProp.setValueAtTime(textLayer.outPoint, [100, 100]);
              }
            }
            
            totalItemsCreated++;
            createdTextLayers.push(textLayer);
          }
        }

        var itemType = usingWordLevel ? "word" : "phrase";
        var finalMessage = "Transcription complete! " + totalItemsCreated + " styled " + itemType + " layers created.";
        
        if (segmentsWithIssues > 0) {
          finalMessage += "\n(" + segmentsWithIssues + " segments had issues and were skipped.)";
        }

        if (createdTextLayers.length > 0) {
          var layerIndices = [];
          for (var k = 0; k < createdTextLayers.length; k++) {
            layerIndices.push(createdTextLayers[k].index);
          }
          if (layerIndices.length > 0) {
            try {
              var subtitlePrecompLayer = comp.layers.precompose(
                layerIndices,
                PRECOMP_NAME,
                true
              );
              if (!subtitlePrecompLayer) {
                alert("Failed to pre-compose the subtitle layers.");
              }
            } catch (e_precomp) {
              alert("Error during pre-composition: " + e_precomp.toString());
            }
          }
        }
      } else if (transcriptionData && transcriptionData.full_text) {
        var fullTextLayer = comp.layers.addText(transcriptionData.full_text);
        fullTextLayer.name = "Full Transcription (No Segments)";
        fullTextLayer.inPoint = 0;
        fullTextLayer.outPoint = comp.duration > 0 ? comp.duration : 10;
      } else {
        var noDataMsg = "API returned a response, but no valid segments or words found.\n";
        if (transcriptionData && transcriptionData.error) {
          noDataMsg += "API Error: " + transcriptionData.error;
        } else if (transcriptionData && typeof transcriptionData.full_text !== "undefined" && transcriptionData.full_text === "") {
          noDataMsg += "The transcribed text was empty.";
        } else {
          noDataMsg += "Response: " + responseContent.substring(0, 500);
        }
        alert(noDataMsg);
      }

      try {
        if (responseFile.exists) responseFile.remove();
      } catch (e_cleanup) {}
      
      app.endUndoGroup();
    } catch (e_main) {
      alert(
        "A critical error occurred in runTranscriptionProcess: \n" +
        e_main.toString() +
        "\nAt line: " + e_main.line
      );
      try {
        app.endUndoGroup();
      } catch (e_undo) {}
    }
  };

  // --- Function to Render Active Comp Audio ---
  var renderActiveCompAudio = function () {
    app.beginUndoGroup("Render Comp Audio");
    try {
      var proj = app.project;
      if (!proj) {
        alert("Please open a project first.");
        app.endUndoGroup();
        return;
      }
      if (!proj.file) {
        alert("Please save your project first.");
        app.endUndoGroup();
        return;
      }

      var comp = proj.activeItem;
      if (!(comp instanceof CompItem)) {
        alert("Please select an active composition to render.");
        app.endUndoGroup();
        return;
      }

      var projectPath = proj.file.path;
      var audioOutputFolder = new Folder(projectPath + "/" + RENDERED_AUDIO_SUBFOLDER);
      if (!audioOutputFolder.exists) {
        if (!audioOutputFolder.create()) {
          alert("Error: Could not create audio output folder at: " + audioOutputFolder.fsName);
          app.endUndoGroup();
          return;
        }
      }

      var sanitizedCompName = sanitizeFileName(comp.name);
      var outputFileName = sanitizedCompName + "_audio.wav";
      var outputFilePath = audioOutputFolder.fsName + "/" + outputFileName;
      var outputFile = new File(outputFilePath);

      var rqItem = proj.renderQueue.items.add(comp);
      if (!rqItem) {
        alert("Failed to add composition to the render queue.");
        app.endUndoGroup();
        return;
      }

      var om = rqItem.outputModule(1);
      if (!om) {
        alert("Failed to access output module.");
        if (rqItem.status !== RQItemStatus.USER_WATCHED && rqItem.status !== RQItemStatus.RENDERING && rqItem.status !== RQItemStatus.DONE) {
          try { rqItem.remove(); } catch (e) {}
        }
        app.endUndoGroup();
        return;
      }

      var audioTemplateFound = false;
      var templates = om.templates;
      var audioTemplates = ["WAV Audio Only", "Wave", "WAV", "MP3 Audio Only", "MP3"];

      for (var i = 0; i < audioTemplates.length; i++) {
        if (indexOfArray(templates, audioTemplates[i]) !== -1) {
          try {
            om.applyTemplate(audioTemplates[i]);
            audioTemplateFound = true;
            om.file = outputFile;
            break;
          } catch (e) {}
        }
      }

      if (!audioTemplateFound) {
        try {
          om.applyTemplate("WAV Audio Only");
          om.file = outputFile;
        } catch (e_wav_template) {
          om.file = outputFile;
        }
      }

      app.endUndoGroup();
      try {
        proj.renderQueue.render();
      } catch (e_render) {
        alert("Error during audio rendering: " + e_render.toString());
      }
    } catch (e_render_main) {
      alert("A critical error occurred in renderActiveCompAudio: \n" + e_render_main.toString());
      app.endUndoGroup();
    }
  };

  // --- Function to Arrange Selected Text Layers Side-by-Side ---
  var arrangeWordsSideBySide = function () {
    app.beginUndoGroup("Arrange Words in Paragraph");
    try {
      var comp = app.project.activeItem;
      if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition first.");
        return;
      }

      var selectedLayers = comp.selectedLayers;
      var textLayers = [];
      for (var i = 0; i < selectedLayers.length; i++) {
        if (selectedLayers[i] instanceof TextLayer) {
          textLayers.push(selectedLayers[i]);
        }
      }

      if (textLayers.length < 1) {
        alert("Please select at least one text layer to arrange.");
        return;
      }

      var maxChars = parseInt(maxCharsInput.text, 10);
      if (isNaN(maxChars) || maxChars <= 0) {
        maxChars = DEFAULT_MAX_CHARS_PER_LINE;
        alert("Invalid Max Characters Per Line. Using default: " + maxChars);
      }

      var maxWords = parseInt(maxWordsInput.text, 10);
      if (isNaN(maxWords) || maxWords <= 0) {
        maxWords = DEFAULT_MAX_WORDS_PER_LINE;
        alert("Invalid Max Words Per Line. Using default: " + maxWords);
      }

      var useRtl = forceRtlCheckbox.value;

      textLayers.sort(function (a, b) {
        return a.inPoint - b.inPoint;
      });

      var latestOutPoint = 0;
      for (var i = 0; i < textLayers.length; i++) {
        if (textLayers[i].outPoint > latestOutPoint) {
          latestOutPoint = textLayers[i].outPoint;
        }
      }

      var lines = [];
      var currentLine = [];
      var currentLineWordCount = 0;
      var currentLineCharCount = 0;

      for (var i = 0; i < textLayers.length; i++) {
        var layer = textLayers[i];
        var word = layer.property("Source Text").value.text;
        if (word === "") continue;

        var wouldExceedLimits =
          currentLineWordCount > 0 &&
          (currentLineWordCount + 1 > maxWords ||
            currentLineCharCount + 1 + word.length > maxChars);

        if (wouldExceedLimits) {
          lines.push(currentLine);
          currentLine = [layer];
          currentLineWordCount = 1;
          currentLineCharCount = word.length;
        } else {
          currentLine.push(layer);
          currentLineWordCount++;
          currentLineCharCount += (currentLineCharCount > 0 ? 1 : 0) + word.length;
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      var firstLayer = textLayers[0];
      var textProp = firstLayer.property("Source Text");
      var textDoc = textProp.value;
      var lineHeight = textDoc.fontSize * 1.05;

      var startY = firstLayer.property("Transform").property("Position").value[1];

      for (var i = 0; i < lines.length; i++) {
        var lineLayers = lines[i];
        var totalLineWidth = 0;
        var spaceWidth = 0;

        for (var j = 0; j < lineLayers.length; j++) {
          var currentLayer = lineLayers[j];
          var rect = currentLayer.sourceRectAtTime(currentLayer.inPoint + 0.001, false);
          totalLineWidth += rect.width;
          if (j < lineLayers.length - 1) {
            var currentTextProp = currentLayer.property("Source Text");
            var currentTextDoc = currentTextProp.value;
            spaceWidth = currentTextDoc.fontSize / 4;
            totalLineWidth += spaceWidth;
          }
        }

        var currentX = useRtl
          ? comp.width / 2 + totalLineWidth / 2
          : comp.width / 2 - totalLineWidth / 2;
        var currentY = startY + i * lineHeight;

        for (var j = 0; j < lineLayers.length; j++) {
          var layer = lineLayers[j];
          var rect = layer.sourceRectAtTime(layer.inPoint + 0.001, false);

          var newX = useRtl ? currentX - rect.width / 2 : currentX + rect.width / 2;
          var positionProp = layer.property("Transform").property("Position");

          if (positionProp.dimensionsSeparated) {
            positionProp.setValue([newX, currentY, positionProp.value[2] || 0]);
          } else {
            positionProp.setValue([newX, currentY]);
          }

          layer.outPoint = latestOutPoint;

          var layerTextProp = layer.property("Source Text");
          var layerTextDoc = layerTextProp.value;
          spaceWidth = layerTextDoc.fontSize / 4;
          currentX += useRtl ? -(rect.width + spaceWidth) : rect.width + spaceWidth;
        }
      }
    } catch (e) {
      alert("Error arranging text layers: " + e.toString() + "\nLine: " + e.line);
    } finally {
      app.endUndoGroup();
    }
  };

  // --- Function to Combine Selected Text Layers ---
  var combineSelectedTextLayers = function () {
    app.beginUndoGroup("Combine Text Layers");
    try {
      var comp = app.project.activeItem;
      if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition first.");
        app.endUndoGroup();
        return;
      }

      var selectedLayers = comp.selectedLayers;
      var textLayers = [];
      for (var i = 0; i < selectedLayers.length; i++) {
        if (selectedLayers[i] instanceof TextLayer) {
          textLayers.push(selectedLayers[i]);
        }
      }

      if (textLayers.length < 2) {
        alert("Please select at least two text layers to combine.");
        app.endUndoGroup();
        return;
      }

      textLayers.sort(function (a, b) {
        return a.inPoint - b.inPoint;
      });

      var targetLayer = textLayers[0];
      var otherLayers = textLayers.slice(1);

      var maxChars = parseInt(maxCharsInput.text, 10);
      if (isNaN(maxChars) || maxChars <= 0) {
        maxChars = DEFAULT_MAX_CHARS_PER_LINE;
        alert("Invalid Max Characters Per Line. Using default: " + maxChars);
      }

      var maxWords = parseInt(maxWordsInput.text, 10);
      if (isNaN(maxWords) || maxWords <= 0) {
        maxWords = DEFAULT_MAX_WORDS_PER_LINE;
        alert("Invalid Max Words Per Line. Using default: " + maxWords);
      }

      var combinedTextContent = "";
      var currentLine = "";
      var currentLineWordCount = 0;
      var lastLayerOutPoint = textLayers[textLayers.length - 1].outPoint;

      for (var i = 0; i < textLayers.length; i++) {
        var layerText = textLayers[i].property("Source Text").value.text;
        if (layerText === "") continue;

        var wordsInLayer = layerText.split(/\s+/);

        for (var j = 0; j < wordsInLayer.length; j++) {
          var word = wordsInLayer[j];
          if (word === "") continue;

          if (currentLineWordCount > 0) {
            if (
              currentLineWordCount >= maxWords ||
              currentLine.length + 1 + word.length > maxChars
            ) {
              combinedTextContent += currentLine + "\r";
              currentLine = word;
              currentLineWordCount = 1;
            } else {
              currentLine += " " + word;
              currentLineWordCount++;
            }
          } else {
            currentLine = word;
            currentLineWordCount = 1;
          }
        }
      }
      if (currentLine !== "") {
        combinedTextContent += currentLine;
      }

      if (combinedTextContent === "") {
        alert("No text content found in selected layers to combine.");
        app.endUndoGroup();
        return;
      }

      targetLayer.name = "Combined Text";
      targetLayer.outPoint = lastLayerOutPoint;

      var textProp = targetLayer.property("Source Text");
      var textDoc = textProp.value;
      textDoc.text = combinedTextContent;
      textProp.setValue(textDoc);

      try {
        var rect = targetLayer.sourceRectAtTime(targetLayer.inPoint + 0.001, false);
        if (rect && rect.width > 0 && rect.height > 0) {
          var newAnchorX = rect.left + rect.width / 2;
          var newAnchorY = rect.top + rect.height / 2;
          targetLayer.property("Transform").property("Anchor Point").setValue([newAnchorX, newAnchorY]);
        }
      } catch (e_anchor) {}
      
      targetLayer.property("Transform").property("Position").setValue([comp.width / 2, comp.height / 2]);

      for (var k = otherLayers.length - 1; k >= 0; k--) {
        otherLayers[k].remove();
      }
    } catch (e) {
      alert("Error combining text layers: " + e.toString() + "\nLine: " + e.line);
    } finally {
      app.endUndoGroup();
    }
  };

  // --- Function to check for script updates ---
  var checkForUpdates = function () {
    if (GITHUB_RAW_URL.indexOf("YOUR_USERNAME") > -1) {
      return;
    }

    var tempFile = new File(Folder.temp.fsName + "/ae_script_update_check.jsx");

    try {
      var curlCommand;
      var tempFilePathForCurl = tempFile.fsName.replace(/\\/g, "/");

      curlCommand = 'curl -s -L "' + GITHUB_RAW_URL + '" -o "' + tempFilePathForCurl + '"';

      if ($.os.indexOf("Windows") > -1) {
        system.callSystem('cmd.exe /c "' + curlCommand + '"');
      } else {
        system.callSystem(curlCommand);
      }

      if (tempFile.exists && tempFile.length > 0) {
        tempFile.open("r");
        var remoteContent = tempFile.read();
        tempFile.close();
        tempFile.remove();

        var versionRegex = /var\s+SCRIPT_VERSION\s*=\s*["']([^"']+)["']/;
        var match = remoteContent.match(versionRegex);

        if (match && match[1]) {
          var remoteVersion = match[1];
          if (remoteVersion !== SCRIPT_VERSION) {
            alert(getNewVersionMessage(remoteVersion));
          }
        }
      }
    } catch (e) {
    } finally {
      if (tempFile.exists) {
        try {
          tempFile.remove();
        } catch (e_remove) {}
      }
    }
  };

  var win;
  var buildUI = function (uiTargetObj) {
    win =
      uiTargetObj instanceof Panel
        ? uiTargetObj
        : new Window(
            "palette",
            "Whisper Transcriber & Audio Tools",
            undefined,
            { resizeable: true, closeButton: true }
          );

    if (win === null) {
      alert("Failed to create UI window or panel.");
      return null;
    }

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 6;
    win.margins = 8;

    // --- Preset Panel ---
    var presetPanel = win.add("panel", undefined, "Presets");
    presetPanel.orientation = "row";
    presetPanel.alignChildren = ["left", "center"];
    presetPanel.spacing = 6;
    presetPanel.margins = 6;

    presetDropdown = presetPanel.add("dropdownlist", undefined, []);
    presetDropdown.size = [180, 25];
    presetDropdown.helpTip = "Select a saved settings preset.";

    savePresetBtn = presetPanel.add("button", undefined, "Save");
    savePresetBtn.size = [60, 25];
    savePresetBtn.helpTip = "Save the current settings as a new preset.";

    deletePresetBtn = presetPanel.add("button", undefined, "Delete");
    deletePresetBtn.size = [60, 25];
    deletePresetBtn.helpTip = "Delete the selected preset.";

    win.add("statictext", undefined, "1. Render Audio (Optional):").alignment = "left";
    var renderAudioBtn = win.add("button", undefined, "Render Active Comp Audio (WAV)");
    renderAudioBtn.helpTip = "Renders audio from the current active composition.";
    renderAudioBtn.onClick = function () {
      renderActiveCompAudio();
    };

    win.add("panel");

    win.add("statictext", undefined, "2. Transcription Options:").alignment = "left";
    
    // --- NEW: Feature Checkboxes Panel ---
    var featuresPanel = win.add("panel", undefined, "API Features");
    featuresPanel.orientation = "column";
    featuresPanel.alignChildren = "left";
    featuresPanel.spacing = 4;
    featuresPanel.margins = 6;

    useWordTimestampsCheckbox = featuresPanel.add("checkbox", undefined, "Word-Level Timestamps");
    useWordTimestampsCheckbox.value = true;
    useWordTimestampsCheckbox.helpTip = "Create individual layers per word. If unchecked, creates layers per phrase/sentence.";

    useTranslateCheckbox = featuresPanel.add("checkbox", undefined, "Translate to English");
    useTranslateCheckbox.value = false;
    useTranslateCheckbox.helpTip = "Translates audio to English. If unchecked, transcribes in original language.";

    useVadCheckbox = featuresPanel.add("checkbox", undefined, "Use VAD (Voice Activity Detection)");
    useVadCheckbox.value = false;
    useVadCheckbox.helpTip = "Detects speech regions for better accuracy. May increase processing time.";

    useDiarizationCheckbox = featuresPanel.add("checkbox", undefined, "Use Diarization (Speaker Detection)");
    useDiarizationCheckbox.value = false;
    useDiarizationCheckbox.helpTip = "Identifies different speakers. Requires HuggingFace token in API. Adds significant processing time.";

    colorBySpeakerCheckbox = featuresPanel.add("checkbox", undefined, "Color Text by Speaker");
    colorBySpeakerCheckbox.value = false;
    colorBySpeakerCheckbox.helpTip = "When diarization is enabled, each speaker gets a different color.";

    win.add("statictext", undefined, "3. Text Styling Options:").alignment = "left";
    
    var stylePanel = win.add("panel", undefined, "Text Styling");
    stylePanel.orientation = "column";
    stylePanel.alignChildren = "left";
    stylePanel.spacing = 4;
    stylePanel.margins = 6;

    var fontSearchGroup = stylePanel.add("group");
    fontSearchGroup.orientation = "row";
    fontSearchGroup.add("statictext", undefined, "Search Fonts:");
    fontSearchInput = fontSearchGroup.add("edittext", undefined, "");
    fontSearchInput.characters = 20;
    fontSearchInput.helpTip = "Type to filter the font dropdown.";

    var fontNameGroup = stylePanel.add("group");
    fontNameGroup.orientation = "row";
    fontNameGroup.add("statictext", undefined, "Font Name:");

    if (app.fonts && typeof app.fonts.allFonts !== "undefined") {
      isFontDropdown = true;
      fontNameInput = fontNameGroup.add("dropdownlist", undefined, []);
      fontNameInput.size = [220, 25];
      fontNameInput.helpTip = "Select a font from your system.";

      try {
        var allFonts = app.fonts.allFonts;
        var defaultFontPostScript = null;
        availableFonts = [];
        for (var i = 0; i < allFonts.length; i++) {
          var familyGroup = allFonts[i];
          for (var j = 0; j < familyGroup.length; j++) {
            var font = familyGroup[j];
            if (font && font.postScriptName) {
              var displayName = font.familyName + " - " + font.styleName;
              availableFonts.push({
                postScriptName: font.postScriptName,
                displayName: displayName,
              });
              if (font.postScriptName === DEFAULT_TEXT_FONT_POSTSCRIPT_NAME) {
                defaultFontPostScript = font.postScriptName;
              }
            }
          }
        }

        var populateFontDropdown = function (query) {
          query = (query || "").toString().toLowerCase();
          fontNameInput.removeAll();
          for (var k = 0; k < availableFonts.length; k++) {
            var f = availableFonts[k];
            if (
              query === "" ||
              f.displayName.toLowerCase().indexOf(query) !== -1 ||
              f.postScriptName.toLowerCase().indexOf(query) !== -1
            ) {
              var it = fontNameInput.add("item", f.displayName);
              it.properties = { postScriptName: f.postScriptName };
            }
          }
          if (fontNameInput.items.length > 0) {
            var foundSel = false;
            if (defaultFontPostScript) {
              for (var m = 0; m < fontNameInput.items.length; m++) {
                if (fontNameInput.items[m].properties.postScriptName === defaultFontPostScript) {
                  fontNameInput.selection = m;
                  foundSel = true;
                  break;
                }
              }
            }
            if (!foundSel) fontNameInput.selection = 0;
          }
        };

        populateFontDropdown("");

        if (fontSearchInput) {
          fontSearchInput.onChanging = function () {
            try {
              populateFontDropdown(this.text || "");
            } catch (e_pf) {}
          };
          fontSearchInput.onChange = function () {
            try {
              populateFontDropdown(this.text || "");
            } catch (e_pf) {}
          };
        }
      } catch (e) {
        isFontDropdown = false;
        if (fontNameInput) {
          try {
            fontNameGroup.remove(fontNameInput);
          } catch (e_rem) {}
        }
        fontNameInput = fontNameGroup.add("edittext", undefined, DEFAULT_TEXT_FONT_POSTSCRIPT_NAME);
        fontNameInput.characters = 25;
        fontNameInput.helpTip = "Font dropdown failed. Enter PostScript name.";
      }
    } else {
      isFontDropdown = false;
      fontNameInput = fontNameGroup.add("edittext", undefined, DEFAULT_TEXT_FONT_POSTSCRIPT_NAME);
      fontNameInput.characters = 25;
      fontNameInput.helpTip = "Enter the PostScript name of the font.";
    }

    var fontSizeGroup = stylePanel.add("group");
    fontSizeGroup.orientation = "row";
    fontSizeGroup.add("statictext", undefined, "Font Size (pt):");
    fontSizeInput = fontSizeGroup.add("edittext", undefined, DEFAULT_TEXT_FONT_SIZE.toString());
    fontSizeInput.characters = 5;

    var animsGroup = stylePanel.add("group");
    animsGroup.orientation = "row";
    enableAnimationsCheckbox = animsGroup.add("checkbox", undefined, "Enable Text Animations (Pop-in)");
    enableAnimationsCheckbox.helpTip = "Small pop-in scale animation for each layer.";
    enableAnimationsCheckbox.value = false;

    stylePanel.add("statictext", undefined, "Fill Color (R,G,B values 0.0 - 1.0):");
    var fillColorGroup = stylePanel.add("group");
    fillColorGroup.orientation = "row";
    fillColorGroup.add("statictext", undefined, "R:");
    fillRInput = fillColorGroup.add("edittext", undefined, DEFAULT_TEXT_FILL_COLOR[0].toString());
    fillRInput.characters = 4;
    fillColorGroup.add("statictext", undefined, "G:");
    fillGInput = fillColorGroup.add("edittext", undefined, DEFAULT_TEXT_FILL_COLOR[1].toString());
    fillGInput.characters = 4;
    fillColorGroup.add("statictext", undefined, "B:");
    fillBInput = fillColorGroup.add("edittext", undefined, DEFAULT_TEXT_FILL_COLOR[2].toString());
    fillBInput.characters = 4;

    var strokeWidthGroup = stylePanel.add("group");
    strokeWidthGroup.orientation = "row";
    strokeWidthGroup.add("statictext", undefined, "Stroke Width (pt):");
    strokeWidthInput = strokeWidthGroup.add("edittext", undefined, DEFAULT_TEXT_STROKE_WIDTH.toString());
    strokeWidthInput.characters = 5;
    strokeWidthInput.helpTip = "Set to 0 for no stroke.";

    stylePanel.add("statictext", undefined, "Stroke Color (R,G,B values 0.0 - 1.0):");
    var strokeColorGroup = stylePanel.add("group");
    strokeColorGroup.orientation = "row";
    strokeColorGroup.add("statictext", undefined, "R:");
    strokeRInput = strokeColorGroup.add("edittext", undefined, DEFAULT_TEXT_STROKE_COLOR[0].toString());
    strokeRInput.characters = 4;
    strokeColorGroup.add("statictext", undefined, "G:");
    strokeGInput = strokeColorGroup.add("edittext", undefined, DEFAULT_TEXT_STROKE_COLOR[1].toString());
    strokeGInput.characters = 4;
    strokeColorGroup.add("statictext", undefined, "B:");
    strokeBInput = strokeColorGroup.add("edittext", undefined, DEFAULT_TEXT_STROKE_COLOR[2].toString());
    strokeBInput.characters = 4;

    win.add("statictext", undefined, "4. Start Transcription:").alignment = "left";
    
    var transcribeBtn = win.add("button", undefined, "Select Audio File & Start Transcription");
    transcribeBtn.helpTip = "Select audio and start transcription with selected options.";

    transcribeBtn.onClick = function () {
      if (!app.project || !(app.project.activeItem instanceof CompItem)) {
        alert("Please open or select a composition first.");
        return;
      }

      var audioFileExtensions = "*.wav;*.mp3;*.m4a;*.ogg;*.flac;*.aac;*.opus";
      var selectedFile = File.openDialog("Select your audio file for transcription", audioFileExtensions, false);

      if (selectedFile) {
        runTranscriptionProcess(selectedFile);
      }
    };

    win.add("panel");

    win.add("statictext", undefined, "5. Text Layer Utilities:").alignment = "left";

    var combinePanel = win.add("panel", undefined, "Layer Organization");
    combinePanel.orientation = "column";
    combinePanel.alignChildren = "left";
    combinePanel.spacing = 4;
    combinePanel.margins = 6;

    var maxCharsGroup = combinePanel.add("group");
    maxCharsGroup.orientation = "row";
    maxCharsGroup.add("statictext", undefined, "Max Chars/Line:");
    maxCharsInput = maxCharsGroup.add("edittext", undefined, DEFAULT_MAX_CHARS_PER_LINE.toString());
    maxCharsInput.characters = 4;
    maxCharsInput.helpTip = "Maximum characters per line.";

    var maxWordsGroup = combinePanel.add("group");
    maxWordsGroup.orientation = "row";
    maxWordsGroup.add("statictext", undefined, "Max Words/Line:");
    maxWordsInput = maxWordsGroup.add("edittext", undefined, DEFAULT_MAX_WORDS_PER_LINE.toString());
    maxWordsInput.characters = 4;
    maxWordsInput.helpTip = "Maximum words per line.";

    forceRtlCheckbox = combinePanel.add("checkbox", undefined, "Force RTL Layout");
    forceRtlCheckbox.value = isRtlMode;
    forceRtlCheckbox.helpTip = "Forces Right-to-Left layout for arrange/combine functions.";

    var arrangeBtn = combinePanel.add("button", undefined, "Arrange Words Side-by-Side");
    arrangeBtn.helpTip = "Arranges selected word layers into a paragraph.";
    arrangeBtn.onClick = function () {
      arrangeWordsSideBySide();
    };

    var combineBtn = combinePanel.add("button", undefined, "Combine Selected Text Layers");
    combineBtn.helpTip = "Combines selected text layers into a single layer.";
    combineBtn.onClick = function () {
      combineSelectedTextLayers();
    };

    // --- UI LOGIC FOR PRESETS ---
    var applyPresetToUI = function (presetName) {
      var settings = loadPreset(presetName);
      if (!settings) return;

      if (isFontDropdown) {
        var fontToSelect = settings.fontName || DEFAULT_TEXT_FONT_POSTSCRIPT_NAME;
        var foundFont = false;
        for (var i = 0; i < fontNameInput.items.length; i++) {
          if (fontNameInput.items[i].properties.postScriptName === fontToSelect) {
            fontNameInput.selection = i;
            foundFont = true;
            break;
          }
        }
        if (!foundFont) {
          if (fontNameInput.items.length > 0) fontNameInput.selection = 0;
        }
      } else {
        fontNameInput.text = settings.fontName || DEFAULT_TEXT_FONT_POSTSCRIPT_NAME;
      }
      fontSizeInput.text = settings.fontSize || DEFAULT_TEXT_FONT_SIZE;
      fillRInput.text = settings.fillColor ? settings.fillColor[0] : DEFAULT_TEXT_FILL_COLOR[0];
      fillGInput.text = settings.fillColor ? settings.fillColor[1] : DEFAULT_TEXT_FILL_COLOR[1];
      fillBInput.text = settings.fillColor ? settings.fillColor[2] : DEFAULT_TEXT_FILL_COLOR[2];
      strokeWidthInput.text = typeof settings.strokeWidth !== "undefined" ? settings.strokeWidth : DEFAULT_TEXT_STROKE_WIDTH;
      strokeRInput.text = settings.strokeColor ? settings.strokeColor[0] : DEFAULT_TEXT_STROKE_COLOR[0];
      strokeGInput.text = settings.strokeColor ? settings.strokeColor[1] : DEFAULT_TEXT_STROKE_COLOR[1];
      strokeBInput.text = settings.strokeColor ? settings.strokeColor[2] : DEFAULT_TEXT_STROKE_COLOR[2];
      
      if (typeof settings.enableAnimations !== "undefined") {
        try {
          if (enableAnimationsCheckbox) {
            enableAnimationsCheckbox.value = !!settings.enableAnimations;
          }
        } catch (e_anim_restore) {}
      }
      
      maxCharsInput.text = settings.maxChars || DEFAULT_MAX_CHARS_PER_LINE;
      maxWordsInput.text = settings.maxWords || DEFAULT_MAX_WORDS_PER_LINE;
      
      // Restore feature checkbox states if saved in preset
      if (typeof settings.useWordTimestamps !== "undefined") {
        useWordTimestampsCheckbox.value = !!settings.useWordTimestamps;
      }
      if (typeof settings.useTranslate !== "undefined") {
        useTranslateCheckbox.value = !!settings.useTranslate;
      }
      if (typeof settings.useVad !== "undefined") {
        useVadCheckbox.value = !!settings.useVad;
      }
      if (typeof settings.useDiarization !== "undefined") {
        useDiarizationCheckbox.value = !!settings.useDiarization;
      }
      if (typeof settings.colorBySpeaker !== "undefined") {
        colorBySpeakerCheckbox.value = !!settings.colorBySpeaker;
      }
    };

    var populatePresetDropdown = function () {
      var presets = getPresetList();
      presetDropdown.removeAll();
      for (var i = 0; i < presets.length; i++) {
        presetDropdown.add("item", presets[i]);
      }
    };

    presetDropdown.onChange = function () {
      if (presetDropdown.selection) {
        var selectedPreset = presetDropdown.selection.text;
        applyPresetToUI(selectedPreset);
        saveSetting(LAST_PRESET_KEY, selectedPreset);
      }
    };

    savePresetBtn.onClick = function () {
      var presetName = prompt("Enter a name for this preset:", "My Preset");
      if (presetName) {
        var fontValue;
        if (isFontDropdown) {
          fontValue = fontNameInput.selection ? fontNameInput.selection.properties.postScriptName : "";
        } else {
          fontValue = fontNameInput.text;
        }
        var settings = {
          fontName: fontValue,
          fontSize: fontSizeInput.text,
          fillColor: [fillRInput.text, fillGInput.text, fillBInput.text],
          strokeWidth: strokeWidthInput.text,
          strokeColor: [strokeRInput.text, strokeGInput.text, strokeBInput.text],
          maxChars: maxCharsInput.text,
          maxWords: maxWordsInput.text,
          enableAnimations: enableAnimationsCheckbox && enableAnimationsCheckbox.value ? true : false,
          useWordTimestamps: useWordTimestampsCheckbox.value,
          useTranslate: useTranslateCheckbox.value,
          useVad: useVadCheckbox.value,
          useDiarization: useDiarizationCheckbox.value,
          colorBySpeaker: colorBySpeakerCheckbox.value
        };
        savePreset(presetName, settings);
        populatePresetDropdown();
        for (var i = 0; i < presetDropdown.items.length; i++) {
          if (presetDropdown.items[i].text === presetName) {
            presetDropdown.selection = i;
            break;
          }
        }
        saveSetting(LAST_PRESET_KEY, presetName);
      }
    };

    deletePresetBtn.onClick = function () {
      if (presetDropdown.selection) {
        var presetNameToDelete = presetDropdown.selection.text;
        if (confirm("Are you sure you want to delete the preset '" + presetNameToDelete + "'?")) {
          deletePreset(presetNameToDelete);
          populatePresetDropdown();
          if (presetDropdown.items.length > 0) {
            presetDropdown.selection = 0;
            saveSetting(LAST_PRESET_KEY, presetDropdown.selection.text);
          } else {
            saveSetting(LAST_PRESET_KEY, "");
          }
        }
      } else {
        alert("Please select a preset to delete.");
      }
    };

    // --- Initial Load ---
    populatePresetDropdown();
    var lastPreset = getSetting(LAST_PRESET_KEY);
    if (lastPreset) {
      var found = false;
      for (var i = 0; i < presetDropdown.items.length; i++) {
        if (presetDropdown.items[i].text === lastPreset) {
          presetDropdown.selection = i;
          applyPresetToUI(lastPreset);
          found = true;
          break;
        }
      }
      if (!found) {
        if (presetDropdown.items.length > 0) {
          presetDropdown.selection = 0;
        }
      }
    } else if (presetDropdown.items.length > 0) {
      presetDropdown.selection = 0;
    }
    if (presetDropdown.selection) {
      applyPresetToUI(presetDropdown.selection.text);
    }

    win.layout.layout(true);
    win.layout.resize();
    win.onResizing = win.onResize = function () {
      this.layout.resize();
    };
    return win;
  };

  var uiObject = buildUI(thisObj);

  if (uiObject !== null) {
    if (uiObject instanceof Window) {
      uiObject.center();
      uiObject.show();
    } else {
      if (win && typeof win.layout !== "undefined") {
        win.layout.layout(true);
      }
    }
    checkForUpdates();
  }
})(this);