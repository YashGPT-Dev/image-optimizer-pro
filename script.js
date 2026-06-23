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
let sourceImage = new Image();
let originalFileSize = 0;
let originalFileName = "processed_image";
fileInput.addEventListener("change", handleFileSelect);
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.background = "#edf4fe";
});
dropZone.addEventListener(
  "dragleave",
  () => (dropZone.style.background = "#fff"),
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.background = "#fff";
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    handleFileSelect();
  }
});
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
  originalFileSize = file.size;
  originalFileName =
    file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  origMeta.textContent = `Size: ${formatBytes(originalFileSize)}`;
  const reader = new FileReader();
  reader.onload = function (event) {
    origPreview.src = event.target.result;
    sourceImage.src = event.target.result;
  };
  if (!allowed.includes(file.type)) {
    alert("Unsupported file type");
    return;
  }
  sourceImage.onload = function () {
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
  let targetWidth = parseInt(wSlider.value, 10);
  const scaleFactor = targetWidth / sourceImage.naturalWidth;
  let targetHeight = sourceImage.naturalHeight * scaleFactor;
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.filter = `
        brightness(${fBrightness.value}%)
        contrast(${fContrast.value}%)
        saturate(${fSaturation.value}%)
        blur(${fBlur.value}px)
        grayscale(${fGrayscale.value}%)
    `;
  ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);
  const mimeType = formatSelect.value;

  // PNG quality parameter ignore karta hai
  const quality =
    mimeType === "image/png" ? undefined : parseInt(qSlider.value, 10) / 100;

  outputCanvas.toBlob(
    (blob) => {
      if (!blob) {
        outputMeta.textContent = "Failed to process image";
        return;
      }

      // Compression savings calculation
      const savings = ((originalFileSize - blob.size) / originalFileSize) * 100;

      outputMeta.textContent =
        savings >= 0
          ? `Size: ${formatBytes(blob.size)} (Reduced by ${Math.round(savings)}%)`
          : `Size: ${formatBytes(blob.size)} (${Math.round(
              Math.abs(savings),
            )}% larger)`;

      downloadBtn.onclick = () => {
        const extension = mimeType.split("/")[1];

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = `${originalFileName}_optimized.${extension}`;

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
if (file.size > 20 * 1024 * 1024) {
  alert("Maximum file size is 20MB");
  return;
}
const allowed = ["image/jpeg", "image/png", "image/webp"];
