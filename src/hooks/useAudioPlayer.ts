import { useState, useRef, useEffect } from 'react';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  progress: number;
  play: (url: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const play = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop any existing audio
      cleanup();
      
      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        setIsLoading(false);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audio.addEventListener('error', () => {
        setError('Failed to load audio');
        setIsLoading(false);
      });
      
      // Play the audio
      await audio.play();
      setIsPlaying(true);
      
    } catch (err) {
      setError('Failed to play audio');
      setIsLoading(false);
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    cleanup();
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    progress,
    play,
    pause,
    stop,
    seek,
  };
};