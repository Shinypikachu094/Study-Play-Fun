// Coin Pusher safety walls and return tracking.
(function () {
  const canvas = document.getElementById('game');
  const drop = document.getElementById('drop');
  const side = document.querySelector('.side');
  if (!canvas || !drop || !side) return;

  const KEY = 'coinPusherStatsV1';
  const load = () => { try { return { putIn: 0, takenBack: 0, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { putIn: 0, takenBack: 0 }; } };
  let stats = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(stats));
  const ratio = () => stats.putIn ? `${((stats.takenBack / stats.putIn) * 100).toFixed(1)}%` : '0.0%';

  const heading = side.querySelector('h2');
  const metrics = document.createElement('div');
  metrics.innerHTML = '<div class="stat"><span>Coins put in</span><strong id="put-in-count">0</strong></div><div class="stat"><span>Coins taken back</span><strong id="taken-back-count">0</strong></div><div class="stat"><span>Return ratio</span><strong id="return-ratio">0.0%</strong></div><div class="stat"><span>Arcade Points</span><strong id="arcade-points-count">0</strong></div>';
  heading.insertAdjacentElement('afterend', metrics);
  const putIn = document.getElementById('put-in-count');
  const takenBack = document.getElementById('taken-back-count');
  const returnRatio = document.getElementById('return-ratio');
  const arcadePoints = document.getElementById('arcade-points-count');
  const refreshMetrics = () => { putIn.textContent = stats.putIn; takenBack.textContent = stats.takenBack; returnRatio.textContent = ratio(); arcadePoints.textContent = typeof window.arcadeState === 'function' ? window.arcadeState().points : 0; };
  refreshMetrics();

  const oldDrop = drop.onclick;
  drop.onclick = () => {
    const balance = typeof arcadeState === 'function' ? arcadeState().coins : 0;
    if (balance < 1) return;
    stats.putIn += 1;
    save();
    refreshMetrics();
    if (oldDrop) oldDrop();
  };

  const oldAddCoins = window.arcadeAddCoins;
  if (typeof oldAddCoins === 'function') {
    window.arcadeAddCoins = (amount, source) => {
      if (source === 'prize') { stats.takenBack += Number(amount) || 0; save(); if (typeof window.arcadeAddPoints === 'function') window.arcadeAddPoints(Number(amount) || 0, 'coinPusher'); refreshMetrics(); }
      return oldAddCoins(amount, source);
    };
  }

  const oldUpdate = window.update;
  if (typeof oldUpdate === 'function') {
    window.update = (dt) => {
      oldUpdate(dt);
      if (!Array.isArray(window.coins)) return;
      window.coins.forEach((coin) => {
        // Keep every coin inside the cabinet walls; the bottom prize box remains the exit.
        coin.x = Math.max(66, Math.min(634, coin.x));
        coin.y = Math.max(48, coin.y);
      });
    };
  }

  const oldDraw = window.draw;
  if (typeof oldDraw === 'function') {
    window.draw = () => {
      oldDraw();
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.strokeStyle = '#8ee7ff';
      ctx.lineWidth = 8;
      ctx.strokeRect(54, 36, 592, 352);
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2;
      ctx.strokeRect(62, 44, 576, 336);
      ctx.fillStyle = '#fff3a3';
      ctx.font = '800 13px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('CABINET WALLS', 70, 64);
      ctx.restore();
    };
  }
  const tip = side.querySelector('.tip');
  if (tip) tip.textContent = 'Every drop is counted. Coins that reach the prize box are returned, and the ratio shows returned coins divided by coins put in.';
  window.addEventListener('beforeunload', save);
})();
