export class UI {
  constructor() {
    this.elements = {};
    this._create();
  }

  _create() {
    // Objective panel — top-left, thin border
    const obj = document.createElement('div');
    obj.id = 'objective';
    obj.style.cssText = `
      position: fixed; top: 12px; left: 12px; min-width: 220px;
      background: rgba(0,0,0,0.6); border: 1px solid #0a0; padding: 8px 12px;
      font-family: 'Courier New', monospace; font-size: 11px; color: #0f0;
      pointer-events: none; z-index: 10;
      line-height: 1.6;
    `;
    obj.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">▸ TUGAS</div><div id="obj-text">Awasi CCTV — laporan anomali</div>';
    document.body.appendChild(obj);

    // Battery bar — top-right, thin border
    const bat = document.createElement('div');
    bat.id = 'battery';
    bat.style.cssText = `
      position: fixed; top: 12px; right: 12px; min-width: 140px;
      background: rgba(0,0,0,0.6); border: 1px solid #0a0; padding: 8px 12px;
      font-family: 'Courier New', monospace; font-size: 11px; color: #0f0;
      pointer-events: none; z-index: 10;
    `;
    bat.innerHTML = '<div style="margin-bottom:4px">🔋 DAYA</div><div id="bat-fill" style="height:10px;background:#0a0;width:100%;border:1px solid #0f0;transition:width 0.3s,background 0.3s"><div id="bat-inner" style="height:100%;background:#0f0;width:100%;transition:width 0.3s"></div></div>';
    document.body.appendChild(bat);

    // Camera label — bottom-center
    const cam = document.createElement('div');
    cam.id = 'cam-label';
    cam.style.cssText = `
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.5); border: 1px solid #0a0; padding: 6px 16px;
      font-family: 'Courier New', monospace; font-size: 13px; color: #0f0;
      pointer-events: none; z-index: 10; display: none;
    `;
    document.body.appendChild(cam);

    // Interaction prompt — center-bottom
    const interact = document.createElement('div');
    interact.id = 'interact';
    interact.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.5); border: 1px solid #ff0; padding: 4px 12px;
      font-family: 'Courier New', monospace; font-size: 12px; color: #ff0;
      pointer-events: none; z-index: 10;
    `;
    document.body.appendChild(interact);

    // Anomaly alert — center-top
    const alert = document.createElement('div');
    alert.id = 'anomaly-alert';
    alert.style.cssText = `
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.7); border: 1px solid #f00; padding: 8px 20px;
      font-family: 'Courier New', monospace; font-size: 14px; color: #f00;
      pointer-events: none; z-index: 20; display: none;
      text-align: center;
    `;
    document.body.appendChild(alert);

    // Global message overlay
    const msg = document.createElement('div');
    msg.id = 'message-overlay';
    msg.style.cssText = `
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85); z-index: 100; pointer-events: none;
      font-family: 'Courier New', monospace; color: #0f0; font-size: 18px;
      opacity: 0; transition: opacity 0.8s;
    `;
    document.body.appendChild(msg);

    // Jumpscare overlay
    const jump = document.createElement('div');
    jump.id = 'jumpscare';
    jump.style.cssText = `
      position: fixed; inset: 0; z-index: 200; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.05s;
    `;
    const jumpImg = document.createElement('img');
    jumpImg.id = 'jump-img';
    jumpImg.style.cssText = 'width:100%;height:100%;object-fit:cover;image-rendering:pixelated;';
    // Generate a procedural face via canvas
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☠', 128, 130);
    ctx.fillStyle = '#ff0000';
    ctx.font = '18px monospace';
    ctx.fillText('PICANOBU', 128, 210);
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(108, 100, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(148, 100, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(108, 140, 40, 3);
    jumpImg.src = c.toDataURL();
    jump.appendChild(jumpImg);
    const jumpFlash = document.createElement('div');
    jumpFlash.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:201;pointer-events:none;transition:opacity 0.3s';
    jumpFlash.id = 'jump-flash';
    document.body.appendChild(jumpFlash);
    document.body.appendChild(jump);

    this.elements = {
      objective: obj,
      objText: document.getElementById('obj-text'),
      battery: bat,
      batFill: document.getElementById('bat-fill'),
      batInner: document.getElementById('bat-inner'),
      camLabel: cam,
      interact: interact,
      alert: alert,
      messageOverlay: msg,
      jumpscare: jump,
      jumpFlash: jumpFlash,
    };
  }

  setObjective(text) {
    this.elements.objText.textContent = text;
  }

  setBattery(ratio) {
    const pct = Math.max(0, Math.min(100, ratio * 100));
    this.elements.batInner.style.width = `${pct}%`;
    if (pct < 20) {
      this.elements.batFill.style.borderColor = '#f00';
      this.elements.batInner.style.background = '#f00';
    } else if (pct < 50) {
      this.elements.batFill.style.borderColor = '#ff0';
      this.elements.batInner.style.background = '#ff0';
    } else {
      this.elements.batFill.style.borderColor = '#0f0';
      this.elements.batInner.style.background = '#0f0';
    }
  }

  setCameraLabel(label) {
    if (label) {
      this.elements.camLabel.textContent = `📷 ${label}`;
      this.elements.camLabel.style.display = 'block';
    } else {
      this.elements.camLabel.style.display = 'none';
    }
  }

  setInteraction(text) {
    this.elements.interact.textContent = text || '';
    this.elements.interact.style.display = text ? 'block' : 'none';
  }

  showAnomalyAlert(text) {
    const el = this.elements.alert;
    el.textContent = `⚠ ${text}`;
    el.style.display = 'block';
    clearTimeout(this._alertTimeout);
    this._alertTimeout = setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  showMessage(text, duration = 3000) {
    const el = this.elements.messageOverlay;
    el.innerHTML = text.replace(/\n/g, '<br>');
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    clearTimeout(this._msgTimeout);
    this._msgTimeout = setTimeout(() => {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }, duration);
  }

  showJumpscare(duration = 1800, onComplete) {
    const el = this.elements.jumpscare;
    const flash = this.elements.jumpFlash;
    el.style.opacity = '1';
    flash.style.opacity = '0.4';
    flash.style.pointerEvents = 'none';
    setTimeout(() => { flash.style.opacity = '0'; }, 200);

    // Screen shake
    const origTransform = document.body.style.transform;
    let shakeIntensity = 12;
    const shakeInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * shakeIntensity;
      const y = (Math.random() - 0.5) * shakeIntensity;
      document.body.style.transform = `translate(${x}px,${y}px)`;
      shakeIntensity *= 0.95;
    }, 30);

    setTimeout(() => {
      clearInterval(shakeInterval);
      document.body.style.transform = origTransform;
      el.style.opacity = '0';
      flash.style.opacity = '0';
      if (onComplete) onComplete();
    }, duration);
  }

  showReport(report) {
    const lines = [
      '═══ LAPORAN SHIFT ═══',
      '',
      `Durasi: ${Math.floor(report.totalTime / 60)}m ${Math.floor(report.totalTime % 60)}s`,
      `Anomali terdeteksi: ${report.glitches}`,
      '',
      report.verdict,
      '',
      '───',
      '[ TEKAN SPASI UNTUK MENCOBA LAGI ]',
    ].join('\n');
    this.showMessage(lines, 999999);
  }

  dispose() {
    Object.values(this.elements).forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
}
