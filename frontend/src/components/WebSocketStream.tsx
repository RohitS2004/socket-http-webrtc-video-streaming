import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "../assets/icons"
import { StreamProps } from "./HttpStream";

const WebSocketStream = (props: StreamProps) => {

    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaRec, setMediaRec] = useState<MediaRecorder>();
    const [socket, setSocket] = useState<WebSocket>();
    const mimeCode = "video/webm; codecs=vp9";

    const handlePlay = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();

        // Create a Media Recorder
        // Start the recorder 
        // And when the data arrives send that blob to the socket server

        const mediaRecorder = new MediaRecorder(props.stream, { mimeType: mimeCode });
        setMediaRec(mediaRecorder);

        mediaRecorder.start(100); // Time Slice 

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            const blob = e.data;

            blob.arrayBuffer()
            .then((arrayBuff: ArrayBuffer) => {

                socket?.send(arrayBuff);

            })
            .catch((error: any) => {
                console.log("Something went wrong while sending the blob to the backend ", error.message);
            })
        }
        
    }

    const handlePause = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();

        mediaRec?.stop();

        videoRef.current!.src = "";
    }

    useEffect(() => {
        
        const ws = new WebSocket("ws://localhost:3000");
        setSocket(ws);

        const mediaSource = new MediaSource();
        videoRef.current!.src = URL.createObjectURL(mediaSource);

        let sourceBuffer: SourceBuffer | null = null;
        let blobQueue: Blob[] = [];

        const appendBlob = () => {

            if (blobQueue.length > 0 && sourceBuffer && !sourceBuffer!.updating) {

                const blob = blobQueue.shift();
                blob?.arrayBuffer()
                .then((arrayBuff: ArrayBuffer) => {
                    sourceBuffer?.appendBuffer(arrayBuff);
                })
                .catch((error: any) => {
                    console.log("Something went wrong while appending the blob ", error.message);
                })

            }

        }

        mediaSource.addEventListener("sourceopen", () => {

            sourceBuffer = mediaSource.addSourceBuffer(mimeCode);
            sourceBuffer.addEventListener("updateend", appendBlob);

        })

        ws.onmessage = (message) => {
            const arrayBuff = message.data;

            const blob = new Blob([arrayBuff], { type: mimeCode });
            blobQueue.push(blob);

            appendBlob();
        }

        return () => {
            ws.close();
        }

    }, [])

    return (
        <div
        className="flex-1 border-2 border-white rounded-sm flex flex-col items-center gap-2 p-2"
        >

        <div
        className="flex justify-between p-2 items-center w-full"
        >
            <h2
            className="text-whihte font-semibold flex-grow text-center"
            >
                Socket Stream
            </h2>
            <div
            className="flex gap-2 items-center"
            >

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
    )
}

export default WebSocketStream;