import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, X, Check, Edit3, Square, RotateCcw 
} from 'lucide-react';
import type { OutlineItem } from '@/types/outline';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptStructure: (items: OutlineItem[]) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'structured';

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onAcceptStructure }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcriptText, setTranscriptText] = useState('');
  const [structuredOutput, setStructuredOutput] = useState<OutlineItem[]>([]);
  const [volume, setVolume] = useState(3);
  const [showOriginalTranscript, setShowOriginalTranscript] = useState(false);
  const [_currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0);
  
  const transcriptInterval = useRef<NodeJS.Timeout | null>(null);
  const volumeInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Mock transcription data for demo
  // Using real AI transcription - no mock data!

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setVoiceState('idle');
      setTranscriptText('');
      setStructuredOutput([]);
      setShowOriginalTranscript(false);
      setCurrentTranscriptIndex(0);
      if (transcriptInterval.current) {
        clearInterval(transcriptInterval.current);
      }
      if (volumeInterval.current) {
        clearInterval(volumeInterval.current);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (transcriptInterval.current) {
        clearInterval(transcriptInterval.current);
      }
      if (volumeInterval.current) {
        clearInterval(volumeInterval.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const visualizeAudio = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (analyserRef.current && voiceState === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        // Map to 1-5 scale for volume bars
        const volumeLevel = Math.min(5, Math.max(1, Math.floor((average / 128) * 5)));
        setVolume(volumeLevel);
      }
    };

    volumeInterval.current = setInterval(updateVolume, 100);
  };

  const startListening = async () => {
    setVoiceState('listening');
    setTranscriptText('');
    setCurrentTranscriptIndex(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Process the audio
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio visualization
        if (volumeInterval.current) {
          clearInterval(volumeInterval.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      visualizeAudio(stream);
      
      // Real transcription will happen when recording stops
      // No need for mock simulation anymore!
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setVoiceState('idle');
    }
  };

  const stopListening = () => {
    if (transcriptInterval.current) {
      clearInterval(transcriptInterval.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setVoiceState('processing');
    
    try {
      // Import API service
      const { voiceApi } = await import('@/services/api/apiClient');
      
      // Get transcription
      const result = await voiceApi.transcribeAudio(audioBlob);
      setTranscriptText(result.text);
      
      // Get structured output
      const structured = await voiceApi.structureText(result.text);
      
      // Convert to OutlineItem format
      const structuredItems: OutlineItem[] = structured.structured.map((item, index) => ({
        id: `voice-${Date.now()}-${index}`,
        text: item.content,
        level: item.level,
        expanded: false,
        children: []
      }));
      
      // Group into hierarchy if needed
      const hierarchicalItems = buildHierarchy(structuredItems);
      setStructuredOutput(hierarchicalItems);
      setVoiceState('structured');
      
    } catch (error) {
      console.error('Processing error:', error);
      setVoiceState('idle');
    }
  };

  const buildHierarchy = (items: OutlineItem[]): OutlineItem[] => {
    // Build actual hierarchy from the AI-structured items
    const rootItems: OutlineItem[] = [];
    const itemMap = new Map<string, OutlineItem>();
    
    // First pass: create map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    // Second pass: build hierarchy
    items.forEach(item => {
      const currentItem = itemMap.get(item.id)!;
      if (item.level === 0) {
        rootItems.push(currentItem);
      } else {
        // Find parent (previous item with lower level)
        let parentFound = false;
        for (let i = items.indexOf(item) - 1; i >= 0; i--) {
          if (items[i].level < item.level) {
            const parent = itemMap.get(items[i].id);
            if (parent) {
              parent.children.push(currentItem);
              parentFound = true;
              break;
            }
          }
        }
        // If no parent found, add as root
        if (!parentFound) {
          rootItems.push(currentItem);
        }
      }
    });
    
    return rootItems;
  };

  const acceptStructure = () => {
    onAcceptStructure(structuredOutput);
    onClose();
  };

  const rejectStructure = () => {
    setVoiceState('idle');
    setStructuredOutput([]);
    setTranscriptText('');
  };

  const editTranscript = () => {
    // In a real implementation, this would allow editing the transcript
    setVoiceState('idle');
    setStructuredOutput([]);
  };

  const renderStructuredItem = (item: OutlineItem) => (
    <div key={item.id} className="group">
      <div 
        className="flex items-start space-x-2 py-1.5 px-3 rounded hover:bg-blue-50 transition-colors"
        style={{ paddingLeft: `${item.level * 16 + 8}px` }}
      >
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
        <span className="text-gray-900 text-sm leading-relaxed">{item.text}</span>
      </div>
      {item.children && item.children.map(child => renderStructuredItem(child))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Voice Input</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              voiceState === 'listening' ? 'bg-red-100 text-red-700' :
              voiceState === 'processing' ? 'bg-yellow-100 text-yellow-700' :
              voiceState === 'structured' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {voiceState === 'listening' ? 'Listening' :
               voiceState === 'processing' ? 'Processing' :
               voiceState === 'structured' ? 'Ready' : 'Ready'}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          
          {/* Idle State */}
          {voiceState === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Speak Your Ideas</h3>
                <p className="text-sm text-gray-600 mt-1">I'll organize them into your outline</p>
              </div>
              <button
                onClick={startListening}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium shadow-sm transition-all"
              >
                <Mic className="w-5 h-5" />
                <span>Start Recording</span>
              </button>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p><strong>Tip:</strong> Speak naturally about your ideas, tasks, or plans. The AI will organize everything into a structured outline.</p>
              </div>
            </div>
          )}

          {/* Listening State */}
          {voiceState === 'listening' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 h-8 rounded-full transition-all duration-300 ${
                      i <= volume ? 'bg-red-500' : 'bg-gray-300'
                    } ${voiceState === 'listening' ? 'animate-pulse' : ''}`}></div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-24">
                <div className="text-xs text-gray-500 mb-2">Live transcription:</div>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {transcriptText}
                  <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={stopListening}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Process</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {voiceState === 'processing' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI is Organizing...</h3>
                <p className="text-sm text-gray-600">Creating structured outline from your speech</p>
              </div>
              {transcriptText && (
                <div className="bg-gray-50 rounded-lg p-3 text-left">
                  <div className="text-xs text-gray-500 mb-1">What you said:</div>
                  <p className="text-sm text-gray-700">{transcriptText}</p>
                </div>
              )}
            </div>
          )}

          {/* Structured State */}
          {voiceState === 'structured' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Structured Outline Ready!</h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                {structuredOutput.map(item => renderStructuredItem(item))}
              </div>

              {/* Show/Hide Original Transcript */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowOriginalTranscript(!showOriginalTranscript)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{showOriginalTranscript ? 'Hide' : 'Show'} original transcript</span>
                </button>
                
                {showOriginalTranscript && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700">
                    {transcriptText}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={acceptStructure}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                >
                  <Check className="w-5 h-5" />
                  <span>Add to Outline</span>
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={editTranscript}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={rejectStructure}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceModal;