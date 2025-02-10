import { useEffect, useRef, useState } from "react";

type Payload_Type = "blob";

export interface IMessage {
    payload_type: Payload_Type;
    main_payload: Blob;
}

function App() {
    const socketVideoRef = useRef<HTMLVideoElement>(null);
    const webrtcVideoRef = useRef<HTMLVideoElement>(null);

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
    const [socket, setSocket] = useState<WebSocket>();
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
                webrtcVideoRef.current!.srcObject = stream;
                webrtcVideoRef.current!.play();

                const recorder = new MediaRecorder(stream, {
                    mimeType: mimeCode,
                });
                setMediaRecorder(recorder);

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
        mediaRecorder?.stop();
        mediaRecorder?.stream.getTracks().forEach((track) => {
            track.stop();
        });

        socketVideoRef.current!.src = ""
    };

    const handleWebRTCRecordingStart = async () => {};

    const handleWebRTCRecordingStop = async () => {};

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3000");
        setSocket(ws);

        // Create a MediaSource
        // Open the MediaSource by associating it the media element
        // Attact a event listener, with sourceopen and in that set the SourceBuffer with compatible MIME code
        // And then attact a event listener to the SourceBuffer also with updatened event
        // In which check the blob queue length and the Source Buffer updating state, if not updating and length is not 0 then cxall the append function
        // In the append function, check if we have the Source Buffer available, and the length of the blob queue is not 0 and the state of source buffer is not updating then get the blob from the queue using the shift function, then append this to the Source Buffer 
        // And after receiving the blob from the backend add it to the blob queue and check if the source buffer is available and the source buffer is not updating then call the append function

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
            })
        })

        const appendBlob = () => {
            if (sourceBuffer && !sourceBuffer.updating && blobQueue.length > 0) {
                const blob = blobQueue.shift();

                blob?.arrayBuffer().then((arrayBuff: ArrayBuffer) => sourceBuffer?.appendBuffer(arrayBuff));
            }
        }

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
        <div className="max-w-full min-h-screen bg-slate-950 font-poppins">
            <main className="min-h-screen p-2 flex gap-2 max-md:flex-col">
                <section className="flex-1 flex flex-col gap-2 p-2 border-2 border-white rounded-md">
                    <div className="flex-grow w-full text-white flex flex-col gap-1 justify-center items-center">
                        <h1 className="text-xl font-semibold">Socket Stream</h1>
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

                <section className="flex-1 flex flex-col gap-2 p-2 border-2 border-white rounded-md">
                    <div className="flex-grow w-full text-white flex flex-col gap-1 justify-center items-center">
                    <h1 className="text-xl font-semibold">Media Source API</h1>
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
