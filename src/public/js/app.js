const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelection = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let iceCandidateQueue = [];

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (camera.label === currentCamera.label) {
        option.selected = true;
      }
      camerasSelection.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: {
      facingMode: "user",
    },
  };

  const cameraConstraints = {
    audio: true,
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

muteBtn.addEventListener("click", () => {
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (muted) {
    muteBtn.innerText = "Mute";
    muted = false;
  } else {
    muteBtn.innerText = "Unmute";
    muted = true;
  }
});

cameraBtn.addEventListener("click", () => {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
});

camerasSelection.addEventListener("input", async () => {
  await getMedia(camerasSelection.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
});

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
async function initCall() {
  call.hidden = false;
  welcome.hidden = true;
  await getMedia();
  makeConnection();
}

welcomeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
});

// Socket Code
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("dataChannel");
  console.log(myDataChannel);
  myDataChannel.addEventListener("message", (e) => {
    console.log(e.data);
  });
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (dataChannelEvent) => {
    myDataChannel = dataChannelEvent.channel;
    myDataChannel.addEventListener("message", (e) => {
      console.log(e.data);
    });
    myDataChannel.addEventListener("open", () => {
      myDataChannel.send("hi");
    });
  });
  await myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  await myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  // Process the queued ICE candidates
  iceCandidateQueue.forEach((candidate) => {
    myPeerConnection.addIceCandidate(candidate).catch((e) => console.error(e));
  });
  iceCandidateQueue = [];
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer).then(() => {
    // Process the queued ICE candidates
    iceCandidateQueue.forEach((candidate) => {
      myPeerConnection
        .addIceCandidate(candidate)
        .catch((e) => console.error(e));
    });
    iceCandidateQueue = [];
  });
});

socket.on("ice", (ice) => {
  if (myPeerConnection.remoteDescription) {
    myPeerConnection.addIceCandidate(ice).catch((e) => console.error(e));
  } else {
    iceCandidateQueue.push(ice);
  }
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", (data) => {
    socket.emit("ice", data.candidate, roomName);
  });
  myPeerConnection.addEventListener("addstream", (data) => {
    const peersFace = document.getElementById("peersFace");
    peersFace.srcObject = data.stream;
  });
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}
