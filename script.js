// Existing DOM Elements
const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const previewSection = document.getElementById("preview-section");
const origPreview = document.getElementById("orig-preview");
const outputCanvas = document.getElementById("output-canvas");
const ctx = outputCanvas.getContext("2d");
const origMeta = document.getElementById("orig-meta");
const outputMeta = document.getElementById("output-meta");
const downloadBtn = document.getElementById("download-btn");
const qSlider = document.getElementById("compress-quality");
const wSlider = document.getElementById("max-width");
const formatSelect = document.getElementById("output-format");
const fBrightness = document.getElementById("filter-brightness");
const fContrast = document.getElementById("filter-contrast");
const fSaturation = document.getElementById("filter-saturation");
const fBlur = document.getElementById("filter-blur");
const fGrayscale = document.getElementById("filter-grayscale");

// New Feature DOM Elements
const darkModeToggle = document.getElementById("dark-mode-toggle");
const rotateSlider = document.getElementById("rotate-slider");
const flipHBtn = document.getElementById("flip-h-btn");
const flipVBtn = document.getElementById("flip-v-btn");
const presetSelect = document.getElementById("preset-select");

// Core State Variables
let sourceImage = new Image();
let originalFileSize = 0;
let originalFileName = "processed_image";
const allowed = ["image/jpeg", "image/png", "image/webp"];

// New Transform State Variables
let currentRotation = 0;
let isFlippedH = false;
let isFlippedV = false;

// Dark Mode Toggle Logic
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  darkModeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// File Upload & Drag-and-Drop Event Listeners
fileInput.addEventListener("change", handleFileSelect);
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  const isDark = document.body.classList.contains("dark-mode");
  dropZone.style.background = isDark ? "#252525" : "#edf4fe";
});

dropZone.addEventListener("dragleave", () => {
  resetDropZoneBackground();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  resetDropZoneBackground();
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    handleFileSelect();
  }
});

function resetDropZoneBackground() {
  const isDark = document.body.classList.contains("dark-mode");
  dropZone.style.background = isDark ? "#1e1e1e" : "#fff";
}

// Preset Filters Logic
presetSelect.addEventListener("change", () => {
  const preset = presetSelect.value;

  switch (preset) {
    case "vintage":
      brightness = 95;
      contrast = 90;
      saturation = 60;
      fGrayscale.value = 15;
      fSaturation.value = 50;
      fContrast.value = 85;
      fBrightness.value = 95;
      fBlur.value = 0;
      break;
    case "monochrome":
      fGrayscale.value = 100;
      fSaturation.value = 0;
      fContrast.value = 120;
      fBrightness.value = 100;
      fBlur.value = 0;
      break;
    case "vibrant":
      fGrayscale.value = 0;
      fSaturation.value = 160;
      fContrast.value = 110;
      fBrightness.value = 100;
      fBlur.value = 0;
      break;
    case "cool":
      fGrayscale.value = 10;
      fSaturation.value = 80;
      fContrast.value = 95;
      fBrightness.value = 90;
      fBlur.value = 0;
      break;
    case "warm":
      fGrayscale.value = 0;
      fSaturation.value = 130;
      fContrast.value = 100;
      fBrightness.value = 105;
      fBlur.value = 0;
      break;
    default: // custom/none resets to standard
      fGrayscale.value = 0;
      fSaturation.value = 100;
      fContrast.value = 100;
      fBrightness.value = 100;
      fBlur.value = 0;
      break;
  }

  updateSliderLabels();
  processImage();
});

// Transform Event Listeners
rotateSlider.addEventListener("input", () => {
  currentRotation = parseInt(rotateSlider.value, 10);
  document.getElementById("rotate-val").textContent = `${currentRotation}°`;
  processImage();
});

flipHBtn.addEventListener("click", () => {
  isFlippedH = !isFlippedH;
  flipHBtn.classList.toggle("active-transform", isFlippedH);
  processImage();
});

flipVBtn.addEventListener("click", () => {
  isFlippedV = !isFlippedV;
  flipVBtn.classList.toggle("active-transform", isFlippedV);
  processImage();
});

// Slider Inputs Array Mapping
const sliders = [
  qSlider,
  wSlider,
  fBrightness,
  fContrast,
  fSaturation,
  fBlur,
  fGrayscale,
];

sliders.forEach((slider) => {
  slider.addEventListener("input", () => {
    // If user changes a manual slider, reset preset dropdown selection back to "None (Custom)"
    if (slider !== qSlider && slider !== wSlider) {
      presetSelect.value = "none";
    }
    updateSliderLabels();
    processImage();
  });
});

formatSelect.addEventListener("change", processImage);

function updateSliderLabels() {
  document.getElementById("quality-val").textContent = `${qSlider.value}%`;
  document.getElementById("width-val").textContent = `${wSlider.value}px`;
  document.getElementById("brightness-val").textContent =
    `${fBrightness.value}%`;
  document.getElementById("contrast-val").textContent = `${fContrast.value}%`;
  document.getElementById("saturation-val").textContent =
    `${fSaturation.value}%`;
  document.getElementById("blur-val").textContent = `${fBlur.value}px`;
  document.getElementById("grayscale-val").textContent = `${fGrayscale.value}%`;
}

function handleFileSelect() {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    alert("Maximum file size is 20MB");
    return;
  }
  if (!allowed.includes(file.type)) {
    alert("Unsupported file type");
    return;
  }

  originalFileSize = file.size;
  originalFileName =
    file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  origMeta.textContent = `Size: ${formatBytes(originalFileSize)}`;

  const reader = new FileReader();
  reader.onload = function (event) {
    origPreview.src = event.target.result;
    sourceImage.src = event.target.result;
  };

  sourceImage.onload = function () {
    // Reset structural transforms when a completely fresh image is selected
    currentRotation = 0;
    rotateSlider.value = 0;
    document.getElementById("rotate-val").textContent = "0°";
    isFlippedH = false;
    isFlippedV = false;
    presetSelect.value = "none";

    wSlider.max = sourceImage.naturalWidth;
    wSlider.value = Math.min(1920, sourceImage.naturalWidth);
    updateSliderLabels();
    previewSection.classList.remove("hidden");
    downloadBtn.disabled = false;
    processImage();
  };
  reader.readAsDataURL(file);
}

function processImage() {
  if (!sourceImage.src) return;

  // 1. Calculate Target Dimensions with aspect ratio scaling
  let targetWidth = parseInt(wSlider.value, 10);
  const scaleFactor = targetWidth / sourceImage.naturalWidth;
  let targetHeight = sourceImage.naturalHeight * scaleFactor;

  // 2. Adjust canvas viewport bounds when swapped via 90 or 270 degree rotation turns
  const swapDimensions = currentRotation === 90 || currentRotation === 270;
  outputCanvas.width = swapDimensions ? targetHeight : targetWidth;
  outputCanvas.height = swapDimensions ? targetWidth : targetHeight;

  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

  // 3. Save standard state matrix, apply custom positioning context translations
  ctx.save();
  ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
  ctx.rotate((currentRotation * Math.PI) / 180);

  // Handle Flips inside the shifted canvas context
  const scaleX = isFlippedH ? -1 : 1;
  const scaleY = isFlippedV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // 4. Inject filters directly onto standard context rendering pipelines
  ctx.filter = `
    brightness(${fBrightness.value}%)
    contrast(${fContrast.value}%)
    saturate(${fSaturation.value}%)
    blur(${fBlur.value}px)
    grayscale(${fGrayscale.value}%)
  `;

  // Draw scaled canvas centered on the origin offsets
  ctx.drawImage(
    sourceImage,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight,
  );
  ctx.restore();

  const mimeType = formatSelect.value;
  const quality =
    mimeType === "image/png" ? undefined : parseInt(qSlider.value, 10) / 100;

  outputCanvas.toBlob(
    (blob) => {
      if (!blob) {
        outputMeta.textContent = "Failed to process image";
        return;
      }

      const savings = ((originalFileSize - blob.size) / originalFileSize) * 100;
      outputMeta.textContent =
        savings >= 0
          ? `Size: ${formatBytes(blob.size)} (Reduced by ${Math.round(savings)}%)`
          : `Size: ${formatBytes(blob.size)} (${Math.round(Math.abs(savings))}% larger)`;

      downloadBtn.onclick = () => {
        const extension = mimeType.split("/")[1];
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = `${originalFileName}_processed.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      };
    },
    mimeType,
    quality,
  );
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
