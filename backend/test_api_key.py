#!/usr/bin/env python3
"""Test OpenAI API key directly"""
import os
from openai import OpenAI

# Load from environment
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('OPENAI_API_KEY')
print(f"API Key from env: {api_key[:20] if api_key else 'NOT FOUND'}...")

if api_key:
    try:
        client = OpenAI(api_key=api_key)
        
        # Test Whisper
        print("\nTesting Whisper...")
        try:
            # Create minimal audio data
            import io
            audio = io.BytesIO(b'RIFF' + b'\x00' * 100)
            audio.name = 'test.wav'
            audio.seek(0)
            
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                response_format="text"
            )
            print("✅ Whisper works!")
        except Exception as e:
            print(f"❌ Whisper failed: {str(e)[:100]}")
        
        # Test GPT
        print("\nTesting GPT-4o-mini...")
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "Say hello"}],
                max_tokens=10
            )
            print(f"✅ GPT-4o-mini works! Response: {response.choices[0].message.content}")
        except Exception as e:
            print(f"❌ GPT-4o-mini failed: {str(e)[:100]}")
            
    except Exception as e:
        print(f"❌ Failed to initialize OpenAI client: {e}")
else:
    print("❌ No API key found in environment!")