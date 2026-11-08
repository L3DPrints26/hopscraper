/* Hopscraper art pack: Blender renders (art/art.py, art/worlds.py) drawn by the game in place of its code-drawn shapes.
 *   art/w1/ .. art/w9/   one pack per world: blocks, block tops, the exit, sky and three parallax layers
 *                        (w1 also holds the pieces every world shares: coin, gem, note, spikes, the square's body;
 *                        w9 also holds Monster Woods' zombie, ogre and ghost parts)
 *   art/hz/              the hazards, shared by every world: saw, laser beam + emitter, key, locked door (leaf and
 *                        jamb per tile, lock, rail, strike plate), lava and molten gold, rocket launchers and rockets,
 *                        gas-vent nozzle, gravity-well core
 *   art/fx/              particle sprites for the game's world FX (leaves, petals, wood chips)
 * The game calls ART.* from a few hooks; each returns true when it drew, false to let the game draw its own version.
 * That fallback is per picture: a world with no pack, or a picture that hasn't loaded (or failed to), draws the old
 * code art, so a build without any of this still plays and looks exactly as before. Nothing here changes gameplay.
 * A world's pack is only fetched the first time something of that world is drawn, and the least recently used ones
 * are let go again: nine worlds of 1920x1080 backgrounds decoded at once is a lot to ask of an older iPhone.
 * Shipped next to the game: ios-app/scripts/copy-game.js copies art.js and every folder of PNGs here into www/art/. */
'use strict';
window.ART = (() => {
  const BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || 'art/';
  const ok = i => !!(i && i.complete && i.naturalWidth);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // ---- the pieces every world shares: small, so they load straight away ----
  const FXN = ['leaf0', 'leaf1', 'leaf2', 'leaf3', 'petal', 'chip0', 'chip1'];
  const SHARED = ['coin', 'note', 'hero', 'spikes', 'gem0', 'gem1', 'gem2', 'gem3', 'gem4', 'gem5', 'gem6', 'gem7'];
  const IM = {}; let left = SHARED.length;
  FXN.forEach(n => { const i = new Image(); i.src = BASE + 'fx/' + n + '.png'; IM[n] = i; });   // (FX checks each one is loaded before using it)
  const A = { ready: false, on: true, IM };
  A.loaded = new Promise(res => SHARED.forEach(n => { const i = new Image(); i.onload = i.onerror = () => { if (--left === 0) { A.ready = true; res(); } }; i.src = BASE + 'w1/' + n + '.png'; IM[n] = i; }));

  // ---- per world: what its pack holds and how it is drawn ----
  // blk: the block body (4 variants, one per row), cap: the top that sits on any block open to the sky,
  // edge: the colour of the dark line where a block ends, layers: [picture, parallax speed, lift] back to front.
  const LAYERS = [['bg_far', .045, -175], ['bg_mid', .09, -135], ['bg_near', .18, -70]];
  const MONSTERS = ['z_torso', 'z_head', 'z_limb_l', 'z_limb_d', 'z_boot', 'o_legs', 'o_torso', 'o_head', 'o_club', 'o_fist', 'o_arm_f', 'o_arm_n', 'g_dome', 'g_tail'];
  const BG = ['bg_sky', 'bg_far', 'bg_mid', 'bg_near'];
  const WP = [
    { dir: 'w1', blk: 'stone', cap: 'grass_', edge: '10,16,28' },   // Green Fields (approved; art.py)
    { dir: 'w2', blk: 'blk', cap: 'top_', edge: '26,12,4' },         // Saw Mill
    { dir: 'w3', blk: 'blk', cap: 'top_', edge: '4,8,22' },          // Laser Lab
    { dir: 'w4', blk: 'blk', cap: 'top_', edge: '18,4,10' },         // Magma Core
    { dir: 'w5', blk: 'blk', cap: 'top_', edge: '4,2,14' },          // The Top
    { dir: 'w6', blk: 'blk', cap: 'top_', edge: '6,4,12' },          // Rocket Yard
    { dir: 'w7', blk: 'blk', cap: 'top_', edge: '6,6,10' },          // Low-G Zone
    { dir: 'w8', blk: 'blk', cap: 'top_', edge: '74,44,4' },         // Gilded Vale
    { dir: 'w9', blk: 'blk', cap: 'top_', edge: '8,6,2', extra: MONSTERS },   // Monster Woods (its monsters live in its pack)
  ];
  WP.forEach(w => { w.names = [0, 1, 2, 3].map(v => w.blk + v).concat(['left', 'mid', 'right'].map(k => w.cap + k), ['door'], BG, w.extra || []); });
  const DOOR = [];   // the locked door, one picture per tile of it: dl_ leaf / dj_ jamb, column S/L/R, row S/T/M/B
  ['dl_', 'dj_'].forEach(k => ['S', 'L', 'R'].forEach(c => ['S', 'T', 'M', 'B'].forEach(r => DOOR.push(k + c + r))));
  const HZ = ['saw', 'lz_beam_p', 'lz_beam_c', 'lz_cap', 'key', 'lock', 'strap', 'strike', 'lava_body', 'lava_crest', 'gold_body', 'gold_crest',
    'rk_box_s', 'rk_box_h', 'rk_tube', 'rk_yoke', 'rk_shot', 'rk_seek', 'vent', 'well'].concat(DOOR);

  // ---- lazy packs ----
  // PK[key] = { im, left, done, t }. key is a world folder ('w3') or 'hz'. A pack is asked for on every draw that
  // needs it; the first ask starts the download and every ask until it lands gets null (= draw the code version).
  const PK = {}, MAXW = 3, onDone = [];
  function pack(key, names) {
    let p = PK[key];
    if (!p) {
      p = PK[key] = { im: {}, left: names.length, done: false, t: now(), key };
      names.forEach(n => { const i = new Image(); i.onload = i.onerror = () => { if (--p.left === 0 && PK[key] === p) { p.done = true; onDone.forEach(f => f(key)); } }; i.src = BASE + key + '/' + n + '.png'; p.im[n] = i; });
      trim(key);
    }
    p.t = now();
    return p.done ? p : null;
  }
  // let go of the least recently used world packs (never one drawn in the last few seconds: in a climb two worlds are
  // on screen at once while the sky cross-fades). A pack let go is simply fetched again if it is needed again.
  function trim(keep) {
    const ws = Object.keys(PK).filter(k => k[0] === 'w' && k !== keep && now() - PK[k].t > 4000).sort((a, b) => PK[a].t - PK[b].t);
    const n = Object.keys(PK).filter(k => k[0] === 'w').length;
    for (let i = 0; i < n - MAXW && i < ws.length; i++) delete PK[ws[i]];
  }
  const world = ti => (A.on && WP[ti]) ? pack(WP[ti].dir, WP[ti].names) : null;
  const hz = () => A.on ? pack('hz', HZ) : null;
  A.load = key => new Promise(res => { const k = typeof key === 'number' ? WP[key] && WP[key].dir : key; if (!k) return res(); (k === 'hz' ? hz() : world(WP.findIndex(w => w.dir === k)));
    const chk = () => (!PK[k] || PK[k].done) ? res() : setTimeout(chk, 30); chk(); });
  // Blocks are baked into the level's chunk canvases once, so a world's blocks that were baked as code art before its
  // pack arrived are thrown away here and re-baked with the pictures on the next frame (the lava in them, for 'hz').
  onDone.push(key => {
    try {
      if (typeof G === 'undefined' || !G || !G.L || !G.L.chunks) return;
      const ti = WP.findIndex(w => w.dir === key);
      for (const k of [...G.L.chunks.keys()]) if (key === 'hz' || k.indexOf(ti + ':') === 0) G.L.chunks.delete(k);
    } catch (e) { }
  });
  const inLevel = () => A.on && A.ready && typeof G !== 'undefined' && G && G.L;

  // ---- background: sky, then three layers sliding at different speeds ----
  // Never touches globalAlpha: climb mode cross-fades two skies by running this through a proxy ctx whose alpha it
  // owns (drawBGFade). Each layer is trimmed to the rows that have art in them and drawn bottom-aligned.
  A.bg = (th, cx, cy, t, hy) => {
    const ti = WORLDS.indexOf(th), p = world(ti); if (!p) return false;
    const im = p.im; if (!BG.every(n => ok(im[n]))) return false;
    hz();   // whatever world is up next, its hazards will want drawing too
    // a climb changes world every CLIMB_BAND metres and cross-fades the sky: fetch the next band's world now, so it is
    // in by the time the fade starts instead of popping from code art to the pictures halfway through it
    // (the next world is the game's own rule, themeOf: floor(height / CLIMB_BAND) % 5)
    if (typeof G !== 'undefined' && G && (G.mode === 'endless' || G.mode === 'daily') && typeof CLIMB_BAND !== 'undefined') world((Math.floor(G.height / CLIMB_BAND) + 1) % 5);
    const pcy = hy != null ? hy : cy;
    ctx.drawImage(im.bg_sky, 0, 0, VW, VH);
    // the world's own live sky pieces still go on top of its painted sky
    if (QUAL && th.moonEarth) drawW6Sky(cy);    // Low-G: which planet hangs up there is per level
    if (QUAL && th.deco == 7) drawGoldRays(cx, t);
    (WP[ti].layers || LAYERS).forEach(([n, d, lift]) => {
      const img = im[n], h = img.naturalHeight * VH / 1080;
      let ox = -((cx * d) % VW); if (ox > 0) ox -= VW;
      const oy = lift - Math.max(-60, Math.min(60, pcy * d * .25));   // (the layers sit up behind the level)
      for (let x = ox; x < VW; x += VW) {
        ctx.drawImage(img, x, oy + VH - h, VW, h);
        if (oy < 0) ctx.drawImage(img, 0, img.naturalHeight - 2, img.naturalWidth, 2, x, oy + VH - 1, VW, 1 - oy);   // (its bottom edge carried on down to the floor)
      }
    });
    if (QUAL) bgFx(th.deco, cx, cy, t);   // the world's own sky life (birds, sawdust, embers...) still drifts over it
    return true;
  };

  // ---- solid blocks: a body that runs on seamlessly, the world's top on any block open to the sky, dark edges where it ends ----
  A.solid = (ti, mask, x, y, px, py) => {
    const p = world(ti); if (!p) return false;
    const w = WP[ti], im = p.im, st = im[w.blk + (((y * 7) % 4) + 4) % 4];   // one variant per row: neighbours in a row always match
    if (!ok(st)) return false;
    ctx.drawImage(st, 16, 16, 96, 96, px, py, TS, TS);
    const up = mask & 1, dn = mask & 2, lf = mask & 4, rt = mask & 8;
    ctx.fillStyle = 'rgba(' + w.edge + ',.55)';
    if (!lf) ctx.fillRect(px, py, 1.5, TS);
    if (!rt) ctx.fillRect(px + TS - 1.5, py, 1.5, TS);
    if (!dn) { const g = ctx.createLinearGradient(0, py + TS - 6, 0, py + TS); g.addColorStop(0, 'rgba(' + w.edge + ',0)'); g.addColorStop(1, 'rgba(' + w.edge + ',.55)'); ctx.fillStyle = g; ctx.fillRect(px, py + TS - 6, TS, 6); }
    if (!up) {
      const L = im[w.cap + 'left'], R = im[w.cap + 'right'];
      if (!lf && !rt && ok(L) && ok(R)) { ctx.save(); ctx.beginPath(); ctx.rect(px - 4, py - 4, 16, 32); ctx.clip(); ctx.drawImage(L, px - 4, py - 4, 32, 32); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(px + 12, py - 4, 16, 32); ctx.clip(); ctx.drawImage(R, px - 4, py - 4, 32, 32); ctx.restore(); }
      else { const c = im[w.cap + (!lf ? 'left' : !rt ? 'right' : 'mid')]; if (ok(c)) ctx.drawImage(c, px - 4, py - 4, 32, 32); }
    }
    return true;
  };
  A.spike = (ti, c, px, py) => {
    if (!(A.on && ok(IM.spikes))) return false;
    const r = { '^': 0, '>': Math.PI / 2, 'v': Math.PI, '<': -Math.PI / 2 }[c];
    ctx.save(); ctx.translate(px + 12, py + 12); ctx.rotate(r); ctx.drawImage(IM.spikes, -16, -16, 32, 32); ctx.restore();
    return true;
  };

  // ---- pickups and the exit (coin, gem and note are the same in every world, just like the code versions) ----
  A.coin = (x, y, r, sp) => {
    if (!inLevel() || !ok(IM.coin)) return false;
    const c = Math.cos(sp || 0), w = (c < 0 ? -1 : 1) * Math.max(.36, Math.abs(c)), S = 2 * r / .68;
    ctx.save(); ctx.translate(x, y); ctx.scale(w, 1); ctx.drawImage(IM.coin, -S / 2, -S / 2, S, S); ctx.restore();
    return true;
  };
  A.gem = (x, y, r, col) => {
    if (!inLevel() || col !== '#5ff4ff') return false;
    const S = 2.2 * r / .6, f = Math.floor(gtime * 10) % 8;
    if (!ok(IM['gem' + f])) return false;
    ctx.drawImage(IM['gem' + f], x - S / 2, y - S / 2, S, S);
    return true;
  };
  A.note = (n, t) => {
    if (!inLevel() || !ok(IM.note)) return false;
    const b = Math.sin(t * 2.5) * 3, r = Math.sin(t * 1.7) * .12;
    ctx.save(); ctx.translate(n.x, n.y + b); ctx.globalAlpha = .3; ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(0, 0, 15 + Math.sin(t * 4) * 1.5, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.rotate(r); ctx.drawImage(IM.note, -16, -16, 32, 32); ctx.restore();
    return true;
  };
  A.exit = (L, th, t) => {
    if (!inLevel()) return false;
    const p = world(WORLDS.indexOf(th)); if (!p || !ok(p.im.door)) return false;
    const px = L.exit.x * TS, py = L.exit.y * TS;
    ctx.save(); ctx.shadowColor = th.acc; ctx.shadowBlur = 16 + Math.sin(t * 4) * 4; ctx.drawImage(p.im.door, px - 4, py - 18, 32, 48); ctx.restore();
    return true;
  };

  // ---- hazards ----
  // the saw: called inside drawSaw with the blade's centre already at the origin and its spin already applied
  A.saw = () => {
    const p = hz(); if (!p || !ok(p.im.saw)) return false;
    ctx.drawImage(p.im.saw, -17, -17, 34, 34);
    return true;
  };
  // a FIRING laser tile ('v' or 'h' run; the lone 'p' kind stays code-drawn). Same bar as the code's - near-black rim,
  // saturated body, white core - lit as a tube. The picture is one tile long and the same all the way down, so it is
  // slid along the beam (energy running down it); held still on Low graphics and under Reduce Motion.
  A.beam = (c, o, px, py) => {
    if (o !== 'v' && o !== 'h') return false;
    const p = hz(), im = p && p.im[c === 'l' ? 'lz_beam_p' : 'lz_beam_c']; if (!ok(im)) return false;
    const off = (QUAL && !RM()) ? (gtime * 40) % TS : 0;
    ctx.save();
    if (o === 'h') { ctx.translate(px + TS / 2, py + TS / 2); ctx.rotate(Math.PI / 2); ctx.translate(-TS / 2, -TS / 2); } else ctx.translate(px, py);
    ctx.beginPath(); ctx.rect(0, 0, TS, TS); ctx.clip();
    ctx.drawImage(im, 0, off, TS, TS); if (off > 0) ctx.drawImage(im, 0, off - TS, TS, TS);
    ctx.restore();
    return true;
  };
  // an emitter housing at the end of a run (laserCap's place). The lens is the same 14x3 window the code fills, and it
  // is filled the same way: white while firing, the charge gauge (in the laser's colour) while armed.
  A.lzCap = (cx, cy, cw, ch, horz, on, w, col, fl) => {
    const p = hz(), im = p && p.im.lz_cap; if (!ok(im)) return false;
    const lw = (horz ? cw : ch) - 4, lh = (horz ? ch : cw) - 4;
    ctx.save(); ctx.translate(cx + cw / 2, cy + ch / 2); if (!horz) ctx.rotate(Math.PI / 2);
    ctx.drawImage(im, -12, -6, 24, 12);
    if (on) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-lw / 2, -lh / 2, lw, lh); }
    else if (w > 0) { ctx.globalAlpha = fl; ctx.fillStyle = col; if (horz) ctx.fillRect(-lw / 2, -lh / 2, lw * w, lh); else ctx.fillRect(lw / 2 - lw * w, -lh / 2, lw * w, lh); ctx.globalAlpha = 1; }
    ctx.restore();
    return true;
  };
  // LAVA. The melt is baked into the chunks like the blocks (A.lava); on a pool's top tile it only starts 8 px down,
  // which is exactly where the hurt box starts. The crest (A.lavaTop) is drawn over it every frame and slides along, the
  // code's travelling wave; held still on Low graphics and under Reduce Motion. The Gilded Vale pours molten gold.
  const melt = (th, part) => { const p = hz(), im = p && p.im[(th && th.deco == 7 ? 'gold' : 'lava') + part]; return ok(im) ? im : null; };
  A.lava = (ti, top, px, py) => {
    const im = melt(WORLDS[ti], '_body'); if (!im) return false;
    // the melt repeats every 2 tiles each way, so each tile takes its own quarter of the picture
    const k = im.naturalWidth / (2 * TS), sx = (((px / TS) % 2 + 2) % 2) * TS * k, sy = (((py / TS) % 2 + 2) % 2) * TS * k, d = top ? 8 : 0;
    ctx.drawImage(im, sx, sy + d * k, TS * k, (TS - d) * k, px, py + d, TS, TS - d);
    return true;
  };
  A.lavaTop = (th, px, py, t) => {
    const im = melt(th, '_crest'); if (!im || !melt(th, '_body')) return false;
    const o = (QUAL && !RM()) ? (t * 14) % TS : 0, k = im.naturalWidth / TS;
    if (o > .01) { ctx.drawImage(im, o * k, 0, (TS - o) * k, im.naturalHeight, px, py, TS - o, TS); ctx.drawImage(im, 0, 0, o * k, im.naturalHeight, px + TS - o, py, o, TS); }
    else ctx.drawImage(im, px, py, TS, TS);
    return true;
  };
  // the rising lava (climbs and Endless): the same melt, put together into one 8x8-tile block once so a screenful is a
  // handful of draws, pinned to the world so it doesn't swim when the camera moves; deeper down it darkens, as before
  A.rise = (ly, x0, x1, t) => {
    const p = hz(), body = melt(null, '_body'), crest = melt(null, '_crest'); if (!body || !crest) return false;
    let blk = p.riseBlk;
    if (!blk) { blk = p.riseBlk = document.createElement('canvas'); blk.width = blk.height = 384; const g = blk.getContext('2d'); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.drawImage(body, i * 96, j * 96, 96, 96); }
    const B = 8 * TS, y1 = Math.min(ly + VH + 200, G.cam.y + VH + 30);
    if (y1 > ly) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, ly, x1 - x0, y1 - ly); ctx.clip();
      for (let y = Math.floor(ly / B) * B; y < y1; y += B) for (let x = Math.floor(x0 / B) * B; x < x1; x += B) ctx.drawImage(blk, x, y, B, B);
      const g = ctx.createLinearGradient(0, ly + 30, 0, ly + 220); g.addColorStop(0, 'rgba(90,8,16,0)'); g.addColorStop(1, 'rgba(90,8,16,.62)');
      ctx.fillStyle = g; ctx.fillRect(x0, ly + 30, x1 - x0, y1 - ly - 30); ctx.restore();
    }
    const o = (QUAL && !RM()) ? (t * 14) % TS : 0;
    for (let x = Math.floor(x0 / TS) * TS - o; x < x1; x += TS) ctx.drawImage(crest, x, ly - 8, TS, TS);
    return true;
  };
  // ROCKET YARD. Each piece takes the code version's exact footprint and leaves it every telegraph: the fuse bar in the
  // housing's bottom slot, the muzzle and sensor lenses, the scanner collar and sweep, the flame, the lock hoop.
  const hzImg = n => { const p = hz(), im = p && p.im[n]; return ok(im) ? im : null; };
  A.rkBox = (x, y, hm) => { const im = hzImg(hm ? 'rk_box_h' : 'rk_box_s'); if (!im) return false; ctx.drawImage(im, x - 4, y - 4, 32, 32); return true; };
  // these three are called with the piece's own pivot at the origin and its turn already applied (pointing along +x)
  A.rkTube = () => { const im = hzImg('rk_tube'); if (!im) return false; ctx.drawImage(im, -16, -16, 32, 32); return true; };
  A.rkYoke = () => { const im = hzImg('rk_yoke'); if (!im) return false; ctx.drawImage(im, -16, -16, 32, 32); return true; };
  A.rocket = seek => { const im = hzImg(seek ? 'rk_seek' : 'rk_shot'); if (!im) return false; ctx.drawImage(im, -16, -16, 32, 32); return true; };
  // LOW-G. A vent's nozzle (up = on a floor, blowing up; otherwise hung under a ceiling, blowing down) - the code still
  // blinks its three lights on top. A gravity well's core, called with the well's centre at the origin; its accretion
  // ring turns slowly (still on Low graphics and under Reduce Motion).
  A.vent = (mx, my, up) => {
    const im = hzImg('vent'); if (!im) return false;
    ctx.save(); ctx.translate(mx, up ? my - 3 : my + 3); if (!up) ctx.scale(1, -1); ctx.drawImage(im, -16, -8, 32, 16); ctx.restore();
    return true;
  };
  A.well = t => {
    const im = hzImg('well'); if (!im) return false;
    ctx.save(); if (QUAL && !RM()) ctx.rotate(t * .6); ctx.drawImage(im, -16, -16, 32, 32); ctx.restore();
    return true;
  };
  // MONSTERS (Monster Woods: zombie, ogre, ghost). Cut-out parts the game's own drawZombie / drawOgreStuff / drawGhosts
  // pose: every walk cycle, wind-up, telegraph and face movement is still computed there, these only put a rendered
  // body part where the code's shape was. ART.mon() is null until all of them are in (then the code shapes draw).
  //   part(n, x, y, w, h)          the picture centred on (x, y), w x h (its frame in the code's units)
  //   limb(n, x0, y0, x1, y1, wd)  a rounded limb stretched from one joint to the next, wd thick
  //   tail(x, dp)                  a ghost tail hanging from y=4 at x, as long as the code's waver dp makes it
  let MON = null, MONP = null;
  A.mon = () => {
    const p = world(8); if (!p) return null;
    if (MONP === p) return MON;
    if (!MONSTERS.every(n => ok(p.im[n]))) return null;
    const im = p.im; MONP = p;
    return MON = {
      part: (n, x, y, w, h) => ctx.drawImage(im[n], x - w / 2, y - h / 2, w, h),
      limb: (n, x0, y0, x1, y1, wd) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), sx = (L + wd) / 22, sy = wd / 6;
        ctx.save(); ctx.translate((x0 + x1) / 2, (y0 + y1) / 2); ctx.rotate(Math.atan2(dy, dx)); ctx.drawImage(im[n], -12 * sx, -4 * sy, 24 * sx, 8 * sy); ctx.restore(); },
      tail: (x, dp) => { const sy = Math.max(.25, (dp - 2) * .7 / 11); ctx.save(); ctx.translate(x, 4); ctx.scale(1, sy); ctx.drawImage(im.g_tail, -6, -2, 12, 14); ctx.restore(); },
    };
  };
  // the key (in the level and on the HUD): s is the code's own size, 14 in the level
  A.key = (x, y, s) => {
    const p = hz(), im = p && p.im.key; if (!ok(im)) return false;
    const S = 32 * s / 14; ctx.drawImage(im, x - S / 2, y - S / 2, S, S);
    return true;
  };
  // a LOCKED DOOR tile, v=0 the leaf, v=1 the jamb it leaves standing. Only the picture changes: drawWorld still decides
  // which part shows, swings the leaf and darkens it exactly as before. Each tile is put together once (its cell of the
  // door, plus the lock, its rail and the strike plate where the code puts them) at 4 px per game px, tile + 4 px all
  // round, the same footprint as the code's 32x32 door sprites.
  const DC = {};
  A.door = (dm, v, px, py) => {
    const p = hz(); if (!p) return false;
    const key = v + ':' + dm; let c = DC[key];
    if (c === undefined) {
      c = DC[key] = null;
      const up = dm & 1, dn = dm & 2, lf = dm & 4, rt = dm & 8, lk = dm & 16;
      if (lf && rt) return false;   // (no level has a door three wide: that one stays code-drawn)
      const im = p.im[(v ? 'dj_' : 'dl_') + (lf ? 'R' : rt ? 'L' : 'S') + (up && dn ? 'M' : up ? 'B' : dn ? 'T' : 'S')];
      const need = v ? (lk && !rt ? ['strike'] : []) : (lk ? ['lock'].concat(up || dn ? ['strap'] : []) : []);
      if (!ok(im) || !need.every(n => ok(p.im[n]))) { delete DC[key]; return false; }   // (not yet: ask again next frame)
      c = DC[key] = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.drawImage(im, 16, 16, 96, 96, 16, 16, 96, 96);
      const put = (n, x, y) => g.drawImage(p.im[n], (x + 4 - 16) * 4, (y + 4 - 16) * 4, 128, 128);   // a 32 px sprite centred on (x,y) of the tile
      if (!v && lk && (up || dn)) put('strap', 12 + (rt ? .5 : 0) - (lf ? .5 : 0), 12);
      if (!v && lk) put('lock', 12 + (rt ? 4 : 0), 12);
      if (v && lk && !rt) put('strike', 21.2, 11.5);
    }
    if (!c) return false;
    ctx.drawImage(c, px - 4, py - 4, 32, 32);
    return true;
  };

  // ---- the 3D wordmark (art/logo.py -> art/ui/logo.png + one picture per letter): title screen, main menu, credits ----
  // bottom = where the bottom of the picture sits; w = its width (default 580). still = no wave, no shine (Reduce Motion).
  // A gentle swell rolls through the word, H first: each letter bobs a few px and tips a hair with the slope, like a
  // float on the sea. The letters (art/logo_letters.sh) are logo_N.png (letter + its outline) and logo_Nc.png (the bare
  // letter, same box); LOGO_AT is their boxes in logo.png's frame. All the outlines go down first, then the bare letters,
  // the outer ones first, so no neighbour's outline cuts into a letter and the ones that touch overlap as in the 3D render.
  // logo.png stands in until the letters have loaded (and is the still picture); without either the game draws its own.
  const LOGO = new Image(); LOGO.src = BASE + 'ui/logo.png'; IM.logo = LOGO;
  const LOGO_AT = { w: 1800, h: 447, at: [[71,163,202,213],[249,137,206,227],[420,149,171,208],[583,137,170,208],[731,127,182,208],[907,102,175,226],[1063,108,190,210],[1236,99,178,204],[1379,72,178,224],[1532,79,197,210]] };   // (written by art/logo_letters.sh) each letter's x, y, w, h in logo.png's frame
  const WAVE = { amp: 4.5, tip: .022, speed: 2.2, len: 1750 };   // px up and down (at 580 wide), radians of tip, radians a second, wavelength in logo.png px
  const LET = LOGO_AT.at.map((b, i) => { const o = new Image(), c = new Image(); o.src = BASE + 'ui/logo_' + i + '.png'; c.src = BASE + 'ui/logo_' + i + 'c.png'; return { b, o, c }; });
  const mid = b => Math.abs(b[0] + b[2] / 2 - LOGO_AT.w / 2), BACK = LET.map((_, i) => i).sort((i, j) => mid(LET[j].b) - mid(LET[i].b));
  const okIm = im => im.complete && im.naturalWidth > 0;
  const sized = (im, q) => {   // a letter scaled once to the screen's resolution, halving first so it doesn't shimmer as it moves
    let src = im, w = im.naturalWidth, h = im.naturalHeight; const tw = Math.max(1, Math.round(w * q)), th = Math.max(1, Math.round(h * q));
    for (;;) {
      const last = w / 2 < tw, c = document.createElement('canvas'), g = c.getContext('2d');
      c.width = w = last ? tw : Math.ceil(w / 2); c.height = h = last ? th : Math.ceil(h / 2);
      g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h); src = c; if (last) return c;
    }
  };
  let LS = null, LC = null, LQ = 0;
  A.logo = (t, bottom, w, still) => {
    if (!A.on) return false;
    const lets = LET.every(L => okIm(L.o) && okIm(L.c));
    if (!lets && !okIm(LOGO)) return false;
    const W = w || 580, s = W / LOGO_AT.w, H = LOGO_AT.h * s, x = VW / 2 - W / 2, k = Math.max(1, Math.min(3, ctx.getTransform().a || 1));
    if (!lets || (still && okIm(LOGO))) {   // the whole picture (the letters not in yet, or standing still)
      const H = W * LOGO.naturalHeight / LOGO.naturalWidth, y = bottom - H + (still ? 0 : Math.sin(t * 1.6) * 6);
      if (still) { ctx.drawImage(LOGO, x, y, W, H); return true; }
      const cw = Math.ceil(W * k), ch = Math.ceil(H * k);
      if (!LS || LS.width !== cw || LS.height !== ch) { LS = document.createElement('canvas'); LS.width = cw; LS.height = ch; }
      const g = LS.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cw, ch); g.drawImage(LOGO, 0, 0, cw, ch);
      logoShine(g, t, k, cw, ch); ctx.drawImage(LS, x, y, W, H); return true;
    }
    // the letters, composed at the screen's own resolution so they stay sharp; P = room above and below for the wave
    const q = s * k, A0 = WAVE.amp * W / 580, P = Math.ceil(A0 + 4), cw = Math.ceil(W * k), ch = Math.ceil((H + 2 * P) * k);
    if (!LC || LQ !== q) { LQ = q; LC = LET.map(L => [sized(L.o, q), sized(L.c, q)]); }
    if (!LS || LS.width !== cw || LS.height !== ch) { LS = document.createElement('canvas'); LS.width = cw; LS.height = ch; }
    const g = LS.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cw, ch);
    const put = (i, im) => {
      const b = LET[i].b, ph = still ? 0 : t * WAVE.speed - 2 * Math.PI * (b[0] + b[2] / 2) / WAVE.len;   // the crest reaches the H first
      const dy = still ? 0 : -Math.sin(ph) * A0 * k, r = still ? 0 : WAVE.tip * Math.cos(ph), cs = Math.cos(r), sn = Math.sin(r);   // (tips the way the slope runs)
      g.setTransform(cs, sn, -sn, cs, (b[0] + b[2] / 2) * q, (b[1] + b[3] / 2) * q + P * k + dy);
      g.drawImage(im, -b[2] * q / 2, -b[3] * q / 2, b[2] * q, b[3] * q);
    };
    for (let i = 0; i < LET.length; i++) put(i, LC[i][0]);
    for (const i of BACK) put(i, LC[i][1]);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (!still) logoShine(g, t, k, cw, ch);
    ctx.drawImage(LS, x, bottom - H - P, W, H + 2 * P); return true;
  };
  function logoShine(g, t, k, cw, ch) {   // the shine sweeping across, only over the picture itself
    g.globalCompositeOperation = 'source-atop'; const sx = ((t * 260 * k) % (cw + 240 * k)) - 120 * k;
    const sg = g.createLinearGradient(sx - 50 * k, 0, sx + 50 * k, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.fillRect(0, 0, cw, ch); g.globalCompositeOperation = 'source-over';
  }

  // ---- the square: a rendered body, any skin's color laid over it ----
  const tint = {};
  A.body = (w, h, s, col) => {
    if (!(A.on && A.ready && ok(IM.hero))) return false;
    let c = tint[col];
    if (!c) {
      if (Object.keys(tint).length > 40) for (const k in tint) delete tint[k];
      c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = col; g.fillRect(0, 0, 128, 128);
      g.globalCompositeOperation = 'overlay'; g.drawImage(IM.hero, 0, 0);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(IM.hero, 0, 0);
      tint[col] = c;
    }
    ctx.drawImage(c, -.75 * w, -1.25 * h, 1.5 * w, 1.5 * h);
    return true;
  };
  A.PK = PK; A.WP = WP;
  return A;
})();
