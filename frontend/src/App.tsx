import { useEffect, useRef, useState } from "react";
import axios from "axios";

type Payload_Type = "blob";

export interface IMessage {
    payload_type: Payload_Type;
    main_payload: Blob;
}

function App() {
    const socketVideoRef = useRef<HTMLVideoElement>(null);
    const webrtcVideoRef = useRef<HTMLVideoElement>(null);

    const [socketMediaRecorder, setSocketMediaRecorder] =
        useState<MediaRecorder>();
    const [rtcMediaRecorder, setRtcMediaRecorder] = useState<MediaRecorder>();
    const [socket, setSocket] = useState<WebSocket>();
    const [stream, setStream] = useState<MediaStream>();

    const mimeCode = "video/webm; codecs=vp9";

    const handleSocketRecordingStart = async () => {
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    frameRate: { ideal: 60, max: 60 },
                    facingMode: "user",
                },
            })
            .then((stream: MediaStream) => {
                setStream(stream);

                const recorder = new MediaRecorder(stream, {
                    mimeType: mimeCode,
                });
                setSocketMediaRecorder(recorder);

                recorder.start(100);

                recorder.ondataavailable = (e: BlobEvent) => {
                    // blob type: video/mp4; codecs="avc1.42E01E, mp4a.40.2"
                    // video/webm; codecs=vp9

                    const blob_data = e.data;
                    socket?.send(blob_data);
                };
            });
    };

    const handleSocketRecordingStop = async () => {
        socketMediaRecorder?.stop();
        socketMediaRecorder?.stream.getTracks().forEach((track) => {
            track.stop();
        });

        socketVideoRef.current!.src = "";
    };

    const handleWebRTCRecordingStart = async () => {
    
        const recorder = new MediaRecorder(stream!, {
            mimeType: mimeCode,
        });
        setRtcMediaRecorder(recorder);

        const mediaSource = new MediaSource();
        const blobQueue: Blob[] = []; 
        let sourceBuffer: SourceBuffer | null = null;

        const appendBlob = () => {

            console.log("Appending the Blobs...")
            
            if (blobQueue.length > 0 && !sourceBuffer!.updating && sourceBuffer) {
                const blob = blobQueue.shift() // removes the first element from the list and returns it
                blob?.arrayBuffer()
                .then((arrayBuff: ArrayBuffer) => {
                    sourceBuffer?.appendBuffer(arrayBuff);
                })
            }

        }

        webrtcVideoRef.current!.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener("sourceopen", () => {

            sourceBuffer = mediaSource.addSourceBuffer(mimeCode);

            sourceBuffer.addEventListener("updateend", () => {
                if (blobQueue.length > 0 && !sourceBuffer?.updating) {
                    appendBlob();
                }
            })

        })

        recorder.start(100);
        recorder.ondataavailable = (event: BlobEvent) => {
            
            const blob: Blob = event.data; // Maybe the problem is here, we are capturing the blob data so fast that the data we receive from the server quite late camparing to the blobs received

            blob.arrayBuffer()
            .then((arrayBuff: ArrayBuffer) => {

                // Send this arrayBuff to the backend server
                axios.post("/stream", arrayBuff, {
                    headers: {
                        "Content-Type": "application/octect-stream"
                    },
                    responseType: "arraybuffer"
                })
                .then((res: any) => {

                    const arrayBuff: ArrayBuffer = res.data;

                    const newBlob = new Blob([arrayBuff], { type: mimeCode });

                    blobQueue.push(newBlob);

                    if (blobQueue.length > 0 && !sourceBuffer!.updating) {
                        appendBlob();
                    }

                })
                .catch((error: any) => {
                    console.log(error.message);
                })

            })

        }
        
    };

    const handleWebRTCRecordingStop = async () => {};

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3000");
        setSocket(ws);

        const mediaSource = new MediaSource();
        socketVideoRef.current!.src = URL.createObjectURL(mediaSource);

        let sourceBuffer: SourceBuffer | null = null;
        const blobQueue: Blob[] = [];

        mediaSource.addEventListener("sourceopen", () => {
            sourceBuffer = mediaSource.addSourceBuffer(mimeCode);

            sourceBuffer.addEventListener("updateend", () => {
                if (blobQueue.length > 0 && !sourceBuffer?.updating) {
                    appendBlob();
                }
            });
        });

        const appendBlob = () => {
            if (
                sourceBuffer &&
                !sourceBuffer.updating &&
                blobQueue.length > 0
            ) {
                const blob = blobQueue.shift();

                blob?.arrayBuffer().then((arrayBuff: ArrayBuffer) =>
                    sourceBuffer?.appendBuffer(arrayBuff)
                );
            }
        };

        ws.onmessage = async (message) => {
            const blob = new Blob([message.data], {
                type: mimeCode,
            });

            blobQueue.push(blob);

            if (sourceBuffer && !sourceBuffer.updating) {
                appendBlob();
            }
        };

        return () => {
            socket?.close();
        };
    }, []);

    return (
        <div className="max-w-full min-h-screen bg-slate-100 font-poppins">
            <main className="min-h-screen p-2 flex gap-2 max-md:flex-col">
                <section className="flex-1 flex flex-col gap-2 p-2 border-2 border-black rounded-md">
                    <div className="flex-grow w-full text-white flex flex-col gap-1 justify-center items-center">
                        <h1 className="text-xl text-black font-semibold">
                            Socket Stream
                        </h1>
                        <video
                            id="socket-video"
                            className="w-full h-full -scale-x-100"
                            ref={socketVideoRef}
                            muted
                            autoPlay
                        ></video>
                    </div>

                    <div className="flex items-center gap-2 ">
                        <button
                            className="bg-blue-400 flex-1 p-2 font-semibold text-lg hover:opacity-50 transition-all duration-100 ease-in-out rounded-md active:scale-95 hover:cursor-pointer"
                            onClick={handleSocketRecordingStart}
                        >
                            Start Recording
                        </button>

                        <button
                            className="bg-red-400 flex-1 p-2 font-semibold text-lg hover:opacity-50 transition-all duration-100 ease-in-out rounded-md active:scale-95 hover:cursor-pointer"
                            onClick={handleSocketRecordingStop}
                        >
                            Stop Recording
                        </button>
                    </div>
                </section>

                <section className="flex-1 flex flex-col gap-2 p-2 border-2 border-black rounded-md">
                    <div className="flex-grow w-full text-white flex flex-col gap-1 justify-center items-center">
                        <h1 className="text-xl text-black font-semibold">
                            HTTP Stream
                        </h1>
                        <video
                            id="rtc-video"
                            className="w-full h-full -scale-x-100"
                            ref={webrtcVideoRef}
                        ></video>
                    </div>

                    <div className="flex items-center gap-2 ">
                        <button
                            className="bg-blue-400 flex-1 p-2 font-semibold text-lg hover:opacity-50 transition-all duration-100 ease-in-out rounded-md active:scale-95 hover:cursor-pointer"
                            onClick={handleWebRTCRecordingStart}
                        >
                            Start Recording
                        </button>

                        <button
                            className="bg-red-400 flex-1 p-2 font-semibold text-lg hover:opacity-50 transition-all duration-100 ease-in-out rounded-md active:scale-95 hover:cursor-pointer"
                            onClick={handleWebRTCRecordingStop}
                        >
                            Stop Recording
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
