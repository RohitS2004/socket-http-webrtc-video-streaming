import { useRef } from "react";
import { Pause, Play } from "../assets/icons";
import { StreamProps } from "./HttpStream";

const MediaSourceStream = (props: StreamProps) => {

    const videoRef = useRef<HTMLVideoElement>(null);
    
    const handlePlay = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        videoRef.current!.srcObject = props.stream;
    }

    const handlePause = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        videoRef.current!.srcObject = null;
    }

    return (
        <div className="flex-1 border-2 border-white rounded-sm flex flex-col items-center gap-2 p-2">
            <div className="flex justify-between p-2 items-center w-full">
                <h2 className="text-white font-semibold flex-grow text-center">MediaSource Stream</h2>

                <div className="flex gap-2 items-center">
                    <div
                    className="hover:cursor-pointer"
                    onClick={(e) => {handlePlay(e)}}
                    >
                        <Play
                            width={20}
                            height={20}
                            strokeColor="#0F0"
                            strokeWidth={2}
                        />
                    </div>

                    <div
                    className="hover:cursor-pointer"
                    onClick={(e) => {handlePause(e)}}
                    >
                        <Pause
                            width={20}
                            height={20}
                            strokeColor="#F00"
                            strokeWidth={2}
                        />
                    </div>
                </div>
            </div>

            <video 
            ref={videoRef}
            autoPlay
            muted
            className="-scale-x-100"
            ></video>
        </div>
    );
};

export default MediaSourceStream;
