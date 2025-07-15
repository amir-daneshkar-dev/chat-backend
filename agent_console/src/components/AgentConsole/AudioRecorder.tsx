import React, { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Pause } from "lucide-react";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    maxDuration?: number;
    className?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
    onRecordingComplete,
    maxDuration = 60, // 60 seconds
    className = "",
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, {
                    type: "audio/webm",
                });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                setHasRecording(true);

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());

                onRecordingComplete(audioBlob, duration);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => {
                    const newDuration = prev + 1;
                    if (newDuration >= maxDuration) {
                        stopRecording();
                    }
                    return newDuration;
                });
            }, 1000);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    }, [maxDuration, duration, onRecordingComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const handlePlay = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    }, [isPlaying]);

    const handleSend = useCallback(() => {
        if (audioUrl) {
            // Create a new blob from the audio URL
            fetch(audioUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    onRecordingComplete(blob, duration);
                    setHasRecording(false);
                    setAudioUrl(null);
                    setDuration(0);
                });
        }
    }, [audioUrl, duration, onRecordingComplete]);

    const handleCancel = useCallback(() => {
        setHasRecording(false);
        setAudioUrl(null);
        setDuration(0);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    }, [audioUrl]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    return (
        <div className={`space-y-3 ${className}`}>
            {!hasRecording ? (
                <div className="flex items-center space-x-3">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`
              p-3 rounded-full transition-all duration-200 flex items-center justify-center
              ${
                  isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            `}
                    >
                        {isRecording ? (
                            <Square className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </button>

                    {isRecording && (
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">
                                Recording... {formatTime(duration)}
                            </span>
                            <span className="text-xs text-gray-500">
                                (Max: {formatTime(maxDuration)})
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handlePlay}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                </button>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Voice Message
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatTime(duration)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Send Voice Message
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
