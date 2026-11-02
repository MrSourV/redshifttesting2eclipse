// hero eclipse: a dithered limb band with white motes drifting off it

(function(){
  const cv = document.getElementById('eclipse');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // band colour by depth inside the arc
  const STOPS = [
    [0.00, 255,  92,  84],
    [0.10, 236,  40,  54],
    [0.45, 196,  28,  66],
    [1.00, 120,  16,  56]
  ];
  function ramp(t){
    let a = STOPS[0], b = STOPS[STOPS.length-1];
    for (let i=0;i<STOPS.length-1;i++){
      if (t >= STOPS[i][0] && t <= STOPS[i+1][0]) { a = STOPS[i]; b = STOPS[i+1]; break; }
    }
    const k = (t - a[0]) / Math.max(.0001, b[0] - a[0]);
    return [a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k, a[3]+(b[3]-a[3])*k];
  }

  function rnd(ix, iy){
    let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  let w=0, h=0, dpr=1;
  let cx=0, cy=0, R=0, band=0;
  let bandCv=null;                 // the static dithered limb
  let angles=[];                   // arc angles that land on screen
  let motes=[];

  // circle through the two viewport edge crossings, flattened by ECL_FLAT
  function geometry(){
    const aspect = w / h;
    let tall = (1.6 - aspect) / 1.0;
    tall = tall < 0 ? 0 : tall > 1 ? 1 : tall;

    const fy = ECL_EDGE_Y + 0.20 * tall;   // arc meets the right edge here
    const fx = ECL_EDGE_X + 0.18 * tall;   // and the bottom edge here

    const p1x = w,        p1y = h * fy;
    const p2x = w * fx,   p2y = h;
    const mx = (p1x + p2x) / 2, my = (p1y + p2y) / 2;
    let vx = p2x - p1x, vy = p2y - p1y;
    const chord = Math.hypot(vx, vy) || 1;
    // perpendicular pointing down-right, toward the centre
    let nx = -vy / chord, ny = vx / chord;
    if (nx < 0) { nx = -nx; ny = -ny; }

    const k = ECL_FLAT * chord;            // bigger = flatter arc
    cx = mx + nx * k;
    cy = my + ny * k;
    R  = Math.hypot(k, chord / 2);
    band = Math.min(w, h) * ECL_BAND;

    angles.length = 0;
    const step = Math.PI / 900;
    for (let a = 0; a < Math.PI * 2; a += step){
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      if (x > -60 && x < w + 60 && y > -60 && y < h + 60) angles.push(a);
    }
  }

  // density across the limb: climbs to a peak just inside the edge, then falls away
  function density(d){
    if (Math.abs(d) < ECL_RIM) return 0.97;          // bright line on the edge itself
    if (d > 0) return 0.72 * Math.exp(-d / (band * 0.10));
    const v = -d / band;
    return 0.78 * Math.exp(-Math.pow(v / 0.55, 1.7));
  }

  function buildBand(){
    const bw = Math.max(1, Math.ceil(w / ECL_CELL));
    const bh = Math.max(1, Math.ceil(h / ECL_CELL));
    bandCv = document.createElement('canvas');
    bandCv.width = bw; bandCv.height = bh;
    const bx = bandCv.getContext('2d');
    const img = bx.createImageData(bw, bh);
    const px = img.data;

    for (let gy=0, i=0; gy<bh; gy++){
      const y = gy * ECL_CELL;
      for (let gx=0; gx<bw; gx++, i++){
        const x = gx * ECL_CELL;
        const d = Math.hypot(x - cx, y - cy) - R;
        const pr = density(d);
        if (pr < 0.004) continue;
        if (rnd(gx, gy) >= pr) continue;
        const onRim = Math.abs(d) < ECL_RIM;
        const v = d < 0 ? Math.min(1, (-d) / band) : 0;
        const c = onRim ? [255, 158, 146] : ramp(v);
        const p = i * 4;
        px[p] = c[0]; px[p+1] = c[1]; px[p+2] = c[2];
        px[p+3] = 255;
      }
    }
    bx.putImageData(img, 0, 0);
  }

  function spawn(m, seeded){
    const a = angles.length
      ? angles[(Math.random() * angles.length) | 0]
      : Math.random() * Math.PI * 2;
    const nx = Math.cos(a), ny = Math.sin(a);
    const off = (Math.random() - 0.45) * band * 0.18;
    m.x = cx + nx * (R + off);
    m.y = cy + ny * (R + off);
    const tanJ = (Math.random() - 0.5) * 0.7;
    const sp = ECL_DOT_SPEED[0] + Math.random() * (ECL_DOT_SPEED[1] - ECL_DOT_SPEED[0]);
    m.vx = (nx - ny * tanJ) * sp;
    m.vy = (ny + nx * tanJ) * sp;
    m.life = ECL_DOT_LIFE[0] + Math.random() * (ECL_DOT_LIFE[1] - ECL_DOT_LIFE[0]);
    m.age = seeded ? Math.random() * m.life : 0;
    m.r = 0.8 + Math.pow(Math.random(), 2) * 1.8;
    m.peak = 0.42 + Math.random() * 0.58;
    // let the seeded ones start where they would have drifted to
    if (seeded){ m.x += m.vx * m.age; m.y += m.vy * m.age; }
  }

  function buildMotes(){
    const want = Math.min(ECL_DOT_MAX, Math.round(w * h / ECL_DOT_AREA));
    motes = new Array(want);
    for (let i=0;i<want;i++){ motes[i] = {}; spawn(motes[i], true); }
  }

  function build(){
    w = cv.clientWidth || innerWidth;
    h = cv.clientHeight || innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geometry();
    buildBand();
    buildMotes();
  }

  function render(dt){
    ctx.clearRect(0, 0, w, h);

    // the limb, scaled up with no smoothing so the blocks stay crisp
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bandCv, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;

    // white motes coming off the edge
    ctx.fillStyle = '#fff';
    for (let i=0;i<motes.length;i++){
      const m = motes[i];
      if (dt){
        m.age += dt;
        if (m.age >= m.life || m.x < -80 || m.y < -80 || m.x > w + 80 || m.y > h + 80){
          spawn(m, false);
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
      }
      const t = m.age / m.life;
      let a = t < 0.14 ? t / 0.14 : (t > 0.55 ? (1 - t) / 0.45 : 1);
      a *= m.peak;
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let raf = 0, prev = 0, onScreen = true;

  function loop(ts){
    raf = requestAnimationFrame(loop);
    const dt = prev ? Math.min((ts - prev) / 1000, 0.05) : 0;
    prev = ts;
    render(dt);
  }

  function start(){ if (!raf && !slow){ prev = 0; raf = requestAnimationFrame(loop); } }
  function stop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } }

  let rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { build(); render(0); }, 150);
  });

  build();
  render(0);
  if (slow) return;
  start();

  const hero = document.getElementById('top');
  if (hero && 'IntersectionObserver' in window){
    new IntersectionObserver(es => {
      onScreen = es[0].isIntersecting;
      onScreen ? start() : stop();
    }, {threshold:0}).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : (onScreen && start());
  });
})();
