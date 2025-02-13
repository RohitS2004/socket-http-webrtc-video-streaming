import { useRef, useState } from "react";
import { Pause, Play } from "../assets/icons";
import axios from "axios";

export interface StreamProps {
    stream: MediaStream;
}

const HttpStream = (props: StreamProps) => {
    // When the user clicks on the Play button show the video stream in the video element
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaRec, setMediaRec] = useState<MediaRecorder>();

    const mimeCode = "video/webm; codecs=vp9";

    const handlePlay = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        // Create a Media Recorder and record the stream 
        // set the ondataavailable event listener

        const mediaRecorder = new MediaRecorder(props.stream, { mimeType: mimeCode });
        setMediaRec(mediaRecorder);

        const mediaSource = new MediaSource();
        let sourceBuffer: SourceBuffer | null = null;
        let blobQueue: Blob[] = [];

        const appendBlobToSourceBuff = () => {
            if (blobQueue.length > 0 && sourceBuffer && !sourceBuffer?.updating) {
                const blob = blobQueue.shift();

                blob?.arrayBuffer()
                .then((arrayBuff: ArrayBuffer) => {
                    sourceBuffer?.appendBuffer(arrayBuff);
                })
                .catch((error: any) => {
                    console.log("Something went wrong while appending to the source buffer on line 32 in Http stream", error.message);
                })

            }
        }

        videoRef.current!.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener("sourceopen", () => {
            sourceBuffer = mediaSource.addSourceBuffer(mimeCode);

            sourceBuffer.addEventListener("updateend", () => {
                appendBlobToSourceBuff();
            })
        })

        mediaRecorder.start(50); // Defining the time slice

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            const blob = e.data;

            blob.arrayBuffer()
            .then((arrayBuff: ArrayBuffer) => {
                axios.post("/stream", arrayBuff, {
                    headers: {
                        "Content-Type": "application/octet-stream",
                    },
                    responseType: "arraybuffer"
                })
                .then((res: any) => {
                    const arrayBuffReceived: ArrayBuffer = res.data;

                    const blob = new Blob([arrayBuffReceived], { type: mimeCode })

                    blobQueue.push(blob);

                    appendBlobToSourceBuff();
                })
            })
            .catch((error: any) => {
                console.log("Something Went Wrong in HTTP Stream Line 38: ", error.message);
            })
        }
    }

    const handlePause = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        // The recorder should stop recording
        // No need to stop the stream
        mediaRec?.stop();
        videoRef.current!.src = "";
    }

    return (
        <div
        className="flex-1 border-2 border-white rounded-sm flex flex-col items-center gap-2 p-2"
        >
            <div className="flex justify-between p-2 items-center w-full">
                <h2
                className="text-white font-semibold flex-grow text-center"
                >
                    Http Stream
                </h2>

                <div
                className="flex gap-2 items-center"
                >
                    <div
                    className="hover:cursor-pointer"
                    onClick={(e) => handlePlay(e)}
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
                    onClick={(e) => handlePause(e)}
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
            autoPlay // Need to use this attribute to play the video 
            muted
            className="-scale-x-100"
            ></video>

        </div>
    )
}

export default HttpStream;