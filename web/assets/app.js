// 简单可视化，无需后端：演示扫描线思想与动画（不绑定 C++ 执行）。

(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  $$("nav button").forEach(b=>b.onclick=()=>{
    const tab=b.dataset.tab; $$(".tab").forEach(s=>s.classList.remove("active"));
    $("#"+tab).classList.add("active");
  });

  // 3D 体积并（用 2D 俯视 + z 扫描演示）
  const rect3d = {
    boxes: [
      {x1:50,y1:60,z1:0,x2:200,y2:180,z2:100,color:"#22c55e"},
      {x1:120,y1:100,z1:50,x2:280,y2:220,z2:180,color:"#f59e0b"},
      {x1:160,y1:40,z1:80,x2:320,y2:160,z2:220,color:"#3b82f6"},
    ],
    z:0,
  };
  (function initRect3D(){
    const c=$('#rect3d-canvas'); const ctx=c.getContext('2d');
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      ctx.fillStyle='#94a3b8'; ctx.fillText('z = '+rect3d.z.toFixed(1), 10, 16);
      rect3d.boxes.forEach(b=>{
        if(rect3d.z>=b.z1 && rect3d.z<=b.z2){
          ctx.fillStyle=b.color+'44'; ctx.fillRect(b.x1,b.y1,b.x2-b.x1,b.y2-b.y1);
          ctx.strokeStyle=b.color; ctx.strokeRect(b.x1,b.y1,b.x2-b.x1,b.y2-b.y1);
        } else {
          ctx.strokeStyle=b.color+'55'; ctx.strokeRect(b.x1,b.y1,b.x2-b.x1,b.y2-b.y1);
        }
      });
    }
    let timer=null;
    $('#rect3d-play').onclick=()=>{
      if(timer){clearInterval(timer); timer=null; return;}
      rect3d.z=0; timer=setInterval(()=>{ rect3d.z+=5; if(rect3d.z>240){clearInterval(timer); timer=null;} draw(); }, 120);
    };
    $('#rect3d-reset').onclick=()=>{ if(timer){clearInterval(timer); timer=null;} rect3d.z=0; draw(); };
    draw();
  })();

  // 线段相交扫描线动画（简化）：
  (function(){
    const c=$('#segint-canvas'); const ctx=c.getContext('2d');
    const segs=[
      {a:{x:60,y:60}, b:{x:540,y:320}},
      {a:{x:60,y:320}, b:{x:540,y:60}},
      {a:{x:120,y:40}, b:{x:200,y:360}},
      {a:{x:300,y:30}, b:{x:380,y:380}},
    ];
    let x=40;
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      ctx.strokeStyle='#64748b'; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke();
      segs.forEach(s=>{ ctx.strokeStyle='#93c5fd'; ctx.beginPath(); ctx.moveTo(s.a.x,s.a.y); ctx.lineTo(s.b.x,s.b.y); ctx.stroke(); });
      // 简单 intersection 渲染（暴力检测）
      ctx.fillStyle='#ef4444';
      for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++){
        const p = intersectPoint(segs[i], segs[j]); if(p) { ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill(); }
      }
    }
    function intersectPoint(s1,s2){
      const a=s1.a,b=s1.b,c=s2.a,d=s2.b;
      const den=(b.x-a.x)*(d.y-c.y)-(b.y-a.y)*(d.x-c.x);
      if(Math.abs(den)<1e-6) return null;
      const t=((c.x-a.x)*(d.y-c.y)-(c.y-a.y)*(d.x-c.x))/den;
      const u=((c.x-a.x)*(b.y-a.y)-(c.y-a.y)*(b.x-a.x))/den;
      if(t<-1e-4||t>1+1e-4||u<-1e-4||u>1+1e-4) return null;
      return {x:a.x+t*(b.x-a.x), y:a.y+t*(b.y-a.y)};
    }
    $('#segint-step').onclick=()=>{ x+=40; if(x>c.width) x=40; draw(); };
    $('#segint-reset').onclick=()=>{ x=40; draw(); };
    draw();
  })();

  // 多边形填充扫描线：
  (function(){
    const c=$('#polyfill-canvas'); const ctx=c.getContext('2d');
    const poly=[{x:80,y:60},{x:520,y:60},{x:420,y:200},{x:520,y:340},{x:80,y:340},{x:180,y:200}];
    let y=70;
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      // polygon
      ctx.strokeStyle='#eab308'; ctx.beginPath(); ctx.moveTo(poly[0].x,poly[0].y); for(let i=1;i<poly.length;i++) ctx.lineTo(poly[i].x,poly[i].y); ctx.closePath(); ctx.stroke();
      // scanline
      ctx.strokeStyle='#a5b4fc'; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke();
      // intersections
      const xs=[]; for(let i=0;i<poly.length;i++){ const a=poly[i], b=poly[(i+1)%poly.length]; if(a.y===b.y) continue; let A=a,B=b; if(A.y>B.y){const t=A;A=B;B=t;} if(!(y>=A.y&&y<B.y)) continue; const t=(y-A.y)/(B.y-A.y); xs.push(A.x+t*(B.x-A.x)); }
      xs.sort((a,b)=>a-b); ctx.fillStyle='#22c55e66'; for(let i=0;i+1<xs.length;i+=2){ ctx.fillRect(xs[i], y-8, xs[i+1]-xs[i], 16); }
    }
    $('#polyfill-step').onclick=()=>{ y+=20; if(y>340) y=70; draw(); };
    $('#polyfill-reset').onclick=()=>{ y=70; draw(); };
    draw();
  })();

  // 最近点对 3D：在 2D 画布投影 + 显示最近 pair
  (function(){
    const c=$('#cp3d-canvas'); const ctx=c.getContext('2d');
    function rand(n){return Math.floor(Math.random()*n)}
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      const pts=[]; for(let i=0;i<60;i++){ pts.push({x:rand(560)+20,y:rand(360)+20,z:rand(200)}); }
      // 暴力找最近对（演示）
      let best=Infinity, p=-1,q=-1; for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){ const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,dz=pts[i].z-pts[j].z; const d=dx*dx+dy*dy+dz*dz; if(d<best){best=d;p=i;q=j;} }
      // 画点
      pts.forEach((p,i)=>{ const r=3+ p.z/80; ctx.fillStyle='#60a5fa'; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill(); });
      // 高亮最近对
      const a=pts[p], b=pts[q]; ctx.strokeStyle='#ef4444'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(a.x,a.y,5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
    }
    $('#cp3d-run').onclick=draw; draw();
  })();

  // 天际线
  (function(){
    const c=$('#skyline-canvas'); const ctx=c.getContext('2d');
    const buildings=[{l:40,r:180,h:80},{l:120,r:300,h:160},{l:260,r:420,h:120},{l:380,r:560,h:200}];
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      ctx.fillStyle='#0ea5e9'; buildings.forEach(b=>{ ctx.globalAlpha=0.2; ctx.fillRect(b.l,c.height-b.h,b.r-b.l,b.h); }); ctx.globalAlpha=1;
      // 轮廓（暴力）
      const xs=[]; buildings.forEach(b=>{ xs.push(b.l,b.r); }); xs.sort((a,b)=>a-b);
      const outline=[]; let prevH=0;
      xs.forEach(x=>{ let h=0; buildings.forEach(b=>{ if(x>=b.l && x<=b.r) h=Math.max(h,b.h);}); if(outline.length===0 || h!==prevH){ outline.push({x,h}); prevH=h;} });
      ctx.strokeStyle='#f8fafc'; ctx.beginPath(); for(let i=0;i<outline.length;i++){ const x=outline[i].x, h=outline[i].h; const y=c.height-h; if(i===0) ctx.moveTo(x,y); else { ctx.lineTo(x,outline[i-1].y||y); ctx.lineTo(x,y); } outline[i].y=y; } ctx.stroke();
    }
    $('#skyline-run').onclick=draw; draw();
  })();
})();
