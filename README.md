# Image Processing

This is a project to show case my image processing explorations. This project maily implements applying different kind of filters and image processing techniques(eg. Gaussian, Haar Cacade detections) and neural network applications (depth map estimation, super resolution etc.).

## Tech Stack

* OpenCV
* React + Typescript
* WebRTC for media streaming
* Kurento Media Server
* NodeJS + Socket.io
* Docker & Docker Compose

## How it works

__WebRTC__ stands for Real Time Communication and it enables us to communicate between the two parties (peers) without involving the intermediate server. How this project structured is, via the fronted which is a __React__ application with __Typescript__ support, we gather user webcam stream and pass it to __Kurento__. Kurento is a media server with WebRTC support. 

Kurento has some basic building blocks called Kurento Modules like, webrtc endpoints, filters etc. You can read more about them from [here](https://doc-kurento.readthedocs.io/en/latest/features/kurento_modules.html). 

Filters are MediaElements that perform media processing, Computer Vision, Augmented Reality, and so on. We receive the frame and apply our opencv or neural network function and resend the frame.

I used sockets and NodeJS backend server as signalling server.

## Setup

* Install the KMS (Kurento Media Server)
    * I recommend using docker container to run the KMS

    Run the following command to build the KMS and expose the required ports.

    ```
    cd backend && docker-compose up -d
    ```

* Install dependecies for both backend and frontend
    ```
    cd backend && yarn

    cd frontend && yarn
    ```

* Start the server
    ```
    cd backend && yarn dev

    cd frontend && yarn dev
    ```

That's it, now you can enjoy the amazing opencv functions.


## TODO

* Implement different filters and connect to the media pipeline.
* Implement Kubernetes cluster to manage multiple KMS instances.
* Deploy the whole application to cloud.

> Any Contributions or suggestions are appreciated :)