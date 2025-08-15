// Mock Voice and AI Service
// This will be replaced with real Whisper/Claude API calls in Phase 3

interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
}

interface StructuredOutline {
  original: string;
  structured: Array<{
    content: string;
    level: number;
  }>;
  suggestions: string[];
}

// Simulated delay for network requests
const simulateDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Sample responses for different voice inputs
const sampleTranscriptions: string[] = [
  "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team",
  "The main features we need are user authentication, real-time sync, and voice input with AI structuring",
  "Meeting notes: discussed quarterly goals, need to increase revenue by 20%, focus on customer retention",
  "Shopping list: milk, bread, eggs, coffee, fruits including apples and bananas, vegetables",
];

export const mockVoiceService = {
  async transcribeAudio(_audioBlob: Blob): Promise<TranscriptionResult> {
    // Simulate processing time based on "audio duration"
    const duration = Math.random() * 5 + 2; // 2-7 seconds
    await simulateDelay(duration * 200); // Simulate processing
    
    // Pick a random sample transcription
    const text = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
    
    return {
      text,
      confidence: 0.92 + Math.random() * 0.08, // 92-100% confidence
      duration,
    };
  },

  async structureText(text: string): Promise<StructuredOutline> {
    await simulateDelay(800);
    
    // Simple AI structuring simulation
    const sentences = text.split(/[,.]/).filter(s => s.trim());
    const structured = sentences.map((sentence, index) => {
      // Detect if it's a sub-item based on keywords
      const isSubItem = sentence.includes('including') || 
                       sentence.includes('such as') || 
                       sentence.includes('need to') ||
                       index > 0 && sentences[index - 1].includes(':');
      
      return {
        content: sentence.trim(),
        level: isSubItem ? 1 : 0,
      };
    });
    
    // Generate suggestions
    const suggestions = [
      "Consider breaking this into separate categories",
      "You might want to add deadlines to these items",
      "This could be organized by priority",
    ];
    
    return {
      original: text,
      structured,
      suggestions: suggestions.slice(0, Math.floor(Math.random() * 2) + 1),
    };
  },

  async improveOutline(items: Array<{ content: string; level: number }>): Promise<StructuredOutline> {
    await simulateDelay(600);
    
    // Simulate AI improvement
    const improved = items.map(item => ({
      ...item,
      content: this.improveText(item.content),
    }));
    
    return {
      original: items.map(i => i.content).join('. '),
      structured: improved,
      suggestions: ["Structure looks good!", "Consider adding more detail to some items"],
    };
  },

  // Helper to simulate text improvement
  improveText(text: string): string {
    // Simple capitalization and punctuation improvements
    let improved = text.trim();
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    
    if (!improved.match(/[.!?]$/)) {
      improved += '.';
    }
    
    return improved;
  },

  // Mock voice recording (for UI testing)
  async startRecording(): Promise<MediaRecorder | null> {
    try {
      // Check if browser supports media recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Media recording not supported, using mock');
        return null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      return mediaRecorder;
    } catch (error) {
      console.log('Microphone access denied, using mock recording');
      return null;
    }
  },

  async stopRecording(mediaRecorder: MediaRecorder | null): Promise<Blob> {
    if (!mediaRecorder) {
      // Return a mock blob if no real recorder
      return new Blob(['mock audio data'], { type: 'audio/webm' });
    }
    
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.stop();
    });
  },
};