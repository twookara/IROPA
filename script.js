/* ===== 要素取得 ===== */

const paletteToggle = document.querySelector("#palette-toggle");
const paletteTool = document.querySelector("#palette-tool");
const uiToggle = document.querySelector("#ui-toggle");
const uiTool = document.querySelector("#ui-tool");
const colorBoxes = document.querySelectorAll(".color-box");

const paletteCopyButton = document.querySelector("#palette-copy");
const paletteClearButton = document.querySelector("#palette-clear");
const customPalette = document.querySelector("#custom-palette");

const uiColorButtons = document.querySelectorAll(".ui-color-button");
const uiResetButton = document.querySelector("#ui-reset");
const colorPickerOverlay = document.querySelector("#color-picker-overlay");
const colorPickerList = document.querySelector("#color-picker-list");
const colorPickerClose = document.querySelector("#color-picker-close");

const colorNavLinks = document.querySelectorAll(".color-nav a");
const colorSections = document.querySelectorAll("body > section[id]");

const colorDetailOverlay = document.querySelector("#color-detail-overlay");
const colorDetailClose = document.querySelector("#color-detail-close");
const detailName = document.querySelector("#detail-name");
const detailPreview = document.querySelector("#detail-preview");
const detailHex = document.querySelector("#detail-hex");
const detailRgb = document.querySelector("#detail-rgb");
const detailHsl = document.querySelector("#detail-hsl");

const customColorPicker = document.querySelector("#custom-color-picker");
const customColorHex = document.querySelector("#custom-color-hex");


/* ===== 状態 ===== */

let paletteMode = paletteTool.classList.contains("open");
let selectedColors = [];

let currentUITarget = null;
let currentUIProperty = null;
let currentUIButton = null;

let currentDetailHex = "";
let currentDetailRgb = "";
let currentDetailHsl = "";


document.body.classList.toggle("palette-selecting", paletteMode);


/* ===== 共通処理 ===== */

function showCopyMessage(message) {
  const oldMessage = document.querySelector(".copy-message");

  if (oldMessage) {
    oldMessage.remove();
  }

  const notice = document.createElement("div");
  notice.classList.add("copy-message");
  notice.textContent = message;
  document.body.appendChild(notice);

  setTimeout(function () {
    notice.remove();
  }, 1500);
}


function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      textarea.remove();

      if (copied) {
        resolve();
      } else {
        reject(new Error("copy failed"));
      }
    } catch (error) {
      textarea.remove();
      reject(error);
    }
  });
}


function hexToRgb(hex) {
  const value = hex.replace("#", "");

  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16)
  };
}


function getReadableTextColor(hex) {
  const rgb = hexToRgb(hex);
  const brightness =
    (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  return brightness < 150 ? "#FFFFFF" : "#333333";
}


function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const difference = max - min;

    s = l > 0.5
      ? difference / (2 - max - min)
      : difference / (max + min);

    switch (max) {
      case r:
        h = (g - b) / difference + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / difference + 2;
        break;
      case b:
        h = (r - g) / difference + 4;
        break;
    }

    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}


/* ===== 色見本の初期表示 ===== */

colorBoxes.forEach(function (box) {
  box.style.backgroundColor = box.dataset.hex;
});


/* ===== ツール開閉 ===== */

paletteToggle.addEventListener("click", function () {
  paletteMode = paletteTool.classList.toggle("open");
  document.body.classList.toggle("palette-selecting", paletteMode);
});


uiToggle.addEventListener("click", function () {
  uiTool.classList.toggle("open");
});


/* ===== カラーパレット作成 ===== */

function renderPalette() {
  customPalette.innerHTML = "";

  if (selectedColors.length === 0) {
    const message = document.createElement("p");
    message.classList.add("empty-message");
    message.textContent = "下の色見本から色を選択してください";
    customPalette.appendChild(message);
    return;
  }

  selectedColors.forEach(function (color) {
    const item = document.createElement("div");
    item.classList.add("palette-item");
    item.style.backgroundColor = color.hex;
    item.style.color = getReadableTextColor(color.hex);

    const name = document.createElement("strong");
    name.textContent = color.name;

    const hex = document.createElement("span");
    hex.textContent = color.hex;

    item.append(name, hex);
    customPalette.appendChild(item);
  });
}


function togglePaletteColor(box) {
  const hex = box.dataset.hex;
  const name = box.querySelector("h2").textContent.trim();

  const existingIndex = selectedColors.findIndex(function (color) {
    return color.hex === hex;
  });

  if (existingIndex !== -1) {
    selectedColors.splice(existingIndex, 1);
    box.classList.remove("selected");
    renderPalette();
    return;
  }

  if (selectedColors.length >= 6) {
    showCopyMessage("選択できる色は最大6色です");
    return;
  }

  selectedColors.push({ name: name, hex: hex });
  box.classList.add("selected");
  renderPalette();
}


paletteCopyButton.addEventListener("click", function () {
  if (selectedColors.length === 0) {
    showCopyMessage("コピーする色がありません");
    return;
  }

  const text = selectedColors.map(function (color) {
    return color.hex;
  }).join(" / ");

  copyText(text)
    .then(function () {
      showCopyMessage("パレットをコピーしました");
    })
    .catch(function () {
      showCopyMessage("コピーに失敗しました");
    });
});


paletteClearButton.addEventListener("click", function () {
  selectedColors = [];

  colorBoxes.forEach(function (box) {
    box.classList.remove("selected");
  });

  renderPalette();
});


/* ===== UIサンプル 色選択 ===== */

function closeColorPicker() {
  colorPickerOverlay.classList.remove("open");
  currentUITarget = null;
  currentUIProperty = null;
  currentUIButton = null;
}


function syncUIColorButtons() {
  uiColorButtons.forEach(function (button) {
    const target = document.querySelector("#" + button.dataset.target);

    if (!target) {
      return;
    }

    const styles = getComputedStyle(target);
    const color = button.dataset.property === "background"
      ? styles.backgroundColor
      : styles.color;

    button.style.backgroundColor = color;
  });
}


uiResetButton.addEventListener("click", function () {
  uiColorButtons.forEach(function (button) {
    const target = document.querySelector("#" + button.dataset.target);

    if (!target) {
      return;
    }

    if (button.dataset.property === "background") {
      target.style.removeProperty("background-color");
    } else if (button.dataset.property === "color") {
      target.style.removeProperty("color");
    }
  });

  syncUIColorButtons();
  showCopyMessage("初期配色に戻しました");
});


colorBoxes.forEach(function (box) {
  const name = box.querySelector("h2").textContent.trim();
  const hex = box.dataset.hex;

  const option = document.createElement("button");
  option.classList.add("picker-color");
  option.style.backgroundColor = hex;
  option.style.color = getReadableTextColor(hex);

  const optionName = document.createElement("strong");
  optionName.textContent = name;

  const optionHex = document.createElement("span");
  optionHex.textContent = hex;

  option.append(optionName, optionHex);

  option.addEventListener("click", function () {
    const target = document.querySelector("#" + currentUITarget);

    if (!target || !currentUIButton) {
      closeColorPicker();
      return;
    }

    if (currentUIProperty === "background") {
      target.style.backgroundColor = hex;
    } else if (currentUIProperty === "color") {
      target.style.color = hex;
    }

    currentUIButton.style.backgroundColor = hex;
    closeColorPicker();
  });

  colorPickerList.appendChild(option);
});


uiColorButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentUITarget = button.dataset.target;
    currentUIProperty = button.dataset.property;
    currentUIButton = button;
    colorPickerOverlay.classList.add("open");
  });
});


colorPickerClose.addEventListener("click", closeColorPicker);


colorPickerOverlay.addEventListener("click", function (event) {
  if (event.target === colorPickerOverlay) {
    closeColorPicker();
  }
});


syncUIColorButtons();


/* ===== 色系統ナビの色 ===== */

colorNavLinks.forEach(function (link) {
  const section = document.querySelector(link.getAttribute("href"));

  if (!section) {
    return;
  }

  const firstColor = section.querySelector(".color-box");

  if (!firstColor) {
    return;
  }

  const hex = firstColor.dataset.hex;
  link.style.backgroundColor = hex;
  link.style.color = getReadableTextColor(hex);
});


/* ===== 各色系統の開閉 ===== */

colorSections.forEach(function (section) {
  const title = section.querySelector(":scope > h1");
  const palette = section.querySelector(":scope > .palette");

  if (!title || !palette) {
    return;
  }

  title.addEventListener("click", function () {
    section.classList.toggle("closed");
  });
});


/* ===== 色詳細 ===== */

function closeColorDetail() {
  colorDetailOverlay.classList.remove("open");
}


function openColorDetail(box) {
  const name = box.querySelector("h2").textContent.trim();
  const hex = box.dataset.hex;
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  currentDetailHex = hex;
  currentDetailRgb = rgb.r + ", " + rgb.g + ", " + rgb.b;
  currentDetailHsl = hsl.h + "°, " + hsl.s + "%, " + hsl.l + "%";

  detailName.textContent = name;
  detailPreview.style.backgroundColor = hex;
  detailHex.textContent = currentDetailHex + "　コピー";
  detailRgb.textContent = currentDetailRgb + "　コピー";
  detailHsl.textContent = currentDetailHsl + "　コピー";

  colorDetailOverlay.classList.add("open");
}


colorBoxes.forEach(function (box) {
  box.addEventListener("click", function () {
    if (paletteMode) {
      togglePaletteColor(box);
    } else {
      openColorDetail(box);
    }
  });
});


detailHex.addEventListener("click", function () {
  copyText(currentDetailHex)
    .then(function () {
      showCopyMessage(currentDetailHex + " をコピーしました");
    })
    .catch(function () {
      showCopyMessage("コピーに失敗しました");
    });
});


detailRgb.addEventListener("click", function () {
  copyText(currentDetailRgb)
    .then(function () {
      showCopyMessage(currentDetailRgb + " をコピーしました");
    })
    .catch(function () {
      showCopyMessage("コピーに失敗しました");
    });
});


detailHsl.addEventListener("click", function () {
  copyText(currentDetailHsl)
    .then(function () {
      showCopyMessage(currentDetailHsl + " をコピーしました");
    })
    .catch(function () {
      showCopyMessage("コピーに失敗しました");
    });
});


colorDetailClose.addEventListener("click", closeColorDetail);


colorDetailOverlay.addEventListener("click", function (event) {
  if (event.target === colorDetailOverlay) {
    closeColorDetail();
  }
});


/* ===== カラーピッカー ===== */

customColorPicker.addEventListener("input", function () {
  customColorHex.textContent = customColorPicker.value.toUpperCase();
});


customColorHex.addEventListener("click", function () {
  const hex = customColorPicker.value.toUpperCase();

  copyText(hex)
    .then(function () {
      showCopyMessage(hex + " をコピーしました");
    })
    .catch(function () {
      showCopyMessage("コピーに失敗しました");
    });
});
