import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "../assets/icons";
import { StreamProps } from "./HttpStream";

const WebSocketStream = (props: StreamProps) => {

    const [mediaRec, setMediaRec] = useState<MediaRecorder | null>(null);
    const [socket, setSocket] = useState<WebSocket>();
    const mimeCode = "video/webm; codecs=vp9";
    
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const handlePause = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        mediaRec?.stop();
        videoRef.current!.src = "";
    }

    const handlePlay = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();

        const mediaRecorder = new MediaRecorder(props.stream);
        setMediaRec(mediaRecorder);

        mediaRecorder.start(100);

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            const blob: Blob = e.data;

            blob.arrayBuffer()
            .then((arrayBuff: ArrayBuffer) => {
                // Send this array buff to the socket server and then the server will transmit them to all the connected clients
                socket?.send(arrayBuff);
            })
            .catch((error: any) => {
                console.log("Something went wrong while converting the blob to array buffer on line 35 in Socket Stream ", error.message);
            })
        }
    }

    useEffect(() => {

        console.log("Page reloaded");

        const ws = new WebSocket("ws://localhost:3000");
        setSocket(ws);

        const mediaSource = new MediaSource();
        videoRef.current!.src = URL.createObjectURL(mediaSource);

        let sourceBuffer: SourceBuffer | null = null;
        const blobQueue: Blob[] = [];

        const appendBlobToSourceBuffer = () => {        
                
            if (blobQueue.length > 0 && sourceBuffer && !sourceBuffer?.updating && mediaSource.readyState === "open") {
                const blob = blobQueue.shift();

                blob?.arrayBuffer()
                .then((arrayBuff: ArrayBuffer) => {
                    sourceBuffer?.appendBuffer(arrayBuff);
                })
                .catch((error: any) => {
                    console.log("Something went wrong while appending the blob to the source buffer on line 59 in Socket stream ", error.message);
                })
            }
        }

        mediaSource.addEventListener("sourceopen", () => {
            console.log("Media Source is opened.");

            sourceBuffer = mediaSource.addSourceBuffer(mimeCode);
            sourceBuffer.addEventListener("updateend", appendBlobToSourceBuffer)
        })

        mediaSource.addEventListener("sourceclose", () => {
            console.log("Media Source is closed.")
        })

        ws.onmessage = (message) => {
            console.log("Media source state when data starts arriving: ", mediaSource.readyState);

            const arrayBuff = message.data;

            const blob = new Blob([arrayBuff], { type: mimeCode});

            blobQueue.push(blob);

            appendBlobToSourceBuffer();

        }


        return () => {
            ws.close();
        }

    }, [])

    return (
        <div
        className="flex-1 border-2 border-white rounded-sm flex flex-col items-center gap-2 p-2"
        >
            <div className="flex justify-between p-2 items-center w-full">
                <h2
                className="text-white font-semibold flex-grow text-center"
                >
                    Socket Stream
                </h2>

                <div
                className="flex gap-2 items-center"
                >
                    <div
                    className="hover:cursor-pointer"
                    onClick={(e) => handlePlay(e)}
                    >
                        < Play 
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

export default WebSocketStream;