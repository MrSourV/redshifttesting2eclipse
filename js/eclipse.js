// hero eclipse
// a huge circle centred off the top-left. the lit side is OUTSIDE it (bottom-right):
// red dither there only, white motes on the dark side only, bright line on the boundary.

(function(){
  const cv = document.getElementById('eclipse');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // band colour by distance out from the edge
  const STOPS = [
    [0.00, 244,  66,  74],
    [0.35, 196,  34,  62],
    [1.00, 120,  24,  48]
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
  let cx=0, cy=0, R=0, fade=0, reach=0;
  let bandCv=null, angles=[], motes=[], buckets=[];

  function geometry(){
    const aspect = w / h;
    let tall = (1.6 - aspect) / 1.0;
    tall = tall < 0 ? 0 : tall > 1 ? 1 : tall;

    // on wide screens the sweep runs bottom edge -> right edge.
    // as the window gets taller the lower end slides onto the left edge,
    // which keeps the curve crossing the right edge exactly once.
    const p1x = w * ECL_EDGE_X * (1 - tall);
    const p1y = h * (1 - 0.01 * tall);
    const p2x = w;
    const p2y = h * (ECL_EDGE_Y + 0.26 * tall);
    const mx = (p1x + p2x) / 2, my = (p1y + p2y) / 2;
    const vx = p2x - p1x, vy = p2y - p1y;
    const chord = Math.hypot(vx, vy) || 1;
    // normal pointing up-left, so the centre sits off that corner
    let nx = vy / chord, ny = -vx / chord;
    if (nx > 0) { nx = -nx; ny = -ny; }

    const k = ECL_FLAT * chord;
    cx = mx + nx * k;
    cy = my + ny * k;
    R  = Math.hypot(k, chord / 2);

    fade  = w * ECL_FADE;    // how fast the red dies off going out
    reach = w * ECL_REACH;   // how far the motes thin out going in

    angles.length = 0;
    const step = Math.PI / 1400;
    for (let a = 0; a < Math.PI * 2; a += step){
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      if (x > -40 && x < w + 40 && y > -40 && y < h + 40) angles.push(a);
    }
  }

  // d > 0 is the lit side. nothing red ever crosses to the dark side.
  function density(d){
    if (d < -ECL_RIM) return 0;
    if (d < ECL_RIM) return 0.92;        // the bright line itself
    return 0.80 * Math.exp(-d / fade);
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
        if (pr < 0.004 || rnd(gx, gy) >= pr) continue;
        const c = (d < ECL_RIM) ? ECL_RIM_RGB : ramp(Math.min(1, d / (fade * 3)));
        const p = i * 4;
        px[p] = c[0]; px[p+1] = c[1]; px[p+2] = c[2]; px[p+3] = 255;
      }
    }
    bx.putImageData(img, 0, 0);
  }

  function spawn(m, seeded){
    const a = angles.length
      ? angles[(Math.random() * angles.length) | 0]
      : Math.random() * Math.PI * 2;
    const nx = Math.cos(a), ny = Math.sin(a);
    // start on the boundary, head inward (that is the dark side)
    m.x = cx + nx * (R - Math.random() * 3);
    m.y = cy + ny * (R - Math.random() * 3);
    const tan = (Math.random() - 0.5) * 0.5;
    const sp = ECL_DOT_SPEED[0] + Math.random() * (ECL_DOT_SPEED[1] - ECL_DOT_SPEED[0]);
    m.vx = (-nx - ny * tan) * sp;
    m.vy = (-ny + nx * tan) * sp;
    // exponential lifetimes give the density falloff seen on the reference
    const u = Math.random();
    m.life = Math.min(14, 0.35 + -Math.log(1 - u) * (reach / sp));
    m.age = seeded ? Math.random() * m.life : 0;
    m.r = ECL_DOT_R[0] + Math.pow(Math.random(), 2.2) * (ECL_DOT_R[1] - ECL_DOT_R[0]);
    m.peak = 0.22 + Math.random() * 0.78;
    if (seeded){ m.x += m.vx * m.age; m.y += m.vy * m.age; }
  }

  function buildMotes(){
    const want = Math.min(ECL_DOT_MAX, Math.round(w * h / ECL_DOT_AREA));
    motes = new Array(want);
    for (let i=0;i<want;i++){ motes[i] = {}; spawn(motes[i], true); }
    buckets = [];
    for (let i=0;i<ECL_DOT_LEVELS;i++) buckets.push([]);
  }

  function build(){
    w = cv.clientWidth || innerWidth;
    h = cv.clientHeight || innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geometry(); buildBand(); buildMotes();
  }

  function render(dt){
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bandCv, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;

    for (let b=0;b<buckets.length;b++) buckets[b].length = 0;

    for (let i=0;i<motes.length;i++){
      const m = motes[i];
      if (dt){
        m.age += dt;
        if (m.age >= m.life || m.x < -40 || m.y < -40 || m.x > w + 40 || m.y > h + 40){
          spawn(m, false);
        } else {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
        }
      }
      const t = m.age / m.life;
      let a = t < 0.12 ? t / 0.12 : Math.pow(1 - (t - 0.12) / 0.88, 0.7);
      a *= m.peak;
      if (a <= 0.02) continue;
      let b = (a * ECL_DOT_LEVELS) | 0;
      if (b >= ECL_DOT_LEVELS) b = ECL_DOT_LEVELS - 1;
      buckets[b].push(m);
    }

    // one path per brightness level keeps thousands of motes cheap
    ctx.fillStyle = '#fff';
    for (let b=0;b<buckets.length;b++){
      const list = buckets[b];
      if (!list.length) continue;
      ctx.globalAlpha = (b + 0.5) / ECL_DOT_LEVELS;
      ctx.beginPath();
      for (let i=0;i<list.length;i++){
        const m = list[i];
        ctx.moveTo(m.x + m.r, m.y);
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
      }
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
