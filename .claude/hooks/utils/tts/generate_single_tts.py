#!/usr/bin/env python3
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pyttsx3",
# ]
# ///
"""
Generate individual TTS notification wav files using pyttsx3.
"""

import pyttsx3
import sys
from pathlib import Path

def generate_single_tts(text, filename):
    """
    Generate a single TTS wav file.
    
    Args:
        text (str): Text to convert to speech.
        filename (str): Output filename.
    
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        # Create output directory
        output_dir = Path("generated_tts_files")
        output_dir.mkdir(exist_ok=True)
        
        # Initialize pyttsx3 engine
        engine = pyttsx3.init()
        
        # Configure voice settings
        voices = engine.getProperty('voices')
        if voices:
            # Try to use a female voice if available
            for voice in voices:
                if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
        
        # Set speech rate and volume
        engine.setProperty('rate', 150)
        engine.setProperty('volume', 0.9)
        
        output_path = output_dir / filename
        print(f"Generating: {filename} - '{text}'")
        
        # Generate and save the audio file
        engine.save_to_file(text, str(output_path))
        engine.runAndWait()
        
        if output_path.exists():
            print(f"[OK] Generated: {output_path}")
            return True
        else:
            print(f"[FAILED] Failed to generate: {output_path}")
            return False
            
    except Exception as e:
        print(f"Error generating {filename}: {e}")
        return False

def main():
    """Generate all notification files one by one."""
    notifications = [
        ("Work complete!", "work_complete.wav"),
        ("All done!", "all_done.wav"),
        ("Task finished!", "task_finished.wav"),
        ("Job complete!", "job_complete.wav"),
        ("Ready for next task!", "ready_for_next_task.wav"),
        ("Your agent needs your input", "your_agent_needs_your_input.wav"),
        ("Subagent Complete", "subagent_complete.wav")
    ]
    
    successful = 0
    total = len(notifications)
    
    for text, filename in notifications:
        if generate_single_tts(text, filename):
            successful += 1
    
    print(f"\nGenerated {successful}/{total} files successfully")
    output_dir = Path("generated_tts_files").absolute()
    print(f"Files are stored at: {output_dir}")

if __name__ == "__main__":
    main()