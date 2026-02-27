#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pyttsx3",
# ]
# ///

"""
TTS Manager - Smart Text-to-Speech Dispatcher

Provides intelligent TTS routing with simplified fallback chain:
1. Pre-generated WAV files (fastest for common messages)
2. pyttsx3 TTS (reliable offline synthesis for custom text)

Usage:
- ./tts_manager.py "Your text to speak"
- ./tts_manager.py --engine pregenerated "Work complete!"
- ./tts_manager.py --engine pyttsx3 "Custom text"
"""

import sys
import json
import subprocess
import tempfile
import platform
from pathlib import Path


class TTSManager:
    """Smart TTS manager with multiple engine support and pre-generated audio."""
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.pregenerated_dir = self.script_dir / "pregenerated"
        self.registry_path = self.pregenerated_dir / "message_registry.json"
        self.registry = self._load_message_registry()
    
    def _load_message_registry(self):
        """Load message registry for pre-generated audio."""
        try:
            if self.registry_path.exists():
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load message registry - {e}", file=sys.stderr)
        return {}
    
    def _find_pregenerated_audio(self, text):
        """Find pre-generated audio file for given text."""
        if not self.registry or text not in self.registry:
            return None
        
        filename = self.registry[text]["filename"]
        audio_path = self.pregenerated_dir / filename
        
        if audio_path.exists():
            return audio_path
        
        return None
    
    def _play_audio_file(self, audio_path):
        """Play audio file using system default player."""
        try:
            system = platform.system().lower()
            
            if system == "windows":
                subprocess.run(["powershell", "-c", f"(New-Object Media.SoundPlayer '{audio_path}').PlaySync()"], 
                             capture_output=True, timeout=10)
            elif system == "darwin":
                subprocess.run(["afplay", str(audio_path)], capture_output=True, timeout=10)
            else:
                # Linux: try common players
                players = ["aplay", "paplay", "play"]
                for player in players:
                    try:
                        subprocess.run([player, str(audio_path)], capture_output=True, timeout=10, check=True)
                        return True
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        continue
            return True
        except Exception as e:
            print(f"Warning: Could not play audio file - {e}", file=sys.stderr)
            return False
    
    
    def _is_pyttsx3_available(self):
        """Check if pyttsx3 TTS is available."""
        try:
            import pyttsx3
            return True
        except ImportError:
            return False
    
    
    def _use_pyttsx3_tts(self, text):
        """Generate and play audio using pyttsx3 TTS."""
        try:
            pyttsx3_script = self.script_dir / "pyttsx3_tts.py"
            if pyttsx3_script.exists():
                result = subprocess.run([
                    "uv", "run", str(pyttsx3_script), text
                ], capture_output=True, timeout=30)
                return result.returncode == 0
            else:
                # Direct pyttsx3 usage as fallback
                import pyttsx3
                engine = pyttsx3.init()
                
                # Configure voice settings
                voices = engine.getProperty('voices')
                if voices:
                    # Try to use a female voice if available
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                
                engine.setProperty('rate', 180)
                engine.setProperty('volume', 0.8)
                engine.say(text)
                engine.runAndWait()
                return True
                
        except Exception as e:
            print(f"Warning: pyttsx3 TTS failed - {e}", file=sys.stderr)
            return False
    
    def speak(self, text, engine=None):
        """
        Speak text using best available TTS engine.
        
        Args:
            text (str): Text to speak
            engine (str): Force specific engine ('pregenerated', 'pyttsx3')
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not text or not text.strip():
            return False
        
        text = text.strip()
        
        # Force specific engine if requested
        if engine == "pyttsx3":
            return self._use_pyttsx3_tts(text)
        elif engine == "pregenerated":
            audio_path = self._find_pregenerated_audio(text)
            if audio_path:
                return self._play_audio_file(audio_path)
            return False
        
        # Simplified fallback chain
        print(f"TTS: '{text}'", file=sys.stderr)
        
        # 1. Try pre-generated audio (fastest for common messages)
        audio_path = self._find_pregenerated_audio(text)
        if audio_path:
            print("Using pre-generated audio", file=sys.stderr)
            if self._play_audio_file(audio_path):
                return True
        
        # 2. Try pyttsx3 TTS (reliable offline fallback)
        if self._is_pyttsx3_available():
            print("Using pyttsx3 TTS", file=sys.stderr)
            if self._use_pyttsx3_tts(text):
                return True
        
        print("TTS failed", file=sys.stderr)
        return False


def main():
    """Command-line interface for TTS manager."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Smart TTS Manager")
    parser.add_argument("text", nargs="*", help="Text to speak")
    parser.add_argument("--engine", choices=["pregenerated", "pyttsx3"], 
                       help="Force specific TTS engine")
    parser.add_argument("--list-pregenerated", action="store_true",
                       help="List available pre-generated messages")
    
    args = parser.parse_args()
    
    tts = TTSManager()
    
    if args.list_pregenerated:
        print("Available pre-generated messages:")
        for text, info in tts.registry.items():
            print(f"  '{text}' -> {info['filename']}")
        return 0
    
    if not args.text:
        print("Error: No text provided")
        return 1
    
    text = " ".join(args.text)
    
    if tts.speak(text, engine=args.engine):
        return 0
    else:
        print("Error: TTS failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())