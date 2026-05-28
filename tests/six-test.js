const SIX_TEST_KEY = "supermanSixTestState";
const WECHAT_ID = "Wine2003218";
const DIMENSIONS = ["主体性", "现实感", "元认知", "生命力", "战术迭代力", "造势力"];
const MAX_PER_DIMENSION = 20 * 3;
const MAX_TOTAL_PERCENT = 100;

function getQuestions() {
  return window.SIX_DIMENSION_QUESTIONS || [];
}

function blankState() {
  return {
    startedAt: Date.now(),
    currentIndex: 0,
    answers: {}
  };
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(SIX_TEST_KEY)) || blankState();
  } catch {
    return blankState();
  }
}

function saveState(state) {
  localStorage.setItem(SIX_TEST_KEY, JSON.stringify(state));
}

function resetState() {
  const state = blankState();
  saveState(state);
  return state;
}

function answerCount(state) {
  return Object.keys(state.answers || {}).length;
}

function isComplete(state) {
  return answerCount(state) >= getQuestions().length;
}

function calculateScores(state) {
  const raw = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0]));
  Object.values(state.answers || {}).forEach((answer) => {
    raw[answer.dimension] += answer.score;
  });
  return DIMENSIONS.map((dimension) => ({
    dimension,
    raw: raw[dimension],
    percent: Math.round((raw[dimension] / MAX_PER_DIMENSION) * 100)
  }));
}

function calculateTotalResult(scores) {
  const total = Math.round(scores.reduce((sum, score) => sum + score.percent, 0) / scores.length);
  const level =
    total >= 75 ? "接近超人导师" :
    total >= 50 ? "准超人" :
    total >= 25 ? "小超人" :
    "普通人";
  return { total, max: MAX_TOTAL_PERCENT, level };
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(window.__sixToastTimer);
  window.__sixToastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1500);
}

async function copyWechat() {
  try {
    await navigator.clipboard.writeText(WECHAT_ID);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = WECHAT_ID;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }
}

function ringPoints(count, radius, center) {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / count);
    return [
      center + Math.cos(angle) * radius,
      center + Math.sin(angle) * radius
    ].join(",");
  }).join(" ");
}

function polygonPoints(scores, radius, center) {
  return scores.map((score, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / scores.length);
    const valueRadius = radius * (score.percent / 100);
    return [
      center + Math.cos(angle) * valueRadius,
      center + Math.sin(angle) * valueRadius
    ].join(",");
  }).join(" ");
}

function renderRadar(radar, scores) {
  const center = 260;
  const radius = 170;
  radar.innerHTML = "";
  [0.25, 0.5, 0.75, 1].forEach((ring) => {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", ringPoints(scores.length, radius * ring, center));
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "#111");
    poly.setAttribute("stroke-width", ring === 1 ? "4" : "2");
    poly.setAttribute("opacity", ring === 1 ? "1" : "0.35");
    radar.appendChild(poly);
  });
  scores.forEach((score, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / scores.length);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", center);
    line.setAttribute("y1", center);
    line.setAttribute("x2", x);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#111");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("opacity", "0.35");
    radar.appendChild(line);

    const labelRadius = radius + 46;
    const lx = center + Math.cos(angle) * labelRadius;
    const ly = center + Math.sin(angle) * labelRadius + 7;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", lx);
    text.setAttribute("y", ly);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "18");
    text.setAttribute("font-weight", "900");
    text.textContent = score.dimension;
    radar.appendChild(text);
  });
  const result = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  result.setAttribute("points", polygonPoints(scores, radius, center));
  result.setAttribute("fill", "rgba(255, 226, 184, 0.82)");
  result.setAttribute("stroke", "#111");
  result.setAttribute("stroke-width", "5");
  result.setAttribute("stroke-linejoin", "round");
  radar.appendChild(result);
}

function drawReport(scores) {
  const totalResult = calculateTotalResult(scores);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffd948";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function board(x, y, w, h, fill = "#fff") {
    ctx.fillStyle = "#111";
    ctx.fillRect(x + 12, y + 12, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#111";
    ctx.strokeRect(x, y, w, h);
  }

  function writeCentered(text, x, y, w, font, fill = "#111") {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y);
    ctx.restore();
  }

  board(70, 70, 940, 250);
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 82px Microsoft YaHei, sans-serif";
  ctx.fillText("准超人六维报告", 120, 178);
  ctx.font = "800 34px Microsoft YaHei, sans-serif";
  ctx.fillText("携带此报告咨询超人导师，获得100元优惠", 120, 248);

  board(70, 350, 940, 720);
  const cx = 540;
  const cy = 710;
  const radius = 240;
  ctx.lineWidth = 4;
  [0.25, 0.5, 0.75, 1].forEach((ring) => {
    ctx.beginPath();
    for (let i = 0; i < scores.length; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / scores.length;
      const x = cx + Math.cos(a) * radius * ring;
      const y = cy + Math.sin(a) * radius * ring;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });
  ctx.beginPath();
  scores.forEach((score, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / scores.length;
    const r = radius * score.percent / 100;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 226, 184, 0.86)";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.font = "900 32px Microsoft YaHei, sans-serif";
  scores.forEach((score, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / scores.length;
    const x = cx + Math.cos(a) * (radius + 64);
    const y = cy + Math.sin(a) * (radius + 64);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111";
    ctx.fillText(score.dimension, x, y);
  });

  board(70, 1125, 940, 560);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  scores.forEach((score, i) => {
    const y = 1200 + i * 62;
    ctx.fillStyle = "#111";
    ctx.font = "900 34px Microsoft YaHei, sans-serif";
    ctx.fillText(score.dimension, 120, y);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#111";
    ctx.strokeRect(330, y - 32, 470, 32);
    ctx.fillStyle = "#ffe2b8";
    ctx.fillRect(330, y - 32, 470 * score.percent / 100, 32);
    ctx.fillStyle = "#111";
    ctx.fillText(`${score.percent}`, 840, y);
  });

  ctx.fillStyle = "#111";
  ctx.font = "900 44px Microsoft YaHei, sans-serif";
  ctx.fillText(`总分：${totalResult.total}/${totalResult.max}`, 120, 1615);
  ctx.font = "900 52px Microsoft YaHei, sans-serif";
  ctx.fillText(totalResult.level, 520, 1615);

  board(70, 1740, 940, 110, "#ffe2b8");
  writeCentered(`超人导师微信：${WECHAT_ID}`, 70, 1798, 940, "900 46px Microsoft YaHei, sans-serif");
  return canvas;
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

window.__sixTestFillDefault = function __sixTestFillDefault(optionLabel = "A") {
  const questions = getQuestions();
  const state = blankState();
  questions.forEach((question) => {
    const option = question.options.find((item) => item.label === optionLabel) || question.options[0];
    state.answers[question.id] = {
      dimension: question.dimension,
      score: option.score,
      label: option.label
    };
  });
  state.currentIndex = Math.max(questions.length - 1, 0);
  saveState(state);
  location.href = "test-result.html";
};

document.querySelectorAll("[data-fill-default]").forEach((trigger) => {
  trigger.style.cursor = "pointer";
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.__sixTestFillDefault();
  });
});
