/**
 * YegnaFarm — file upload + live camera capture for ml5 MobileNet image detection.
 * Call initYegnaImageDetection({ ... }) with element id strings after DOM is ready.
 */
(function (global) {
  "use strict";

  /**
   * @param {object} cfg
   * @param {string} cfg.imageInputId
   * @param {string} cfg.previewImageId
   * @param {string} cfg.analyzeBtnId
   * @param {string} cfg.resultTextId
   * @param {string} cfg.loadingIndicatorId
   * @param {string} [cfg.cameraVideoId]
   * @param {string} [cfg.captureCanvasId]
   * @param {string} [cfg.startCameraBtnId]
   * @param {string} [cfg.captureBtnId]
   * @param {string} [cfg.stopCameraBtnId]
   * @param {string} [cfg.cameraStatusId]
   */
  function initYegnaImageDetection(cfg) {
    const imageInput = document.getElementById(cfg.imageInputId);
    const previewImage = document.getElementById(cfg.previewImageId);
    const analyzeBtn = document.getElementById(cfg.analyzeBtnId);
    const resultText = document.getElementById(cfg.resultTextId);
    const loadingIndicator = document.getElementById(cfg.loadingIndicatorId);

    const cameraVideo = cfg.cameraVideoId
      ? document.getElementById(cfg.cameraVideoId)
      : null;
    const captureCanvas = cfg.captureCanvasId
      ? document.getElementById(cfg.captureCanvasId)
      : null;
    const startCameraBtn = cfg.startCameraBtnId
      ? document.getElementById(cfg.startCameraBtnId)
      : null;
    const captureBtn = cfg.captureBtnId
      ? document.getElementById(cfg.captureBtnId)
      : null;
    const stopCameraBtn = cfg.stopCameraBtnId
      ? document.getElementById(cfg.stopCameraBtnId)
      : null;
    const cameraStatus = cfg.cameraStatusId
      ? document.getElementById(cfg.cameraStatusId)
      : null;

    const hasCamera =
      cameraVideo &&
      captureCanvas &&
      startCameraBtn &&
      captureBtn &&
      stopCameraBtn &&
      cameraStatus;

    let classifier = null;
    let imageReady = false;
    let resizedDataUrl = "";
    let stream = null;

    const setCameraMessage = (msg) => {
      if (cameraStatus) cameraStatus.textContent = msg;
    };

    const applyPreviewFromDataUrl = (dataUrl) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 640;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        previewImage.src = resizedDataUrl;
        previewImage.style.display = "block";
        imageReady = true;
      };
      img.onerror = () => {
        resultText.textContent = "Could not read that image.";
      };
      img.src = dataUrl;
    };

    const showPreview = (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        applyPreviewFromDataUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    };

    /**
     * Fully release the camera: stop all MediaStream tracks, detach from the video element,
     * and reset the element so the OS/browser turns off the indicator (fixes "still recording").
     */
    const stopCamera = () => {
      const active =
        stream ||
        (cameraVideo && cameraVideo.srcObject) ||
        null;

      if (active instanceof MediaStream) {
        active.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            /* ignore */
          }
          try {
            track.enabled = false;
          } catch (e) {
            /* ignore */
          }
        });
      }

      stream = null;

      if (cameraVideo) {
        try {
          cameraVideo.pause();
        } catch (e) {
          /* ignore */
        }
        cameraVideo.srcObject = null;
        try {
          cameraVideo.removeAttribute("src");
          cameraVideo.load();
        } catch (e) {
          /* ignore */
        }
      }

      if (captureBtn) captureBtn.disabled = true;
      if (stopCameraBtn) stopCameraBtn.disabled = true;
      if (startCameraBtn) startCameraBtn.disabled = false;
      setCameraMessage("Camera stopped.");
    };

    const startCamera = async () => {
      if (!hasCamera) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraMessage("Camera is not supported in this browser.");
        return;
      }
      const localHosts = ["localhost", "127.0.0.1"];
      if (
        !window.isSecureContext &&
        !localHosts.includes(location.hostname)
      ) {
        setCameraMessage("Camera needs HTTPS (or open this site on localhost).");
        return;
      }
      try {
        stopCamera();
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        cameraVideo.srcObject = stream;
        await cameraVideo.play();
        setCameraMessage(
          "Camera on. Point at your crop or animal, then tap Capture."
        );
        captureBtn.disabled = false;
        stopCameraBtn.disabled = false;
        startCameraBtn.disabled = true;
      } catch (err) {
        setCameraMessage(
          "Could not open camera: " +
            (err && err.message ? err.message : "permission denied or no device")
        );
      }
    };

    const capturePhoto = () => {
      if (!hasCamera || !stream || !cameraVideo.videoWidth) return;
      const w = cameraVideo.videoWidth;
      const h = cameraVideo.videoHeight;
      captureCanvas.width = w;
      captureCanvas.height = h;
      const ctx = captureCanvas.getContext("2d");
      ctx.drawImage(cameraVideo, 0, 0, w, h);
      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
      applyPreviewFromDataUrl(dataUrl);
      setCameraMessage("Photo captured. Tap Analyze image when ready.");
    };

    const loadModel = () => {
      if (!navigator.onLine) {
        resultText.textContent = "No internet. Connect once to load the model.";
        return;
      }
      if (!global.ml5) {
        resultText.textContent = "AI library failed to load. Refresh the page.";
        return;
      }
      resultText.textContent = "Loading lightweight AI model...";
      analyzeBtn.disabled = true;
      loadingIndicator.style.display = "flex";
      classifier = global.ml5.imageClassifier(
        "MobileNet",
        () => {
          resultText.textContent = hasCamera
            ? "Model ready. Upload, or use the camera to capture a photo."
            : "Model ready. Upload an image.";
          analyzeBtn.disabled = false;
          loadingIndicator.style.display = "none";
        },
        { version: 1, alpha: 0.25 }
      );
    };

    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;
      showPreview(file);
    });

    analyzeBtn.addEventListener("click", () => {
      if (!classifier) {
        resultText.textContent = "Model not ready yet. Please wait...";
        return;
      }
      if (!imageReady) {
        resultText.textContent = "Please upload or capture an image first.";
        return;
      }
      resultText.textContent = "Analyzing...";
      loadingIndicator.style.display = "flex";
      const analysisImage = new Image();
      analysisImage.onload = () => {
        classifier.classify(analysisImage, (err, results) => {
          loadingIndicator.style.display = "none";
          if (err) {
            resultText.textContent = "Could not analyze the image.";
            return;
          }
          const best = results[0];
          resultText.textContent = `${best.label} (confidence ${(
            best.confidence * 100
          ).toFixed(1)}%)`;
        });
      };
      analysisImage.src = resizedDataUrl;
    });

    if (hasCamera) {
      startCameraBtn.addEventListener("click", startCamera);
      captureBtn.addEventListener("click", capturePhoto);
      stopCameraBtn.addEventListener("click", (e) => {
        e.preventDefault();
        stopCamera();
      });
      window.addEventListener("beforeunload", stopCamera);
      window.addEventListener("pagehide", stopCamera);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        startCameraBtn.disabled = true;
        setCameraMessage("Camera not available in this browser.");
      } else {
        setCameraMessage("Allow camera access when you tap Start camera.");
      }
    }

    window.addEventListener("load", loadModel);
    window.addEventListener("online", loadModel);
    window.addEventListener("offline", () => {
      resultText.textContent = "You are offline. Connect to load the AI model.";
    });
  }

  global.initYegnaImageDetection = initYegnaImageDetection;
})(typeof window !== "undefined" ? window : this);
