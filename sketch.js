import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

let faceLandmarker;
let video = document.getElementById("camara");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const resultado = document.getElementById("resultado");

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (err) {
    console.error("No se pudo acceder a la cámara:", err);
    resultado.textContent = "Error al acceder a la cámara";
  }
}

async function initMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numFaces: 1
  });
}

function detectar() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const processFrame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nowInMs = performance.now();
    const detections = faceLandmarker.detectForVideo(video, nowInMs);

    if (detections.faceLandmarks.length > 0) {
      const landmarks = detections.faceLandmarks[0];
      const drawingUtils = new DrawingUtils(ctx);

      // Malla general de la cara
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#00FF00", lineWidth: 1 }
      );
      // Ojo derecho
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030", lineWidth: 2 }
      );
      // Ojo izquierdo
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#FF3030", lineWidth: 2 }
      );
      // Labios
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#FF0080", lineWidth: 2 }
      );
      // Contorno del rostro
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#00CFFF", lineWidth: 2 }
      );

      resultado.textContent = "Cara detectada";
    } else {
      resultado.textContent = "Acerca tu cara a la cámara...";
    }

    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
}

document.getElementById("activarcamara").addEventListener("click", async () => {
  resultado.textContent = "Cargando modelo y cámara...";
  await iniciarCamara();
  await initMediaPipe();
  detectar();
});