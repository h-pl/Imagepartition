// public/client.js
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const imageUploadInput = document.getElementById("imageUpload");
  const canvas = document.getElementById("imageCanvas");
  const ctx = canvas.getContext("2d");

  const brightnessSlider = document.getElementById("brightnessSlider");
  const brightnessValueSpan = document.getElementById("brightnessValue");
  const contrastSlider = document.getElementById("contrastSlider");
  const contrastValueSpan = document.getElementById("contrastValue");
  const saturationSlider = document.getElementById("saturationSlider");
  const saturationValueSpan = document.getElementById("saturationValue");
  const grayscaleCheckbox = document.getElementById("grayscaleCheckbox");
  const denoiseCheckbox = document.getElementById("denoiseCheckbox");
  const sharpenCheckbox = document.getElementById("sharpenCheckbox");
  const resetGlobalControlsBtn = document.getElementById(
    "resetGlobalControlsBtn"
  );

  const regionsListDiv = document.getElementById("regionsList");
  const generateConfigBtn = document.getElementById("generateConfigBtn");
  const clearAllRegionsBtn = document.getElementById("clearAllRegionsBtn");

  // --- State Variables ---
  let originalImage = null;
  let imageName = "image"; // Default image name for config file
  let regions = [];
  let selectedRegionIndex = -1;
  let isDrawing = false;
  let startX, startY, currentRect;
  let displayProps = { x: 0, y: 0, width: 0, height: 0, scale: 1 };
  let globalPreprocessingSettings = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    grayscale: 0,
    denoise: false,
    sharpen: false,
  };

  // --- Canvas Setup & Initial Drawing ---
  function setupCanvas() {
    const leftPanel = document.querySelector(".left-panel");
    // Ensure canvas dimensions are based on its container's actual rendered size
    const style = getComputedStyle(leftPanel);
    const paddingX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    canvas.width = leftPanel.clientWidth - paddingX;
    canvas.height = leftPanel.clientHeight - paddingY;

    drawCanvasContent();
  }

  function drawCanvasContent() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!originalImage) {
      drawUploadPrompt();
    } else {
      applyFiltersAndDrawImage();
      redrawAllRegionsOnCanvas();
    }
  }

  function drawUploadPrompt() {
    ctx.save();
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.fillText(
      "Click or Drag & Drop Image Here",
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText(
      "(Max recommended: 2000x2000px for performance)",
      canvas.width / 2,
      canvas.height / 2 + 25
    );
    ctx.restore();
  }
  window.addEventListener("resize", setupCanvas);

  // --- Image Handling ---
  imageUploadInput.addEventListener("change", handleFileSelect);
  canvas.addEventListener("dragover", handleDragOver);
  canvas.addEventListener("dragleave", handleDragLeave);
  canvas.addEventListener("drop", handleDrop);
  canvas.addEventListener("click", handleCanvasClickForUpload);

  function handleCanvasClickForUpload(event) {
    if (!originalImage) {
      // Only trigger upload if no image is loaded
      imageUploadInput.click(); // Programmatically click the hidden file input
    }
    // If an image is loaded, this click will be handled by mousedown for drawing/selection
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) loadImage(file);
    event.target.value = null; // Reset input value to allow re-uploading the same file
  }
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    canvas.classList.add("dragover-active");
  }
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    canvas.classList.remove("dragover-active");
  }
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    canvas.classList.remove("dragover-active");
    const file = event.dataTransfer.files[0];
    if (file) loadImage(file);
  }
  function loadImage(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    imageName = file.name.split(".")[0] || "image_config"; // Store filename base for config
    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = new Image();
      originalImage.onload = () => {
        resetAllRegions();
        resetGlobalControls();
        setupCanvas(); // Recalculate canvas size and draw
      };
      originalImage.onerror = () => {
        alert("Error loading image. Please try another file.");
        originalImage = null;
        drawCanvasContent();
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Global Preprocessing ---
  [
    brightnessSlider,
    contrastSlider,
    saturationSlider,
    grayscaleCheckbox,
    denoiseCheckbox,
    sharpenCheckbox,
  ].forEach((el) => {
    el.addEventListener("input", updateGlobalPreprocessing);
  });
  resetGlobalControlsBtn.addEventListener("click", resetGlobalControls);

  function resetGlobalControls() {
    globalPreprocessingSettings = {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      grayscale: 0,
      denoise: false,
      sharpen: false,
    };
    brightnessSlider.value = 100;
    brightnessValueSpan.textContent = "100%";
    contrastSlider.value = 100;
    contrastValueSpan.textContent = "100%";
    saturationSlider.value = 100;
    saturationValueSpan.textContent = "100%";
    grayscaleCheckbox.checked = false;
    denoiseCheckbox.checked = false;
    sharpenCheckbox.checked = false;
    if (originalImage) drawCanvasContent();
  }
  function updateGlobalPreprocessing() {
    globalPreprocessingSettings.brightness =
      parseFloat(brightnessSlider.value) / 100;
    brightnessValueSpan.textContent = `${brightnessSlider.value}%`;
    globalPreprocessingSettings.contrast =
      parseFloat(contrastSlider.value) / 100;
    contrastValueSpan.textContent = `${contrastSlider.value}%`;
    globalPreprocessingSettings.saturation =
      parseFloat(saturationSlider.value) / 100;
    saturationValueSpan.textContent = `${saturationSlider.value}%`;
    globalPreprocessingSettings.grayscale = grayscaleCheckbox.checked ? 1 : 0;
    globalPreprocessingSettings.denoise = denoiseCheckbox.checked;
    globalPreprocessingSettings.sharpen = sharpenCheckbox.checked;
    if (originalImage) drawCanvasContent();
  }

  // --- Drawing Logic ---
  function applyFiltersAndDrawImage() {
    // Renamed from drawScaledImageAndRegions
    if (!originalImage) return;

    let filterString = "";
    filterString += `brightness(${globalPreprocessingSettings.brightness}) `;
    filterString += `contrast(${globalPreprocessingSettings.contrast}) `;
    filterString += `saturate(${globalPreprocessingSettings.saturation}) `;
    filterString += `grayscale(${globalPreprocessingSettings.grayscale})`;
    ctx.filter = filterString;

    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = originalImage.width / originalImage.height;

    if (imageAspect > canvasAspect) {
      displayProps.width = canvas.width;
      displayProps.scale = canvas.width / originalImage.width;
      displayProps.height = originalImage.height * displayProps.scale;
      displayProps.x = 0;
      displayProps.y = (canvas.height - displayProps.height) / 2;
    } else {
      displayProps.height = canvas.height;
      displayProps.scale = canvas.height / originalImage.height;
      displayProps.width = originalImage.width * displayProps.scale;
      displayProps.y = 0;
      displayProps.x = (canvas.width - displayProps.width) / 2;
    }
    // Clip to ensure drawing happens within canvas bounds if y or x are tiny negatives from float math
    displayProps.x = Math.max(0, displayProps.x);
    displayProps.y = Math.max(0, displayProps.y);

    ctx.drawImage(
      originalImage,
      displayProps.x,
      displayProps.y,
      displayProps.width,
      displayProps.height
    );
    ctx.filter = "none"; // Reset for drawing boxes
  }

  function redrawAllRegionsOnCanvas() {
    regions.forEach((region, index) => {
      const canvasCoords = toCanvasCoords(region.coordinates);
      ctx.lineWidth = index === selectedRegionIndex ? 2.5 : 1.5;
      ctx.strokeStyle =
        index === selectedRegionIndex
          ? "rgba(220, 53, 69, 0.9)"
          : "rgba(25, 135, 84, 0.8)"; // Red for selected, Green for others
      ctx.strokeRect(
        canvasCoords.x,
        canvasCoords.y,
        canvasCoords.w,
        canvasCoords.h
      );

      ctx.fillStyle =
        index === selectedRegionIndex
          ? "rgba(220, 53, 69, 1)"
          : "rgba(25, 135, 84, 1)";
      ctx.font = "bold 11px Arial";
      ctx.fillText(region.id, canvasCoords.x + 4, canvasCoords.y + 12);
    });
  }

  // --- Canvas Mouse Events for Drawing & Selection ---
  canvas.addEventListener("mousedown", (e) => {
    if (!originalImage) return; // Don't draw if no image
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedOnExistingRegion = false;
    for (let i = regions.length - 1; i >= 0; i--) {
      const rCanvas = toCanvasCoords(regions[i].coordinates);
      if (
        mouseX >= rCanvas.x &&
        mouseX <= rCanvas.x + rCanvas.w &&
        mouseY >= rCanvas.y &&
        mouseY <= rCanvas.y + rCanvas.h
      ) {
        selectedRegionIndex = i;
        updateRegionsList(); // Will also expand the selected region
        drawCanvasContent();
        clickedOnExistingRegion = true;
        isDrawing = false;
        return;
      }
    }

    if (
      mouseX >= displayProps.x &&
      mouseX <= displayProps.x + displayProps.width &&
      mouseY >= displayProps.y &&
      mouseY <= displayProps.y + displayProps.height
    ) {
      isDrawing = true;
      startX = mouseX;
      startY = mouseY;
      currentRect = { x: startX, y: startY, width: 0, height: 0 };
      // Deselect if clicking outside existing regions but on image
      if (selectedRegionIndex !== -1 && !clickedOnExistingRegion) {
        selectedRegionIndex = -1;
        updateRegionsList();
      }
    } else {
      isDrawing = false;
      // If clicking outside image, deselect any region
      if (selectedRegionIndex !== -1) {
        selectedRegionIndex = -1;
        updateRegionsList();
        drawCanvasContent();
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !originalImage) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    currentRect.width = mouseX - startX;
    currentRect.height = mouseY - startY;

    drawCanvasContent(); // Redraw base image & existing regions
    ctx.strokeStyle = "rgba(220, 53, 69, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      currentRect.x,
      currentRect.y,
      currentRect.width,
      currentRect.height
    );
  });

  canvas.addEventListener("mouseup", () => {
    if (!isDrawing || !originalImage) return;
    isDrawing = false;

    const canvasRectX = Math.min(
      currentRect.x,
      currentRect.x + currentRect.width
    );
    const canvasRectY = Math.min(
      currentRect.y,
      currentRect.y + currentRect.height
    );
    const canvasRectW = Math.abs(currentRect.width);
    const canvasRectH = Math.abs(currentRect.height);

    const clippedRect = clipRectToImage(
      canvasRectX,
      canvasRectY,
      canvasRectW,
      canvasRectH
    );
    if (!clippedRect || clippedRect.w < 5 || clippedRect.h < 5) {
      drawCanvasContent();
      return;
    }

    const originalCoords = toOriginalCoords(clippedRect);
    const newRegion = {
      id: `region_${regions.length + 1}`,
      coordinates: originalCoords,
      preprocessing: {},
    };
    regions.push(newRegion);
    selectedRegionIndex = regions.length - 1;
    updateRegionsList();
    drawCanvasContent();
  });

  function clipRectToImage(x, y, w, h) {
    const imgEndX = displayProps.x + displayProps.width;
    const imgEndY = displayProps.y + displayProps.height;
    const resX = Math.max(x, displayProps.x);
    const resY = Math.max(y, displayProps.y);
    const resEndX = Math.min(x + w, imgEndX);
    const resEndY = Math.min(y + h, imgEndY);
    const resW = resEndX - resX;
    const resH = resEndY - resY;
    if (resW <= 0 || resH <= 0) return null;
    return { x: resX, y: resY, w: resW, h: resH };
  }

  // --- Coordinate Conversion ---
  function toOriginalCoords(canvasRect) {
    return {
      left: Math.max(
        0,
        Math.round((canvasRect.x - displayProps.x) / displayProps.scale)
      ),
      top: Math.max(
        0,
        Math.round((canvasRect.y - displayProps.y) / displayProps.scale)
      ),
      width: Math.round(canvasRect.w / displayProps.scale),
      height: Math.round(canvasRect.h / displayProps.scale),
    };
  }
  function toCanvasCoords(originalCoords) {
    return {
      x: originalCoords.left * displayProps.scale + displayProps.x,
      y: originalCoords.top * displayProps.scale + displayProps.y,
      w: originalCoords.width * displayProps.scale,
      h: originalCoords.height * displayProps.scale,
    };
  }

  // --- Region Management UI ---
  function updateRegionsList() {
    regionsListDiv.innerHTML = "";
    if (regions.length === 0 && originalImage) {
      // Only show if image is loaded
      regionsListDiv.innerHTML =
        '<p class="no-regions-message">No regions defined. Draw on the image.</p>';
    } else if (!originalImage) {
      regionsListDiv.innerHTML =
        '<p class="no-regions-message">Upload an image to begin.</p>';
    }

    regions.forEach((region, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("region-item");
      const isSelectedAndExpanded = index === selectedRegionIndex;
      if (isSelectedAndExpanded) itemDiv.classList.add("selected", "expanded");

      const header = document.createElement("div");
      header.classList.add("region-header");
      header.innerHTML = `<span>${region.id}</span> <span class="arrow">${
        isSelectedAndExpanded ? "▼" : "►"
      }</span>`;
      header.addEventListener("click", () => {
        selectedRegionIndex = isSelectedAndExpanded ? -1 : index;
        updateRegionsList();
        drawCanvasContent();
      });
      itemDiv.appendChild(header);

      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("region-details");
      if (isSelectedAndExpanded) {
        detailsDiv.innerHTML = createParamGroupHTML(
          `regionId_${index}`,
          "ID:",
          `<input type="text" id="regionId_${index}" value="${region.id}" style="width: calc(100% - 55px);">`
        );

        const maxL = originalImage.width - region.coordinates.width;
        const maxT = originalImage.height - region.coordinates.height;
        const maxW = originalImage.width - region.coordinates.left;
        const maxH = originalImage.height - region.coordinates.top;

        detailsDiv.innerHTML += createSliderGroupHTML(
          `regionLeft_${index}`,
          "Left:",
          region.coordinates.left,
          0,
          maxL
        );
        detailsDiv.innerHTML += createSliderGroupHTML(
          `regionTop_${index}`,
          "Top:",
          region.coordinates.top,
          0,
          maxT
        );
        detailsDiv.innerHTML += createSliderGroupHTML(
          `regionWidth_${index}`,
          "Width:",
          region.coordinates.width,
          5,
          maxW
        );
        detailsDiv.innerHTML += createSliderGroupHTML(
          `regionHeight_${index}`,
          "Height:",
          region.coordinates.height,
          5,
          maxH
        );

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-region-btn");
        deleteBtn.textContent = "Delete Region";
        deleteBtn.dataset.index = index;
        deleteBtn.addEventListener("click", handleDeleteRegion);
        detailsDiv.appendChild(deleteBtn);
      }
      itemDiv.appendChild(detailsDiv);
      regionsListDiv.appendChild(itemDiv);

      if (isSelectedAndExpanded) {
        document
          .getElementById(`regionId_${index}`)
          .addEventListener("input", (e) => {
            regions[index].id = e.target.value;
            header.querySelector("span:first-child").textContent =
              e.target.value;
            drawCanvasContent();
          });
        setupCoordinateSliderListener(`regionLeft_${index}`, index, "left");
        setupCoordinateSliderListener(`regionTop_${index}`, index, "top");
        setupCoordinateSliderListener(`regionWidth_${index}`, index, "width");
        setupCoordinateSliderListener(`regionHeight_${index}`, index, "height");
      }
    });
  }

  function createParamGroupHTML(idPrefix, labelText, inputHTML) {
    return `<div class="param-group"><label for="${idPrefix}">${labelText}</label>${inputHTML}</div>`;
  }
  function createSliderGroupHTML(id, label, value, min, max) {
    const safeVal = Math.min(Math.max(value, min), max); // Clamp value within min/max
    return `
            <div class="param-group">
                <label for="${id}">${label}</label>
                <input type="range" id="${id}" min="${min}" max="${max}" value="${safeVal}">
                <input type="number" id="${id}Num" min="${min}" max="${max}" value="${safeVal}" class="coord-num-input">
                <span class="value-display" id="${id}Value">${safeVal}px</span>
            </div>`;
  }
  function setupCoordinateSliderListener(
    sliderBaseId,
    regionIndex,
    coordProperty
  ) {
    const slider = document.getElementById(sliderBaseId);
    const numInput = document.getElementById(`${sliderBaseId}Num`);
    const valueDisplay = document.getElementById(`${sliderBaseId}Value`);
    if (!slider || !numInput) return;

    const updateRegionCoord = (newValueStr) => {
      let newValue = parseInt(newValueStr);
      const region = regions[regionIndex].coordinates;

      // Boundary and dependency checks
      if (coordProperty === "left")
        newValue = Math.min(newValue, originalImage.width - region.width);
      else if (coordProperty === "top")
        newValue = Math.min(newValue, originalImage.height - region.height);
      else if (coordProperty === "width")
        newValue = Math.min(newValue, originalImage.width - region.left);
      else if (coordProperty === "height")
        newValue = Math.min(newValue, originalImage.height - region.top);

      newValue = Math.max(parseInt(slider.min), newValue); // Ensure min boundary
      newValue = Math.min(parseInt(slider.max), newValue); // Ensure max boundary, slider.max already considers dependencies

      region[coordProperty] = newValue;
      slider.value = newValue;
      numInput.value = newValue;
      valueDisplay.textContent = `${newValue}px`;

      // Update max values of other sliders dynamically
      if (coordProperty === "left")
        document.getElementById(`regionWidth_${regionIndex}`).max =
          originalImage.width - newValue;
      else if (coordProperty === "width")
        document.getElementById(`regionLeft_${regionIndex}`).max =
          originalImage.width - newValue;
      else if (coordProperty === "top")
        document.getElementById(`regionHeight_${regionIndex}`).max =
          originalImage.height - newValue;
      else if (coordProperty === "height")
        document.getElementById(`regionTop_${regionIndex}`).max =
          originalImage.height - newValue;

      // If width/height changed, it might affect L/T max values for other sliders
      if (
        coordProperty === "width" &&
        document.getElementById(`regionLeft_${regionIndex}`)
      ) {
        document.getElementById(`regionLeft_${regionIndex}`).max =
          originalImage.width - newValue;
        if (region.left > originalImage.width - newValue) {
          // If left is now out of bounds
          region.left = originalImage.width - newValue; // Adjust it
          document.getElementById(`regionLeft_${regionIndex}`).value =
            region.left;
          document.getElementById(`regionLeft_${regionIndex}Num`).value =
            region.left;
          document.getElementById(
            `regionLeft_${regionIndex}Value`
          ).textContent = `${region.left}px`;
        }
      }
      if (
        coordProperty === "height" &&
        document.getElementById(`regionTop_${regionIndex}`)
      ) {
        document.getElementById(`regionTop_${regionIndex}`).max =
          originalImage.height - newValue;
        if (region.top > originalImage.height - newValue) {
          // If top is now out of bounds
          region.top = originalImage.height - newValue; // Adjust it
          document.getElementById(`regionTop_${regionIndex}`).value =
            region.top;
          document.getElementById(`regionTop_${regionIndex}Num`).value =
            region.top;
          document.getElementById(
            `regionTop_${regionIndex}Value`
          ).textContent = `${region.top}px`;
        }
      }

      drawCanvasContent();
    };
    slider.addEventListener("input", (e) => updateRegionCoord(e.target.value));
    numInput.addEventListener("change", (e) =>
      updateRegionCoord(e.target.value)
    ); // Use change for num input
  }

  function handleDeleteRegion(event) {
    const indexToDelete = parseInt(event.target.dataset.index);
    regions.splice(indexToDelete, 1);
    if (selectedRegionIndex === indexToDelete) selectedRegionIndex = -1;
    else if (selectedRegionIndex > indexToDelete) selectedRegionIndex--;
    updateRegionsList();
    drawCanvasContent();
  }

  clearAllRegionsBtn.addEventListener("click", resetAllRegions);
  function resetAllRegions() {
    if (
      regions.length > 0 &&
      !confirm("This will clear all defined regions. Continue?")
    )
      return;
    regions = [];
    selectedRegionIndex = -1;
    updateRegionsList();
    if (originalImage) drawCanvasContent();
  }

  // --- Config Generation ---
  generateConfigBtn.addEventListener("click", () => {
    if (!originalImage) {
      alert("Please upload an image first.");
      return;
    }
    if (regions.length === 0) {
      alert("Please define at least one region.");
      return;
    }

    const imageRegionsArray = regions.map((r) => ({
      id: r.id,
      coordinates: {
        // Ensure coordinates are positive and make sense
        left: Math.max(0, r.coordinates.left),
        top: Math.max(0, r.coordinates.top),
        width: Math.max(1, r.coordinates.width),
        height: Math.max(1, r.coordinates.height),
      },
      preprocessing: {},
    }));

    const finalGlobalSettings = {};
    if (globalPreprocessingSettings.brightness !== 1)
      finalGlobalSettings.brightness = parseFloat(
        globalPreprocessingSettings.brightness.toFixed(2)
      );
    if (globalPreprocessingSettings.contrast !== 1)
      finalGlobalSettings.contrast = parseFloat(
        globalPreprocessingSettings.contrast.toFixed(2)
      );
    if (globalPreprocessingSettings.saturation !== 1)
      finalGlobalSettings.saturation = parseFloat(
        globalPreprocessingSettings.saturation.toFixed(2)
      );
    if (globalPreprocessingSettings.grayscale === 1)
      finalGlobalSettings.grayscale = true;
    if (globalPreprocessingSettings.denoise) finalGlobalSettings.denoise = true;
    if (globalPreprocessingSettings.sharpen) {
      finalGlobalSettings.sharpen = {
        sigma: 1,
        m1: 0,
        m2: 3,
        x1: 0,
        y2: 15,
        y3: 15,
      }; // Default sharp params
    }

    const configObject = {
      GLOBAL_PREPROCESSING_CONFIG: finalGlobalSettings,
      IMAGE_REGIONS: imageRegionsArray,
      FIELD_EXTRACTION_RULES: [],
    };

    const configString = `// Generated on: ${new Date().toLocaleString()}\nmodule.exports = ${JSON.stringify(
      configObject,
      null,
      2
    )};`;
    const blob = new Blob([configString], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageName}.config.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // --- Initial Page Load ---
  setupCanvas();
  updateRegionsList();
});
