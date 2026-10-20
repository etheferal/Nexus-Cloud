/* ==========================================================================
   NexusCloud v3.0 - Dağıtık Sistem Çekirdeği
   ========================================================================== */

// 1. Mikroservis Küme Durumu (Cluster State)
let clusterPods = [
  { id: "pod-auth-8f2c", name: "auth-service-api", image: "nexus/auth:v2.4.1", replicas: 3, cpu: "120m", ram: "512Mi", status: "running" },
  { id: "pod-pay-91ab", name: "payment-gateway", image: "nexus/payment:v1.9.0", replicas: 5, cpu: "340m", ram: "1.2Gi", status: "running" },
  { id: "pod-ai-44ee", name: "ai-inference-engine", image: "nexus/ai-core:v3.1", replicas: 2, cpu: "890m", ram: "4.8Gi", status: "degraded" },
  { id: "pod-db-77cc", name: "postgresql-cluster", image: "postgres:15-alpine", replicas: 3, cpu: "450m", ram: "2.1Gi", status: "running" }
];

// 2. Canlı Log Havuzu & Simülatör
let logs = [];
const logSources = ["auth-service", "payment-gateway", "ai-inference", "postgres-db", "ingress-router"];
const logMessages = [
  { level: "INFO", msg: "HTTP GET /api/v1/healthcheck 200 OK - 4ms" },
  { level: "INFO", msg: "Token verified successfully for user_id: 884102" },
  { level: "WARN", msg: "High memory utilization detected on pod ai-inference-engine (82%)" },
  { level: "SUCCESS", msg: "Database transaction committed successfully (TxID: #99412)" },
  { level: "ERROR", msg: "Connection timeout to upstream payment provider (Stripe API v2)" },
  { level: "INFO", msg: "Auto-scaler triggered: scaled replicas from 3 to 5 for payment-gateway" }
];

function pushRandomLog() {
  const source = logSources[Math.floor(Math.random() * logSources.length)];
  const template = logMessages[Math.floor(Math.random() * logMessages.length)];
  const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });

  logs.unshift({ time, source, level: template.level, msg: `[${source}] ${template.msg}` });
  if (logs.length > 100) logs.pop();
  renderLogs();
}

function renderLogs() {
  const terminal = document.getElementById("terminal-logs");
  const filter = document.getElementById("log-filter").value;

  const filtered = logs.filter(l => filter === "ALL" || l.level === filter);

  terminal.innerHTML = filtered.map(l => `
    <div class="log-line">
      <span class="log-time">[${l.time}]</span>
      <span class="log-level ${l.level.toLowerCase()}">${l.level}</span>
      <span class="log-msg">${l.msg}</span>
    </div>
  `).join("");
}

document.getElementById("log-filter").addEventListener("change", renderLogs);
document.getElementById("clear-logs").addEventListener("click", () => {
  logs = [];
  renderLogs();
});

setInterval(pushRandomLog, 1800);

// 3. Küme Tablosunu Çizme ve Aksiyonlar
function renderCluster() {
  const tbody = document.getElementById("cluster-tbody");
  tbody.innerHTML = clusterPods.map(pod => `
    <tr>
      <td class="pod-name">${pod.name}</td>
      <td><code>${pod.image}</code></td>
      <td><strong>${pod.replicas}x</strong></td>
      <td>${pod.cpu} / ${pod.ram}</td>
      <td><span class="status-badge ${pod.status}">${pod.status.toUpperCase()}</span></td>
      <td>
        <button class="btn ghost small" onclick="restartPod('${pod.id}')">Yeniden Başlat</button>
      </td>
    </tr>
  `).join("");
}

window.restartPod = function(id) {
  const pod = clusterPods.find(p => p.id === id);
  if (pod) {
    pod.status = "restarting";
    renderCluster();
    setTimeout(() => {
      pod.status = "running";
      renderCluster();
      logs.unshift({
        time: new Date().toLocaleTimeString("tr-TR", { hour12: false }),
        source: pod.name,
        level: "SUCCESS",
        msg: `[Orchestrator] Pod successfully restarted and health check passed.`
      });
      renderLogs();
    }, 2000);
  }
};

document.getElementById("add-pod-btn").addEventListener("click", () => {
  clusterPods.push({
    id: "pod_gen_" + Date.now(),
    name: "worker-node-" + Math.floor(Math.random() * 900 + 100),
    image: "nexus/worker:v1.0",
    replicas: 2,
    cpu: "200m",
    ram: "1.0Gi",
    status: "running"
  });
  renderCluster();
});

renderCluster();

// 4. Canlı Zaman Serisi Grafik Motoru (Canvas CPU/RAM Çizelgesi)
const canvas = document.getElementById("metrics-canvas");
const ctx = canvas.getContext("2d");

let cpuHistory = Array(40).fill(35);
let ramHistory = Array(40).fill(55);
let netHistory = Array(40).fill(20);

function updateMetricsData() {
  const nextCpu = Math.min(95, Math.max(15, cpuHistory[cpuHistory.length - 1] + (Math.random() * 16 - 8)));
  const nextRam = Math.min(90, Math.max(40, ramHistory[ramHistory.length - 1] + (Math.random() * 4 - 2)));
  const nextNet = Math.min(100, Math.max(10, netHistory[netHistory.length - 1] + (Math.random() * 24 - 12)));

  cpuHistory.shift(); cpuHistory.push(nextCpu);
  ramHistory.shift(); ramHistory.push(nextRam);
  netHistory.shift(); netHistory.push(nextNet);

  document.getElementById("val-cpu").textContent = `${nextCpu.toFixed(1)}%`;
  document.getElementById("val-ram").textContent = `${(nextRam / 6).toFixed(1)} GB / 16 GB`;
  document.getElementById("val-rps").textContent = `${Math.round(nextCpu * 42 + 200)} req/s`;
}

function drawTimeSeriesChart() {
  ctx.fillStyle = "#05080f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Yatay Izgara Çizgileri
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (canvas.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  function drawLine(data, color) {
    const step = canvas.width / (data.length - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    data.forEach((val, i) => {
      const x = i * step;
      const y = canvas.height - (val / 100) * (canvas.height - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawLine(netHistory, "#10b981"); // Ağ
  drawLine(ramHistory, "#6366f1"); // RAM
  drawLine(cpuHistory, "#38bdf8"); // CPU
}

setInterval(() => {
  updateMetricsData();
  drawTimeSeriesChart();
}, 1000);

// 5. Acil Durum Tetikleyici ve Rapor İhracı
document.getElementById("global-alert-btn").addEventListener("click", () => {
  document.getElementById("cluster-health").textContent = "84.2% (WARNING)";
  clusterPods.forEach(p => p.status = "degraded");
  renderCluster();
  logs.unshift({
    time: new Date().toLocaleTimeString("tr-TR", { hour12: false }),
    source: "WATCHDOG",
    level: "ERROR",
    msg: "[CRITICAL ALERT] Cluster load exceeded safety threshold. Traffic re-routed."
  });
  renderLogs();
  alert("🚨 Simüle edilmiş Acil Durum (Paging) tetiklendi! Küme durumu 'Degraded' seviyesine çekildi.");
});

document.getElementById("export-report-btn").addEventListener("click", () => {
  const systemReport = {
    timestamp: new Date().toISOString(),
    environment: "PROD-EU-CENTRAL-1",
    health: "99.98%",
    pods: clusterPods,
    recentLogs: logs.slice(0, 20)
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(systemReport, null, 2));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = "nexus-cloud-system-report.json";
  a.click();
});