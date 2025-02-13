import { useEffect, useState } from "react";
import {
    HttpStream,
    MediaSourceStream,
    WebRtcStream,
    WebSocketStream,
} from "./components";

function App() {

    const [stream, setStream] = useState<MediaStream>();

    useEffect(() => {
        
        // Get the user video stream
        navigator.mediaDevices.getUserMedia({
            video: {
                frameRate: { ideal: 30, max: 60 },
                facingMode: "user", // To access the front camera
            }
        })
        .then((st: MediaStream) => {
            // Set the media stream
            setStream(st);
        })
        .catch((error: any) => {
            console.log("Something went wrong while capturing the video stream ", error.message);
        })

    }, [])

    return (
        <div className="max-w-full min-h-screen bg-slate-950 flex justify-center">
            <main className="min-h-screen max-w-2xl flex flex-col gap-2 p-2">
                <div
                className="flex flex-1 gap-2 p-2"
                >
                    <HttpStream 
                    stream={stream!}
                    />
                    <MediaSourceStream 
                    stream={stream!}
                    />
                </div>

                <div
                className="flex flex-1 gap-2 p-2"
                >
                    <WebRtcStream />
                    <WebSocketStream 
                    stream={stream!}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;