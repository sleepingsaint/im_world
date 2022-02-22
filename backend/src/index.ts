import { Request, Response } from "express";
import { Socket } from "socket.io";
import kurento, {
    ClientInstance,
    IceCandidate,
    MediaPipeline,
    WebRtcEndpoint,
} from "kurento-client";
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

// creating server instances
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
var kurentoClient: ClientInstance | null = null;
// loading environment variables
require("dotenv").config();

const candidatesQueue: { [key: string]: RTCIceCandidate[] } = {};
const sessions: {[key: string]: {pipeline: MediaPipeline, webRTCEndpoint: WebRtcEndpoint}} = {};


io.on("connection", (socket: Socket) => {
    var socketId = socket.id;
    console.log(`[User Connected]: ${socketId}`);
    // iceCandidates[socketId] = {socket};

    socket.on("disconnect", () => {
        console.log("socket connection closed");
    });
    socket.on("data", (data: any) => {
        switch (data.event) {
            case "offer":
                start(socket, data.sdpOffer, (error, sdpAnswer) => {
                    if (error) {
                        return socket.emit("data", {
                            event: "error",
                            message: error,
                        });
                    } else if (sdpAnswer) {
                        return socket.emit("data", {
                            event: "answer",
                            answer: sdpAnswer,
                        });
                    }
                });
                break;
            case "stop":
                stop(socket.id);
                break;
            case "icecandidate":
                onIceCandidate(socket.id, data.candidate);
                break;
            default:
                console.log("invalid data")
                socket.emit("data", {
                    event: "error",
                    message: "Invalid Message",
                });
        }
        // console.log(data);
    });
});

app.get("/", (req: Request, res: Response) => res.send("hello world"));
server.listen(process.env.PORT, () =>
    console.log(`server listening on port ${process.env.PORT}`)
);

function getKurentoClient(
    callback: (error: string | null, client: ClientInstance | null) => void
) {
    if (kurentoClient) {
        return callback(null, kurentoClient);
    }
    kurento("http://localhost:8888/kurento").then(
        (client: ClientInstance) => {
            kurentoClient = client;
            callback(null, client);
        },
        (reason: any) => {
            console.log(reason);
            console.log("Could not find media server");
            return callback("Could not find media server at address", null);
        }
    );
}

function start(
    socket: Socket,
    sdpOffer: string,
    callback: (error: string | null, sdpAnswer?: string) => void
) {
    
    getKurentoClient((error, client) => {
        if (error) {
            return callback(error);
        }
        client?.create("MediaPipeline").then(
            (pipeline: MediaPipeline) => {
                pipeline.create("WebRtcEndpoint").then(
                    (webRTCEndpoint: WebRtcEndpoint) => {
                        if (candidatesQueue[socket.id]) {
                            while (candidatesQueue[socket.id].length) {
                                const candidate = candidatesQueue[socket.id].shift();
                                if(candidate !== undefined){
                                    webRTCEndpoint.addIceCandidate(candidate);
                                }
                            }
                        }

                        webRTCEndpoint.connect(webRTCEndpoint, () => {
                                webRTCEndpoint.on("OnIceCandidate", (event) => {
                                    const candidate = kurento.getComplexType("IceCandidate")(event.candidate);
                                    socket.emit("data", {
                                        event: "icecandidate",
                                        candidate
                                    })
                                })
                                webRTCEndpoint.processOffer(sdpOffer, (error: kurento.Error, sdpAnswer) => {
                                    if(error){
                                        pipeline.release();
                                        return callback(error.description);
                                    }
                                    
                                    sessions[socket.id] = {pipeline, webRTCEndpoint};
                                    return callback(null, sdpAnswer);
                                })

                                webRTCEndpoint.gatherCandidates((error: kurento.Error) => {
                                    if(error){
                                        return callback(error.description);
                                    }
                                })
                        })
                    },
                    (reason: any) => {
                        pipeline.release();
                        return callback(reason);
                    }
                );
            },
            (reason: any) => {
                return callback(reason);
            }
        );
    });
}

function stop(sessionId: string) {
    if(sessions[sessionId]){
        const pipeline = sessions[sessionId].pipeline;
        console.info('Releasing pipeline');
        pipeline.release();

        const endpoint = sessions[sessionId].webRTCEndpoint;
        console.info("Releasing endpoint");
        endpoint.release();

        delete sessions[sessionId];
        delete candidatesQueue[sessionId];
    }
}

function onIceCandidate(sessionId: string, _candidate: string) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (sessions[sessionId]) {
        const webRtcEndpoint = sessions[sessionId].webRTCEndpoint;
        webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}