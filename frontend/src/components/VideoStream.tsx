import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlug } from "react-icons/fa";
import { io, Socket } from "socket.io-client";

enum SocketEvents {
    IceCandidate = "icecandidate",
    Offer = "offer",
    Answer = "answer",
    Stop = "stop",
}
enum ConnectionState {
    Disconnected = 0,
    Connecting,
    Connected,
    Disconnecting,
}

interface VideoStreamProps extends React.HTMLAttributes<HTMLDivElement> {}
const VideoStream: React.FC<VideoStreamProps> = (props) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);

    const [pc, setPc] = useState<RTCPeerConnection | undefined>();
    const [socket, setSocket] = useState<Socket>();

    const [mediaConnectionState, setMediaConnectionState] =
        useState<ConnectionState>(ConnectionState.Disconnected);
    const [socketConnectionState, setSocketConnectionState] =
        useState<ConnectionState>(ConnectionState.Disconnected);

    const getButtonState = useCallback(() => {
        if (
            mediaConnectionState === ConnectionState.Connected &&
            socketConnectionState === ConnectionState.Connected
        ) {
            return "Stop Stream";
        } else if (socketConnectionState === ConnectionState.Connected) {
            return "Waiting for stream";
        } else {
            return "Start Stream";
        }
    }, [mediaConnectionState, socketConnectionState]);

    const init = () => {
        if (
            localRef.current &&
            remoteRef.current &&
            socket &&
            mediaConnectionState === ConnectionState.Connected &&
            socketConnectionState === ConnectionState.Connected
        ) {
            socket.emit("data", { event: SocketEvents.Stop });
            socket.disconnect();

            localRef.current.srcObject = null;
            remoteRef.current.srcObject = null;

            setSocket(undefined);
            setPc(undefined);

            return;
        }
        const servers = {
            iceServers: [
                {
                    urls: [
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                    ],
                },
            ],
            iceCandidatePoolSize: 10,
        };

        // creating RTC and socket objects
        const pc = new RTCPeerConnection(servers);

        const _socket = io("ws://localhost:3000", { autoConnect: false });

        console.log("Creating a socket connection");
        _socket.on("connect", () => {
            setSocketConnectionState(ConnectionState.Connected);
            console.log("Socket Connection Established");
        });

        _socket.on("data", (data) => {
            switch (data.event) {
                case SocketEvents.IceCandidate:
                    pc.addIceCandidate(data.candidate);
                    break;
                case SocketEvents.Answer:
                    pc.setRemoteDescription(
                        new RTCSessionDescription({
                            type: "answer",
                            sdp: data.answer,
                        })
                    );
                    break;
                default:
                    console.log("Invalid message");
                    break;
            }
        });

        _socket.on("disconnect", (reason) => {
            setSocketConnectionState(ConnectionState.Disconnected);
            console.log(reason);
        });

        _socket.connect();
        setSocketConnectionState(ConnectionState.Connecting);
        setSocket(_socket);
        setPc(pc);
    };

    useEffect(() => {
        async function connectMediaServer() {
            if (
                socketConnectionState &&
                pc &&
                socket &&
                localRef &&
                localRef.current &&
                remoteRef &&
                remoteRef.current
            ) {
                // generating offer description
                // onicecandiate event is added before
                // generating offer because the pc object starts
                // producting candidates as soon as local offer has been set
                pc.onicecandidate = (event) => {
                    event.candidate &&
                        socket.emit("data", {
                            event: "icecandidate",
                            candidate: event.candidate.toJSON(),
                        });
                };

                // getting the localstream
                let localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                localStream
                    .getTracks()
                    .forEach((track) => pc.addTrack(track, localStream));

                // adding stream from server to remote stream object
                let remoteStream = new MediaStream();
                pc.ontrack = (event) => {
                    event.streams[0]
                        .getTracks()
                        .forEach((track) => remoteStream.addTrack(track));
                    setMediaConnectionState(ConnectionState.Connected);
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                // sending offer to the backend
                socket.emit("data", {
                    event: SocketEvents.Offer,
                    sdpOffer: offerDescription.sdp,
                });
                localRef.current.srcObject = localStream;
                remoteRef.current.srcObject = remoteStream;
                setMediaConnectionState(ConnectionState.Connecting);
            }
        }
        connectMediaServer();
    }, [socketConnectionState]);

    if (socketConnectionState === ConnectionState.Connecting) {
        return (
            <div className="flex-1  flex justify-center items-center">
                <FaPlug className="mr-2" /> Making Socket Connection...
            </div>
        );
    }

    return (
        <div className="flex-1 p-16">
            <div className="w-full flex justify-evenly">
                <video
                    className="w-[640px] h-[480px] bg-slate-400"
                    autoPlay
                    ref={localRef}
                    style={{ transform: "scaleX(-1)" }}
                ></video>
                <video
                    className="w-[640px] h-[480px] bg-slate-400"
                    autoPlay
                    ref={remoteRef}
                    style={{ transform: "scaleX(-1)" }}
                ></video>
            </div>
            <div className="flex justify-center my-4">
                <button
                    onClick={init}
                    className="bg-slate-700 hover:bg-slate-900 text-white p-2 px-6 rounded mx-auto"
                >
                    {getButtonState()}
                </button>
            </div>
        </div>
    );
};

export default VideoStream;
