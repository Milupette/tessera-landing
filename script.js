const header = document.querySelector("[data-header]");
const mosaicCanvas = document.querySelector("[data-living-mosaic]");
const hero = document.querySelector(".hero");
const diagnosisDialog = document.querySelector("[data-diagnosis-dialog]");
const diagnosisOpen = document.querySelector("[data-diagnosis-open]");
const diagnosisClose = document.querySelector("[data-diagnosis-close]");
const diagnosisSteps = Array.from(document.querySelectorAll("[data-diagnosis-step]"));
const diagnosisAnswers = Array.from(document.querySelectorAll("[data-diagnosis-answer]"));
const diagnosisResult = document.querySelector("[data-diagnosis-result]");
const diagnosisResultText = document.querySelector("[data-diagnosis-result-text]");
const diagnosisWhatsapp = document.querySelector("[data-diagnosis-whatsapp]");
const whatsappLink = document.querySelector("[data-whatsapp-link]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (mosaicCanvas) {
  const context = mosaicCanvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = ["#3f7568", "#b99a5b", "#b96345", "#fffdf7", "#d6c2aa", "#254d45"];
  const logoPalette = ["#b99a5b", "#b96345", "#3f7568", "#fffdf7"];
  const pointer = { x: -9999, y: -9999, active: false };
  let pieces = [];
  let frame = 0;
  let startedAt = performance.now();
  let logoMode = false;
  let logoStartedAt = 0;
  let autoLogoTimer = 0;

  const random = (min, max) => Math.random() * (max - min) + min;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const ease = (value) => 1 - Math.pow(1 - value, 3);

  const resizeMosaic = () => {
    const rect = mosaicCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mosaicCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    mosaicCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createPieces(rect.width, rect.height);
  };

  const createPieces = (width, height) => {
    const isMobile = width < 520;
    const logoColumns = isMobile ? 3 : 4;
    const logoRows = isMobile ? 3 : 4;
    const piecesPerLogoPart = logoColumns * logoRows;
    const count = piecesPerLogoPart * 4;
    const columns = isMobile ? 6 : 8;
    const rows = Math.ceil(count / columns);
    const cellWidth = width / (columns + 1.7);
    const cellHeight = height / (rows + 2.2);
    const originX = isMobile ? width * 0.5 : width * 0.58;
    const originY = height * 0.48;

    pieces = Array.from({ length: count }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const size = random(isMobile ? 14 : 18, isMobile ? 34 : 48);
      const targetX = originX + (column - (columns - 1) / 2) * cellWidth + random(-8, 8);
      const targetY = originY + (row - (rows - 1) / 2) * cellHeight + random(-8, 8);
      const scatter = isMobile ? 80 : 170;

      return {
        x: targetX + random(-scatter, scatter),
        y: targetY + random(-scatter, scatter),
        startX: targetX + random(-scatter, scatter),
        startY: targetY + random(-scatter, scatter),
        targetX,
        targetY,
        size,
        color: palette[index % palette.length],
        alpha: random(0.42, 0.88),
        angle: random(-0.7, 0.7),
        targetAngle: random(-0.18, 0.18),
        drift: random(0.00035, 0.0009),
        phase: random(0, Math.PI * 2),
        shape: index % 4,
        logoPart: Math.floor(index / piecesPerLogoPart),
        logoSlot: index % piecesPerLogoPart,
        logoColumns,
        logoRows,
      };
    });
  };

  const getLogoGeometry = (width, height) => {
    const logoSize = clamp(
      Math.min(width, height) * (width < 520 ? 0.54 : 0.52),
      width < 520 ? 154 : 220,
      width < 520 ? 260 : 430,
    );
    const tile = logoSize * 0.46;
    const gap = logoSize * 0.08;
    const centerX = width < 520 ? width * 0.5 : width * 0.6;
    const centerY = height * 0.48;

    return { centerX, centerY, tile, gap };
  };

  const getLogoPartCenter = (part, geometry) => {
    const offset = geometry.tile * 0.5 + geometry.gap * 0.5;
    const x = geometry.centerX + (part % 2 === 0 ? -offset : offset);
    const y = geometry.centerY + (part < 2 ? -offset : offset);
    return { x, y };
  };

  const getLogoTarget = (piece, width, height) => {
    const geometry = getLogoGeometry(width, height);
    const center = getLogoPartCenter(piece.logoPart, geometry);
    const column = piece.logoSlot % piece.logoColumns;
    const row = Math.floor(piece.logoSlot / piece.logoColumns);
    const widthPerPiece = geometry.tile / piece.logoColumns;
    const heightPerPiece = geometry.tile / piece.logoRows;

    return {
      x: center.x - geometry.tile / 2 + widthPerPiece * (column + 0.5),
      y: center.y - geometry.tile / 2 + heightPerPiece * (row + 0.5),
      width: widthPerPiece,
      height: heightPerPiece,
      size: Math.max(widthPerPiece, heightPerPiece),
    };
  };

  const drawPiece = (piece, x, y, angle, color = piece.color, alpha = piece.alpha, size = piece.size) => {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.strokeStyle = "rgba(255, 253, 247, 0.14)";
    context.lineWidth = 1;

    if (piece.shape === 0) {
      context.fillRect(-size * 0.5, -size * 0.38, size, size * 0.76);
      context.strokeRect(-size * 0.5, -size * 0.38, size, size * 0.76);
    } else if (piece.shape === 1) {
      context.beginPath();
      context.moveTo(0, -size * 0.55);
      context.lineTo(size * 0.5, -size * 0.08);
      context.lineTo(size * 0.34, size * 0.48);
      context.lineTo(-size * 0.42, size * 0.34);
      context.lineTo(-size * 0.5, -size * 0.18);
      context.closePath();
      context.fill();
      context.stroke();
    } else if (piece.shape === 2) {
      context.beginPath();
      context.moveTo(-size * 0.48, -size * 0.42);
      context.lineTo(size * 0.54, -size * 0.26);
      context.lineTo(size * 0.26, size * 0.46);
      context.lineTo(-size * 0.5, size * 0.32);
      context.closePath();
      context.fill();
      context.stroke();
    } else {
      context.beginPath();
      context.moveTo(0, -size * 0.55);
      context.lineTo(size * 0.54, size * 0.4);
      context.lineTo(-size * 0.5, size * 0.44);
      context.closePath();
      context.fill();
      context.stroke();
    }

    context.restore();
  };

  const drawLogoPiece = (x, y, width, height, color, alpha, seamAlpha) => {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.fillRect(x - width / 2 - 0.45, y - height / 2 - 0.45, width + 0.9, height + 0.9);

    if (seamAlpha > 0.01) {
      context.strokeStyle = `rgba(255, 253, 247, ${seamAlpha})`;
      context.lineWidth = 0.7;
      context.strokeRect(x - width / 2, y - height / 2, width, height);
    }

    context.restore();
  };

  const drawConnections = (settledPieces, progress) => {
    context.save();
    context.lineWidth = 1;

    for (let index = 0; index < settledPieces.length; index += 1) {
      for (let next = index + 1; next < settledPieces.length; next += 1) {
        const first = settledPieces[index];
        const second = settledPieces[next];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);

        if (distance < 116) {
          const alpha = (1 - distance / 116) * 0.18 * progress;
          context.strokeStyle = `rgba(255, 253, 247, ${alpha})`;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
    }

    context.restore();
  };

  const renderMosaic = (time) => {
    const width = mosaicCanvas.clientWidth;
    const height = mosaicCanvas.clientHeight;
    const elapsed = time - startedAt;
    const progress = reduceMotion.matches ? 1 : ease(clamp((elapsed - 450) / 4200, 0, 1));
    const logoProgress = logoMode
      ? reduceMotion.matches
        ? 1
        : ease(clamp((time - logoStartedAt) / 1700, 0, 1))
      : 0;

    context.clearRect(0, 0, width, height);

    const settledPieces = pieces.map((piece) => {
      const driftX = reduceMotion.matches ? 0 : Math.sin(time * piece.drift + piece.phase) * 8;
      const driftY = reduceMotion.matches ? 0 : Math.cos(time * piece.drift * 0.85 + piece.phase) * 7;
      let x = piece.startX + (piece.targetX - piece.startX) * progress + driftX * (0.35 + progress);
      let y = piece.startY + (piece.targetY - piece.startY) * progress + driftY * (0.35 + progress);
      const logoTarget = getLogoTarget(piece, width, height);
      const distance = Math.hypot(pointer.x - x, pointer.y - y);

      if (pointer.active && distance < 190 && !reduceMotion.matches) {
        const pull = (1 - distance / 190) * 18;
        x += ((pointer.x - x) / Math.max(distance, 1)) * pull;
        y += ((pointer.y - y) / Math.max(distance, 1)) * pull;
      }

      x += (logoTarget.x - x) * logoProgress;
      y += (logoTarget.y - y) * logoProgress;

      return {
        piece,
        x,
        y,
        angle: (piece.angle + (piece.targetAngle - piece.angle) * progress) * (1 - logoProgress),
        color: logoProgress > 0.08 ? logoPalette[piece.logoPart] : piece.color,
        alpha: piece.alpha + (0.96 - piece.alpha) * logoProgress,
        size: piece.size + (logoTarget.size - piece.size) * logoProgress,
        logoWidth: (piece.size * 0.9) + (logoTarget.width - piece.size * 0.9) * logoProgress,
        logoHeight: (piece.size * 0.72) + (logoTarget.height - piece.size * 0.72) * logoProgress,
        logoProgress,
      };
    });

    drawConnections(settledPieces, progress * (1 - logoProgress));
    settledPieces.forEach(({ piece, x, y, angle, color, alpha, size, logoWidth, logoHeight, logoProgress }) => {
      if (logoProgress > 0.18) {
        drawLogoPiece(x, y, logoWidth, logoHeight, color, alpha, 0.1 * (1 - logoProgress));
      } else {
        drawPiece(piece, x, y, angle, color, alpha, size);
      }
    });

    if (!reduceMotion.matches) {
      frame = requestAnimationFrame(renderMosaic);
    }
  };

  const updatePointer = (event) => {
    const rect = mosaicCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  const resetPointer = () => {
    pointer.active = false;
  };

  const formLogo = () => {
    if (!logoMode) {
      logoMode = true;
      logoStartedAt = performance.now();
      hero?.classList.add("is-logo-formed");
    }

    if (reduceMotion.matches) {
      renderMosaic(performance.now() + 2000);
    }
  };

  const scheduleAutoLogo = () => {
    window.clearTimeout(autoLogoTimer);

    if (reduceMotion.matches) {
      formLogo();
      return;
    }

    autoLogoTimer = window.setTimeout(formLogo, 5600);
  };

  const handleMosaicClick = (event) => {
    const rect = mosaicCanvas.getBoundingClientRect();
    const clickedInsideCanvas =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (clickedInsideCanvas && !event.target.closest(".hero-content")) {
      formLogo();
    }
  };

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerleave", resetPointer);
  window.addEventListener("click", handleMosaicClick);
  window.addEventListener("resize", resizeMosaic);

  const handleMotionPreference = () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(autoLogoTimer);
    startedAt = performance.now();

    if (reduceMotion.matches) {
      formLogo();
    } else {
      renderMosaic(startedAt);
      scheduleAutoLogo();
    }
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleMotionPreference);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(handleMotionPreference);
  }

  resizeMosaic();
  renderMosaic(startedAt);
  scheduleAutoLogo();
}

if (diagnosisDialog && diagnosisOpen && diagnosisClose) {
  let currentDiagnosisStep = 0;
  let diagnosisSelections = [];

  const resetDiagnosis = () => {
    currentDiagnosisStep = 0;
    diagnosisSelections = [];
    diagnosisSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === 0);
    });

    if (diagnosisResult) {
      diagnosisResult.hidden = true;
    }
  };

  const getDiagnosisResult = () => {
    const scores = diagnosisSelections.reduce((map, item) => {
      map[item] = (map[item] || 0) + 1;
      return map;
    }, {});

    return diagnosisSelections.reduce((best, item) => {
      if (!best || scores[item] >= scores[best]) {
        return item;
      }

      return best;
    }, "");
  };

  const showDiagnosisResult = () => {
    diagnosisSteps.forEach((step) => step.classList.remove("is-active"));
    const result = getDiagnosisResult() || "clareza de próximos passos";

    if (diagnosisResultText) {
      diagnosisResultText.textContent = `Seu primeiro ponto de construção: ${result}.`;
    }

    if (diagnosisWhatsapp && whatsappLink) {
      diagnosisWhatsapp.href = whatsappLink.href;
    }

    if (diagnosisResult) {
      diagnosisResult.hidden = false;
    }
  };

  const closeDiagnosis = () => {
    diagnosisDialog.close();
  };

  diagnosisOpen.addEventListener("click", () => {
    resetDiagnosis();

    if (typeof diagnosisDialog.showModal === "function") {
      diagnosisDialog.showModal();
    } else {
      diagnosisDialog.setAttribute("open", "");
    }
  });

  diagnosisClose.addEventListener("click", closeDiagnosis);

  diagnosisDialog.addEventListener("click", (event) => {
    if (event.target === diagnosisDialog) {
      closeDiagnosis();
    }
  });

  diagnosisAnswers.forEach((answer) => {
    answer.addEventListener("click", () => {
      diagnosisSelections.push(answer.dataset.result || "");
      currentDiagnosisStep += 1;

      if (currentDiagnosisStep >= diagnosisSteps.length) {
        showDiagnosisResult();
        return;
      }

      diagnosisSteps.forEach((step, index) => {
        step.classList.toggle("is-active", index === currentDiagnosisStep);
      });
    });
  });
}
