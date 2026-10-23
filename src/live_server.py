import os
import io
import json
import joblib
import numpy as np
import librosa
from flask import Flask, request, jsonify, render_template_string

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
MODELS_DIR = os.path.join(ROOT_DIR, 'models')

# Inisialisasi Flask
app = Flask(__name__)

# Header CORS
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

# Muat Model Random Forest & Scaler
print("[INFO] Memuat model Random Forest...")
model_path = os.path.join(MODELS_DIR, 'rf_model.pkl')
scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
encoder_path = os.path.join(MODELS_DIR, 'label_encoder.pkl')

rf_model = joblib.load(model_path)
scaler = joblib.load(scaler_path)
label_encoder = joblib.load(encoder_path)

# Warm-up librosa
dummy = np.random.randn(22050 * 5).astype(np.float32) * 0.05
_ = librosa.feature.mfcc(y=dummy, sr=22050, n_mfcc=13)
print("[INFO] Model siap untuk inferensi!")

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Audio Classifier</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        /* CSS tetap dipertahankan seperti aslinya untuk menjaga UI */
        :root { --bg-color: #0f172a; --card-bg: #1e293b; --border-color: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --color-noisy: #ef4444; --color-clean: #10b981; --accent-blue: #3b82f6; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background-color: var(--bg-color); color: var(--text-main); padding: 24px 16px; min-height: 100vh; }
        .container { max-width: 1080px; margin: 0 auto; }
        header { text-align: center; margin-bottom: 24px; }
        h1 { font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        p.subtitle { color: var(--text-muted); font-size: 1rem; }
        .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 800px) { .main-grid { grid-template-columns: 1fr; } }
        .card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
        .status-container { text-align: center; padding: 28px 16px; border-radius: 14px; transition: all 0.3s ease; position: relative; overflow: hidden; }
        .status-standby { background: #334155; border: 2px dashed #64748b; }
        .status-clean { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(4, 120, 87, 0.4)); border: 2px solid var(--color-clean); box-shadow: 0 0 25px rgba(16, 185, 129, 0.3); }
        .status-noisy { background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.6)); border: 2px solid var(--color-noisy); box-shadow: 0 0 35px rgba(239, 68, 68, 0.6); animation: pulseAlert 0.7s infinite alternate; }
        @keyframes pulseAlert { from { transform: scale(1); box-shadow: 0 0 25px rgba(239, 68, 68, 0.4); } to { transform: scale(1.02); box-shadow: 0 0 45px rgba(239, 68, 68, 0.85); } }
        .status-title { font-size: 2.1rem; font-weight: 800; letter-spacing: 0.03em; margin-bottom: 6px; }
        .status-confidence { font-size: 1.15rem; color: #e2e8f0; font-weight: 600; }
        .progress-box { margin: 14px 0 6px 0; background-color: #0b1120; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; }
        .progress-bar-bg { background-color: #1e293b; border-radius: 8px; height: 14px; overflow: hidden; margin-top: 6px; }
        .progress-bar-fill { background: linear-gradient(90deg, #3b82f6, #a855f7); height: 100%; width: 0%; transition: width 0.15s ease-out; }
        .progress-text { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .controls { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; justify-content: center; align-items: center; }
        button.btn { padding: 12px 24px; font-size: 1rem; font-weight: 700; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        button.btn-primary { background-color: var(--accent-blue); color: white; }
        button.btn-primary:hover { background-color: #2563eb; }
        button.btn-danger { background-color: var(--color-noisy); color: white; }
        button.btn-danger:hover { background-color: #dc2626; }
        .setting-row { display: flex; align-items: center; gap: 12px; background-color: #0b1120; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; margin-top: 14px; font-size: 0.9rem; }
        .setting-row select { background-color: #1e293b; color: white; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; font-weight: 600; cursor: pointer; }
        .toggle-sound { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted); cursor: pointer; user-select: none; margin-left: auto; }
        .toggle-sound input { cursor: pointer; width: 18px; height: 18px; }
        canvas#visualizer { width: 100%; height: 130px; background-color: #0b1120; border-radius: 10px; border: 1px solid var(--border-color); margin-top: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px; }
        @media (max-width: 600px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
        .metric-item { background-color: #0b1120; border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 8px; text-align: center; }
        .metric-val { font-family: 'JetBrains Mono', monospace; font-size: 1.25rem; font-weight: 700; color: #38bdf8; }
        .metric-lbl { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .log-box { background-color: #0b1120; border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; height: 180px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #cbd5e1; margin-top: 10px; }
        .log-entry { margin-bottom: 5px; }
        .log-noisy { color: #f87171; font-weight: 600; }
        .log-clean { color: #4ade80; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎙️ Live Audio Classifier: Berisik vs Non-Berisik</h1>
            <p class="subtitle">Sistem mendengarkan audio langsung dan mengevaluasi setiap <b>3 detik</b>. Klasifikasi didukung oleh model <b>Random Forest</b>.</p>
        </header>

        <div class="main-grid">
            <div class="card">
                <h3 style="margin-bottom: 6px;">1. Pemantau Audio Mikrofon</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Klik tombol <b>"Mulai Deteksi Langsung"</b> untuk memulai pemantauan berkala.</p>
                <canvas id="visualizer"></canvas>
                <div class="progress-box">
                    <div class="progress-text">
                        <span id="progressLabel">⏱️ Buffer Audio Terkumpul:</span>
                        <span id="progressTimer" style="color: #60a5fa; font-family: 'JetBrains Mono';">0.0s / 3.0s</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div id="progressBar" class="progress-bar-fill"></div>
                    </div>
                </div>
                <div class="setting-row">
                    <label for="selDuration" style="font-weight: 600;">⏱️ Interval:</label>
                    <select id="selDuration" onchange="changeDuration()">
                        <option value="2">2 Detik</option>
                        <option value="3" selected>3 Detik</option>
                        <option value="5">5 Detik</option>
                    </select>
                    <label class="toggle-sound">
                        <input type="checkbox" id="chkSoundAlert" checked>
                        <span>🔊 Bunyi Alarm</span>
                    </label>
                </div>
                <div class="controls">
                    <button id="btnStart" class="btn btn-primary" onclick="startLiveAudio()">▶️ Mulai Deteksi Langsung</button>
                    <button id="btnStop" class="btn btn-danger" onclick="stopLiveAudio()" style="display: none;">⏹️ Hentikan Pemantauan</button>
                </div>
                <div style="margin-top: 14px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">
                    Status: <span id="micStatus" style="font-weight: 600; color: #fbbf24;">Standby (Belum Aktif)</span>
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 10px;">2. Hasil Klasifikasi (Random Forest)</h3>
                <div id="statusBox" class="status-container status-standby">
                    <div id="statusTitle" class="status-title">⏳ MENUNGGU INPUT</div>
                    <div id="statusConfidence" class="status-confidence">Silakan aktifkan mikrofon di sebelah kiri</div>
                </div>
                <div class="metrics-grid">
                    <div class="metric-item"><div class="metric-val" id="valRms">-</div><div class="metric-lbl">RMS Energy</div></div>
                    <div class="metric-item"><div class="metric-val" id="valCentroid">-</div><div class="metric-lbl">Centroid (Hz)</div></div>
                    <div class="metric-item"><div class="metric-val" id="valZcr">-</div><div class="metric-lbl">Zero Crossing</div></div>
                    <div class="metric-item"><div class="metric-val" id="valMfcc1">-</div><div class="metric-lbl">MFCC Koef 1</div></div>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📋 Log Riwayat Deteksi Kebisingan per Jendela Waktu</h3>
            <div id="activityLog" class="log-box">
                <div class="log-entry" style="color: #64748b;">[System] Menunggu aktivasi pemantauan audio langsung...</div>
            </div>
        </div>
    </div>

    <script>
        let isMonitoring = false, audioContext = null, mediaStream = null, scriptProcessor = null, analyser = null, bufferChunk = [], isProcessing = false, lastAlertTime = 0;
        const SAMPLE_RATE = 22050;
        let durationSeconds = 3.0;
        let CHUNK_SIZE = Math.round(SAMPLE_RATE * durationSeconds);

        const statusBox = document.getElementById('statusBox'), statusTitle = document.getElementById('statusTitle'), statusConfidence = document.getElementById('statusConfidence'), micStatus = document.getElementById('micStatus'), btnStart = document.getElementById('btnStart'), btnStop = document.getElementById('btnStop'), chkSoundAlert = document.getElementById('chkSoundAlert'), selDuration = document.getElementById('selDuration'), activityLog = document.getElementById('activityLog'), progressBar = document.getElementById('progressBar'), progressTimer = document.getElementById('progressTimer'), valRms = document.getElementById('valRms'), valCentroid = document.getElementById('valCentroid'), valZcr = document.getElementById('valZcr'), valMfcc1 = document.getElementById('valMfcc1'), canvas = document.getElementById('visualizer'), canvasCtx = canvas.getContext('2d');

        function changeDuration() {
            durationSeconds = parseFloat(selDuration.value);
            CHUNK_SIZE = Math.round(SAMPLE_RATE * durationSeconds);
            bufferChunk = [];
        }

        function playAlarmSound() {
            if (!chkSoundAlert.checked) return;
            try {
                const now = Date.now();
                if (now - lastAlertTime < 1000) return;
                lastAlertTime = now;
                const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(900, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.25);
            } catch (err) { console.error("Audio beep error:", err); }
        }

        async function startLiveAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
                mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                const source = audioContext.createMediaStreamSource(mediaStream);
                analyser = audioContext.createAnalyser(); analyser.fftSize = 256;
                source.connect(analyser);
                scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                source.connect(scriptProcessor); scriptProcessor.connect(audioContext.destination);

                bufferChunk = []; isMonitoring = true;
                btnStart.style.display = 'none'; btnStop.style.display = 'inline-flex';
                micStatus.innerText = `🔴 Aktif Mendengarkan...`; micStatus.style.color = '#4ade80';

                scriptProcessor.onaudioprocess = function(e) {
                    if (!isMonitoring) return;
                    bufferChunk.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                    let totalLength = bufferChunk.reduce((acc, curr) => acc + curr.length, 0);
                    let currentSec = (totalLength / SAMPLE_RATE).toFixed(1);
                    let pct = Math.min(100, Math.round((totalLength / CHUNK_SIZE) * 100));
                    progressBar.style.width = pct + '%'; progressTimer.innerText = `${currentSec}s / ${durationSeconds.toFixed(1)}s (${pct}%)`;

                    if (totalLength >= CHUNK_SIZE && !isProcessing) {
                        const mergedBuffer = new Float32Array(totalLength);
                        let offset = 0;
                        for (let chunk of bufferChunk) { mergedBuffer.set(chunk, offset); offset += chunk.length; }
                        bufferChunk = []; progressBar.style.width = '0%'; progressTimer.innerText = `0.0s / ${durationSeconds.toFixed(1)}s (0%)`;
                        sendAudioForClassification(mergedBuffer);
                    }
                };
                drawVisualizer();
            } catch (err) { alert("Gagal mengakses mikrofon: " + err.message); }
        }

        function stopLiveAudio() {
            isMonitoring = false;
            if (scriptProcessor) scriptProcessor.disconnect();
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            if (audioContext) audioContext.close();
            btnStart.style.display = 'inline-flex'; btnStop.style.display = 'none';
            micStatus.innerText = 'Standby (Nonaktif)'; micStatus.style.color = '#fbbf24';
            statusBox.className = 'status-container status-standby';
            statusTitle.innerText = '⏳ STANDBY'; statusConfidence.innerText = 'Pemantauan dihentikan';
        }

        async function sendAudioForClassification(float32Array) {
            isProcessing = true;
            try {
                const response = await fetch('/api/classify_pcm', {
                    method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: float32Array.buffer
                });
                if (response.ok) {
                    const data = await response.json();
                    const timeStr = new Date().toLocaleTimeString();
                    valRms.innerText = data.features.rms.toFixed(4); valCentroid.innerText = Math.round(data.features.centroid);
                    valZcr.innerText = data.features.zcr.toFixed(4); valMfcc1.innerText = data.features.mfcc_1.toFixed(1);

                    if (data.label === 'berisik') {
                        statusBox.className = 'status-container status-noisy'; statusTitle.innerText = `🚨 BERISIK`;
                        statusConfidence.innerText = `Confidence: ${data.confidence.toFixed(1)}%`;
                        playAlarmSound(); logMessage(`[${timeStr}] 🚨 BERISIK (${data.confidence.toFixed(1)}%)`, "noisy");
                    } else {
                        statusBox.className = 'status-container status-clean'; statusTitle.innerText = `🌿 NON-BERISIK`;
                        statusConfidence.innerText = `Confidence: ${data.confidence.toFixed(1)}%`;
                        logMessage(`[${timeStr}] 🌿 NON-BERISIK (${data.confidence.toFixed(1)}%)`, "clean");
                    }
                }
            } catch (err) {} finally { isProcessing = false; }
        }

        function drawVisualizer() {
            if (!isMonitoring) return;
            requestAnimationFrame(drawVisualizer);
            const bufferLength = analyser.frequencyBinCount, dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.fillStyle = '#0b1120'; canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            canvasCtx.lineWidth = 2.5; canvasCtx.strokeStyle = statusBox.classList.contains('status-noisy') ? '#ef4444' : '#38bdf8';
            canvasCtx.beginPath();
            const sliceWidth = canvas.width * 1.0 / bufferLength; let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0, y = v * canvas.height / 2;
                if (i === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y);
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2); canvasCtx.stroke();
        }

        function logMessage(text, type) {
            const entry = document.createElement('div'); entry.className = 'log-entry';
            if (type === 'noisy') entry.className += ' log-noisy'; else if (type === 'clean') entry.className += ' log-clean';
            entry.innerText = text; activityLog.appendChild(entry); activityLog.scrollTop = activityLog.scrollHeight;
        }
        window.addEventListener('resize', () => { canvas.width = canvas.parentElement.clientWidth; });
        setTimeout(() => { canvas.width = canvas.parentElement.clientWidth; }, 100);
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/classify_pcm', methods=['POST'])
def classify_pcm():
    raw_bytes = request.get_data()
    if not raw_bytes:
        return jsonify({'error': 'Buffer audio kosong'}), 400
        
    y = np.frombuffer(raw_bytes, dtype=np.float32)
    sr = 22050
    if len(y) < 1024:
        return jsonify({'error': 'Panjang sampel terlalu pendek'}), 400
        
    rms = float(np.mean(librosa.feature.rms(y=y)))
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=y)))
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_means = [float(np.mean(c)) for c in mfcc]
    
    feature_vector = [rms, centroid, zcr] + mfcc_means
    scaled_features = scaler.transform(np.array(feature_vector).reshape(1, -1))
    
    # Menggunakan model Random Forest
    pred_code = int(rf_model.predict(scaled_features)[0])
    pred_label = label_encoder.inverse_transform([pred_code])[0]
    pred_proba = rf_model.predict_proba(scaled_features)[0]
    confidence = float(pred_proba[pred_code] * 100)
    
    return jsonify({
        'label': pred_label,
        'confidence': confidence,
        'features': {
            'rms': rms,
            'centroid': centroid,
            'zcr': zcr,
            'mfcc_1': mfcc_means[0]
        }
    })

if __name__ == '__main__':
    port = 5000
    print(f"\n[INFO] Menjalankan Live Audio Server pada http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)