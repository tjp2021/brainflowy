import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Check } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscription, 
  onError,
  className = '' 
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const visualizeAudio = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (analyserRef.current && recordingState === 'recording') {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setAudioLevel(Math.min(100, (average / 128) * 100));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start();
      setRecordingState('recording');
      visualizeAudio(stream);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setErrorMessage('Could not access microphone. Please check permissions.');
      setRecordingState('error');
      onError?.('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Import API service
      const { voiceApi } = await import('@/services/api/apiClient');
      
      // Send audio to transcription service
      const result = await voiceApi.transcribeAudio(audioBlob);
      
      setRecordingState('success');
      onTranscription(result.text);
      
      // Reset to idle after showing success
      setTimeout(() => {
        setRecordingState('idle');
        setErrorMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Transcription error:', error);
      setErrorMessage('Transcription failed. Please try again.');
      setRecordingState('error');
      onError?.('Transcription failed');
      
      // Reset to idle after showing error
      setTimeout(() => {
        setRecordingState('idle');
        setErrorMessage('');
      }, 3000);
    }
  };

  const handleClick = () => {
    if (recordingState === 'idle' || recordingState === 'error') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const getButtonContent = () => {
    switch (recordingState) {
      case 'recording':
        return (
          <>
            <div className={`absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping`}></div>
            <div 
              className="absolute inset-0 rounded-full bg-red-500 opacity-30 transition-transform"
              style={{ transform: `scale(${1 + audioLevel / 200})` }}
            ></div>
            <MicOff className="relative z-10 w-6 h-6 text-white" />
          </>
        );
      case 'processing':
        return <Loader2 className="w-6 h-6 text-white animate-spin" />;
      case 'success':
        return <Check className="w-6 h-6 text-white" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-white" />;
      default:
        return <Mic className="w-6 h-6 text-white" />;
    }
  };

  const getButtonColor = () => {
    switch (recordingState) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600';
      case 'processing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <button
        onClick={handleClick}
        disabled={recordingState === 'processing' || recordingState === 'success'}
        className={`relative w-16 h-16 rounded-full ${getButtonColor()} 
          flex items-center justify-center transition-all duration-200 
          shadow-lg hover:shadow-xl disabled:cursor-not-allowed
          ${recordingState === 'recording' ? 'scale-110' : ''}`}
        aria-label={recordingState === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {getButtonContent()}
      </button>
      
      {recordingState === 'recording' && (
        <div className="text-sm font-medium text-gray-600 animate-pulse">
          Recording... Tap to stop
        </div>
      )}
      
      {recordingState === 'processing' && (
        <div className="text-sm font-medium text-blue-600">
          Transcribing audio...
        </div>
      )}
      
      {recordingState === 'success' && (
        <div className="text-sm font-medium text-green-600">
          Transcription complete!
        </div>
      )}
      
      {errorMessage && (
        <div className="text-sm font-medium text-red-600 text-center max-w-xs">
          {errorMessage}
        </div>
      )}

      {/* Audio level indicator during recording */}
      {recordingState === 'recording' && (
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${audioLevel}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;