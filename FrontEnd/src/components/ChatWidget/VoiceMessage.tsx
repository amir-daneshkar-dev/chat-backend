import { useRef, useState, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";

export default function VoiceMessage({ message }: { message: any }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;

        const onTimeUpdate = () => {
            if (audio && audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const onEnded = () => {
            setPlaying(false);
            setProgress(0);
        };

        audio?.addEventListener("timeupdate", onTimeUpdate);
        audio?.addEventListener("ended", onEnded);

        return () => {
            audio?.removeEventListener("timeupdate", onTimeUpdate);
            audio?.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play();
            setPlaying(true);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 justify-between min-w-[160px]">
                <div className="flex-row items-center gap-2 flex w-[calc(100%-25px)] ">
                    <div className="h-2 bg-black/20 rounded-full w-[calc(100%-15px)]">
                        <div
                            className="h-2 bg-white rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className="text-xs opacity-75  w-[15px]">
                        {audioRef.current
                            ? Math.round(audioRef.current.currentTime)
                            : message.voice_duration}
                        s
                    </p>
                </div>
                <div
                    className="p-1 hover:bg-black/10 rounded cursor-pointer w-[25px]"
                    onClick={togglePlay}
                >
                    {playing ? (
                        <Pause className="h-6 w-6" />
                    ) : (
                        <Play className="h-6 w-6" />
                    )}
                </div>
                <a
                    href={message.file_url}
                    download={message.file_name}
                    className="p-1 hover:bg-black/10 rounded"
                    target="_blank"
                >
                    <Download className="h-4 w-4" />
                </a>

                {/* Hidden audio element */}
            </div>
            <audio ref={audioRef}>
                <source src={message.file_url} type="audio/webm" />
            </audio>
        </>
    );
}
