const header = document.querySelector("[data-header]");
const mosaicCanvas = document.querySelector("[data-living-mosaic]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (mosaicCanvas) {
  const context = mosaicCanvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = ["#3f7568", "#b99a5b", "#b96345", "#fffdf7", "#d6c2aa", "#254d45"];
  const pointer = { x: -9999, y: -9999, active: false };
  let pieces = [];
  let frame = 0;
  let startedAt = performance.now();

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
    const columns = isMobile ? 5 : 7;
    const rows = isMobile ? 4 : 5;
    const count = columns * rows;
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
      };
    });
  };

  const drawPiece = (piece, x, y, angle) => {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.globalAlpha = piece.alpha;
    context.fillStyle = piece.color;
    context.strokeStyle = "rgba(255, 253, 247, 0.14)";
    context.lineWidth = 1;

    if (piece.shape === 0) {
      context.fillRect(-piece.size * 0.5, -piece.size * 0.38, piece.size, piece.size * 0.76);
      context.strokeRect(-piece.size * 0.5, -piece.size * 0.38, piece.size, piece.size * 0.76);
    } else if (piece.shape === 1) {
      context.beginPath();
      context.moveTo(0, -piece.size * 0.55);
      context.lineTo(piece.size * 0.5, -piece.size * 0.08);
      context.lineTo(piece.size * 0.34, piece.size * 0.48);
      context.lineTo(-piece.size * 0.42, piece.size * 0.34);
      context.lineTo(-piece.size * 0.5, -piece.size * 0.18);
      context.closePath();
      context.fill();
      context.stroke();
    } else if (piece.shape === 2) {
      context.beginPath();
      context.moveTo(-piece.size * 0.48, -piece.size * 0.42);
      context.lineTo(piece.size * 0.54, -piece.size * 0.26);
      context.lineTo(piece.size * 0.26, piece.size * 0.46);
      context.lineTo(-piece.size * 0.5, piece.size * 0.32);
      context.closePath();
      context.fill();
      context.stroke();
    } else {
      context.beginPath();
      context.moveTo(0, -piece.size * 0.55);
      context.lineTo(piece.size * 0.54, piece.size * 0.4);
      context.lineTo(-piece.size * 0.5, piece.size * 0.44);
      context.closePath();
      context.fill();
      context.stroke();
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

    context.clearRect(0, 0, width, height);

    const settledPieces = pieces.map((piece) => {
      const driftX = reduceMotion.matches ? 0 : Math.sin(time * piece.drift + piece.phase) * 8;
      const driftY = reduceMotion.matches ? 0 : Math.cos(time * piece.drift * 0.85 + piece.phase) * 7;
      let x = piece.startX + (piece.targetX - piece.startX) * progress + driftX * (0.35 + progress);
      let y = piece.startY + (piece.targetY - piece.startY) * progress + driftY * (0.35 + progress);
      const distance = Math.hypot(pointer.x - x, pointer.y - y);

      if (pointer.active && distance < 190 && !reduceMotion.matches) {
        const pull = (1 - distance / 190) * 18;
        x += ((pointer.x - x) / Math.max(distance, 1)) * pull;
        y += ((pointer.y - y) / Math.max(distance, 1)) * pull;
      }

      return {
        piece,
        x,
        y,
        angle: piece.angle + (piece.targetAngle - piece.angle) * progress,
      };
    });

    drawConnections(settledPieces, progress);
    settledPieces.forEach(({ piece, x, y, angle }) => drawPiece(piece, x, y, angle));

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

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerleave", resetPointer);
  window.addEventListener("resize", resizeMosaic);

  const handleMotionPreference = () => {
    cancelAnimationFrame(frame);
    startedAt = performance.now();
    renderMosaic(startedAt + 5000);
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleMotionPreference);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(handleMotionPreference);
  }

  resizeMosaic();
  renderMosaic(startedAt);
}
