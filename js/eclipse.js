// hero eclipse, a dithered disk that dissolves into specks

(function(){
  const cv = document.getElementById('eclipse');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d', {alpha:true});
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // colour ramp across the disk: hot near the bottom-left tip, deep crimson up top
  const STOPS = [
    [0.00, 255, 86, 64],
    [0.45, 232, 37, 51],
    [1.00, 168, 24, 76]
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

  let cw=0, ch=0, img=null, px=null;
  let dist=null, r1=null, r2=null, r3=null, cr=null, cg=null, cb=null, dw=null;
  let R=0, core=0, scatter=0;

  function build(){
    const w = cv.clientWidth || innerWidth;
    const h = cv.clientHeight || innerHeight;
    cw = Math.max(1, Math.ceil(w / ECL_CELL));
    ch = Math.max(1, Math.ceil(h / ECL_CELL));
    cv.width = cw; cv.height = ch;

    img = ctx.createImageData(cw, ch);
    px  = img.data;

    const n = cw * ch;
    dist = new Float32Array(n);
    r1 = new Float32Array(n); r2 = new Float32Array(n); r3 = new Float32Array(n);
    cr = new Uint8Array(n); cg = new Uint8Array(n); cb = new Uint8Array(n);
    dw = new Float32Array(n);

    // the taller the window, the further down-right the disk sits,
    // so it never creeps up behind the copy
    const aspect = w / h;
    let tall = (1.6 - aspect) / 1.0;
    tall = tall < 0 ? 0 : tall > 1 ? 1 : tall;
    const cx = w * (ECL_CX + 0.10 * tall);
    const cy = h * (ECL_CY + 0.26 * tall);
    R = Math.hypot(w, h) * (ECL_R + 0.16 * tall);
    core = ECL_CORE;
    scatter = Math.min(w, h) * ECL_SCATTER;

    let i = 0;
    for (let gy=0; gy<ch; gy++){
      const y = gy * ECL_CELL;
      for (let gx=0; gx<cw; gx++, i++){
        const x = gx * ECL_CELL;
        dist[i] = Math.hypot(x - cx, y - cy);
        r1[i] = rnd(gx, gy);
        r2[i] = rnd(gx + 7919, gy + 104729);
        r3[i] = rnd(gx + 15485863, gy + 32452843);
        const wx = x / w;
        dw[i] = 0.12 + 0.88 * wx * wx;
        let t = (x / w) * 0.55 + (1 - y / h) * 0.45;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const c = ramp(t);
        cr[i] = c[0]; cg[i] = c[1]; cb[i] = c[2];
      }
    }
  }

  // paints a cell, and sometimes its neighbours, so block sizes vary like the ref
  function put(i, r, g, b, a, clump){
    let p = i * 4;
    px[p] = r; px[p+1] = g; px[p+2] = b; px[p+3] = a;
    if (!clump) return;
    const gx = i % cw;
    if (gx + 1 < cw){ p = (i+1)*4; px[p]=r; px[p+1]=g; px[p+2]=b; px[p+3]=a; }
    if (i + cw < cw*ch){
      p = (i+cw)*4; px[p]=r; px[p+1]=g; px[p+2]=b; px[p+3]=a;
      if (gx + 1 < cw){ p = (i+cw+1)*4; px[p]=r; px[p+1]=g; px[p+2]=b; px[p+3]=a; }
    }
  }

  function draw(phase){
    px.fill(0);
    const n = cw * ch;
    const band = core + scatter;
    const starFall = scatter * 1.1;
    for (let i=0; i<n; i++){
      const d = dist[i] - R;
      if (d < -core){
        // solid disk: rim is the brightest point, the body sinks to crimson
        const deep = Math.min(1, (-d - core) / (R * 0.42));
        const k = 1 - deep * 0.52;
        const m = deep * 0.55;
        put(i,
            cr[i]*k*(1-m) + 150*m*k,
            cg[i]*k*(1-m) + 22*m*k,
            cb[i]*k*(1-m) + 68*m*k,
            255, false);
      } else if (d < 0){
        // thin hot rim right on the edge
        const k = 1 + 0.22 * (1 + d / core);
        put(i, Math.min(255, cr[i]*k), Math.min(255, cg[i]*k), Math.min(255, cb[i]*k), 255, false);
      } else if (d < scatter){
        // dissolve band
        const u = (d + core) / band;
        let pr = Math.pow(1 - u, 2.2);
        pr += 0.06 * Math.sin(d * 0.045 - phase + r3[i] * 2.2);
        if (r1[i] < pr){
          const a = 255 - 60 * u;
          put(i, cr[i], cg[i], cb[i], a, r3[i] > 0.88 && pr > 0.25);
        }
      } else {
        // specks thrown clear of the edge
        const out = d - scatter;
        const fade = Math.exp(-out / starFall);
        const pr = ECL_STARS * fade + ECL_DUST * dw[i];
        if (r2[i] < pr){
          const tw = 0.45 + 0.55 * Math.sin(phase * 1.7 + r3[i] * 6.283);
          const warm = fade > 0.25;
          put(i,
              warm ? 255 : 226,
              warm ? 150 : 222,
              warm ? 150 : 226,
              60 + 165 * tw * (0.35 + fade),
              false);
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  let raf = 0, last = 0, phase = 0, visible = true;
  const frame = 1000 / ECL_FPS;

  function loop(t){
    raf = requestAnimationFrame(loop);
    if (t - last < frame) return;
    last = t;
    phase += 0.045;
    draw(phase);
  }

  function start(){ if (!raf && !slow) { last = 0; raf = requestAnimationFrame(loop); } }
  function stop(){ if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  let resizeTimer = 0;
  function onResize(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); draw(phase); }, 150);
  }

  build();
  draw(phase);
  if (slow) return;           // static frame, no loop
  start();

  addEventListener('resize', onResize);

  // don't burn frames once the hero is scrolled past
  const hero = document.getElementById('top');
  if (hero && 'IntersectionObserver' in window){
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      visible ? start() : stop();
    }, {threshold:0}).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : (visible && start());
  });
})();
