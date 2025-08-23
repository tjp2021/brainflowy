#!/usr/bin/env python3
"""
Script to remove all mock responses from llm_actions.py
"""

import re

# Read the file
with open('app/api/endpoints/llm_actions.py', 'r') as f:
    content = f.read()

# Remove the MOCK_RESPONSES dictionary
content = re.sub(
    r'# Mock responses for development.*?^\}$', 
    '# Mock responses removed - using real OpenAI API only\nMOCK_RESPONSES = {}',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Replace get_mock_response function calls with exceptions
replacements = [
    # When no API key
    (
        r'if not openai_key:.*?return mock_result',
        '''if not openai_key:
        # No API key configured, return error
        print("❌ No OpenAI API key found")
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )''',
    ),
    # Replace all get_mock_response calls
    (r'return get_mock_response\(.*?\)', 
     'raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")'),
    (r'result = get_mock_response\(.*?\)',
     'raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")'),
    (r'mock_result = get_mock_response\(.*?\)',
     'raise HTTPException(status_code=500, detail="LLM processing failed - no mock fallback")'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# Write the file back
with open('app/api/endpoints/llm_actions.py', 'w') as f:
    f.write(content)

print("✅ Mock responses removed from llm_actions.py")