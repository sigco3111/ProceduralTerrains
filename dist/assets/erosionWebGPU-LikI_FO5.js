function ue(n){let s=n>>>0;return function(){s|=0,s=s+1831565813|0;let c=Math.imul(s^s>>>15,1|s);return c=c+Math.imul(c^c>>>7,61|c)^c,((c^c>>>14)>>>0)/4294967296}}function he(n,s,c){const h=[],d=[];let r=0;for(let t=-c;t<=c;t++)for(let y=-c;y<=c;y++){const o=y*y+t*t;if(o>=c*c)continue;const m=1-Math.sqrt(o)/c;h.push([y,t]),d.push(m),r+=m}for(let t=0;t<d.length;t++)d[t]/=r||1;return{offsets:h,weights:d,width:n,height:s}}function me({width:n,height:s,base:c,map:h,flow:d,erosionMask:r,depositionMask:t,params:y}){const o={...ee,...y},m=n*s;if(o.smoothing>0){const e=Float32Array.from(h);for(let g=1;g<s-1;g++)for(let p=1;p<n-1;p++){const u=g*n+p,C=(e[u]+e[u-1]+e[u+1]+e[u-n]+e[u+n])/5;h[u]=e[u]+(C-e[u])*o.smoothing}}const M=Math.max(0,Math.min(1,o.strength)),f=new Float32Array(m),v=new Float32Array(m),H=new Float32Array(m);let l=1e-6,x=1e-6,b=1e-6,P=1e-6;for(let e=0;e<m;e++)f[e]=c[e]+(h[e]-c[e])*M,v[e]=t[e],d[e]>l&&(l=d[e]),r[e]>x&&(x=r[e]),t[e]>b&&(b=t[e]);for(let e=0;e<s;e++)for(let g=0;g<n;g++){const p=e*n+g,u=g>0?f[p-1]:f[p],C=g<n-1?f[p+1]:f[p],W=e>0?f[p-n]:f[p],D=e<s-1?f[p+n]:f[p],a=Math.hypot(C-u,D-W);H[p]=a,a>P&&(P=a)}for(let e=0;e<m;e++)d[e]/=l,r[e]/=x,t[e]/=b,H[e]/=P;let E=1e-6;for(let e=0;e<m;e++)v[e]>E&&(E=v[e]);for(let e=0;e<m;e++)v[e]/=E;return{eroded:f,flow:d,erosionMask:r,depositionMask:t,sedimentMap:v,slopeMap:H}}const ee={seed:1,strength:1,droplets:6e4,maxLifetime:30,inertia:.05,sedimentCapacity:4,minSlope:.01,depositionRate:.3,erosionRate:.3,erosionRadius:3,evaporation:.02,gravity:4,initialSpeed:1,initialWater:1,thermalIterations:30,thermalStrength:.4,talus:.6,smoothing:.1},L=65536,ge=256,te=64;function ye(){return typeof navigator<"u"&&!!navigator.gpu}let R=null;function be(){return R||(R=(async()=>{const n=await navigator.gpu.requestAdapter();if(!n)throw new Error("WebGPU 어댑터 없음");const s=await n.requestDevice();return s.lost.then(()=>{R=null}),s})(),R.catch(()=>{R=null})),R}const ve=`
struct SimParams {
  width : u32,
  height : u32,
  brushCount : u32,
  batchStart : u32,
  batchCount : u32,
  maxLifetime : u32,
  pad0 : u32,
  pad1 : u32,
  inertia : f32,
  sedimentCapacity : f32,
  minSlope : f32,
  depositionRate : f32,
  erosionRate : f32,
  evaporation : f32,
  gravity : f32,
  initialSpeed : f32,
  initialWater : f32,
  talus : f32,
  thermalStrength : f32,
  pad2 : f32,
}

const HEIGHT_SCALE : f32 = 65536.0;
const FLOW_SCALE : f32 = 256.0;

@group(0) @binding(0) var<uniform> P : SimParams;
// droplet pass
@group(0) @binding(1) var<storage, read> snapshot : array<i32>;
@group(0) @binding(2) var<storage, read_write> liveMap : array<atomic<i32>>;
@group(0) @binding(3) var<storage, read_write> flowAcc : array<atomic<i32>>;
@group(0) @binding(4) var<storage, read_write> eroAcc : array<atomic<i32>>;
@group(0) @binding(5) var<storage, read_write> depAcc : array<atomic<i32>>;
@group(0) @binding(6) var<storage, read> brush : array<vec4f>;   // (dx, dy, weight, 0)
@group(0) @binding(7) var<storage, read> starts : array<vec2f>;
// thermal pass (same buffers, non-conflicting bindings per entry point)
@group(0) @binding(8) var<storage, read> mapRO : array<i32>;
@group(0) @binding(9) var<storage, read_write> deltaAcc : array<atomic<i32>>;
@group(0) @binding(10) var<storage, read_write> mapRW : array<i32>;
@group(0) @binding(11) var<storage, read_write> deltaRW : array<i32>;

fn snapH(i : u32) -> f32 { return f32(snapshot[i]) / HEIGHT_SCALE; }

// bilinear height + gradient of the snapshot surface → (value, gx, gy)
fn heightGrad(pos : vec2f) -> vec3f {
  let cx = u32(pos.x);
  let cy = u32(pos.y);
  let fx = pos.x - f32(cx);
  let fy = pos.y - f32(cy);
  let nw = cy * P.width + cx;
  let hNW = snapH(nw);
  let hNE = snapH(nw + 1u);
  let hSW = snapH(nw + P.width);
  let hSE = snapH(nw + P.width + 1u);
  let gx = (hNE - hNW) * (1.0 - fy) + (hSE - hSW) * fy;
  let gy = (hSW - hNW) * (1.0 - fx) + (hSE - hNE) * fx;
  let v = hNW * (1.0 - fx) * (1.0 - fy) + hNE * fx * (1.0 - fy)
        + hSW * (1.0 - fx) * fy + hSE * fx * fy;
  return vec3f(v, gx, gy);
}

fn addHeight(i : u32, v : f32) {
  atomicAdd(&liveMap[i], i32(round(v * HEIGHT_SCALE)));
}

@compute @workgroup_size(${te})
fn droplets(@builtin(global_invocation_id) gid : vec3u) {
  if (gid.x >= P.batchCount) { return; }
  let W = P.width;
  let H = P.height;
  var pos = starts[P.batchStart + gid.x];
  var dir = vec2f(0.0, 0.0);
  var speed = P.initialSpeed;
  var water = P.initialWater;
  var sediment = 0.0;

  for (var life = 0u; life < P.maxLifetime; life++) {
    let nodeX = i32(pos.x);
    let nodeY = i32(pos.y);
    let cellIdx = u32(nodeY) * W + u32(nodeX);
    let offX = pos.x - f32(nodeX);
    let offY = pos.y - f32(nodeY);
    let hg = heightGrad(pos);

    // update direction with inertia, then move one cell
    dir = dir * P.inertia - hg.yz * (1.0 - P.inertia);
    let len = length(dir);
    if (len != 0.0) { dir = dir / len; }
    pos += dir;

    atomicAdd(&flowAcc[cellIdx], i32(round(water * FLOW_SCALE)));

    // died: flowed off the map or stopped moving
    if ((dir.x == 0.0 && dir.y == 0.0) ||
        pos.x < 0.0 || pos.x >= f32(W - 1u) ||
        pos.y < 0.0 || pos.y >= f32(H - 1u)) { break; }

    let newHeight = heightGrad(pos).x;
    let deltaHeight = newHeight - hg.x;
    let capacity = max(-deltaHeight, P.minSlope) * speed * water * P.sedimentCapacity;

    if (sediment > capacity || deltaHeight > 0.0) {
      var deposit : f32;
      if (deltaHeight > 0.0) { deposit = min(deltaHeight, sediment); }
      else { deposit = (sediment - capacity) * P.depositionRate; }
      sediment -= deposit;
      addHeight(cellIdx, deposit * (1.0 - offX) * (1.0 - offY));
      addHeight(cellIdx + 1u, deposit * offX * (1.0 - offY));
      addHeight(cellIdx + W, deposit * (1.0 - offX) * offY);
      addHeight(cellIdx + W + 1u, deposit * offX * offY);
      atomicAdd(&depAcc[cellIdx], i32(round(deposit * HEIGHT_SCALE)));
    } else {
      let erodeAmt = min((capacity - sediment) * P.erosionRate, -deltaHeight);
      for (var b = 0u; b < P.brushCount; b++) {
        let bo = brush[b];
        let ex = nodeX + i32(bo.x);
        let ey = nodeY + i32(bo.y);
        if (ex < 0 || ex >= i32(W) || ey < 0 || ey >= i32(H)) { continue; }
        let ei = u32(ey) * W + u32(ex);
        let w = erodeAmt * bo.z;
        // don't punch holes — clamp against the batch snapshot. All writes
        // stay commutative atomicAdds, so a batch is bit-deterministic
        // regardless of scheduling; the floorClamp pass between batches
        // catches within-batch over-removal at bedrock.
        let removed = min(snapH(ei), w);
        let q = i32(round(removed * HEIGHT_SCALE));
        atomicAdd(&liveMap[ei], -q);
        sediment += removed;
        atomicAdd(&eroAcc[ei], q);
      }
    }

    speed = sqrt(max(0.0, speed * speed - deltaHeight * P.gravity));
    water = water * (1.0 - P.evaporation);
  }
}

@compute @workgroup_size(8, 8)
fn thermalMove(@builtin(global_invocation_id) gid : vec3u) {
  let x = gid.x;
  let y = gid.y;
  if (x < 1u || y < 1u || x >= P.width - 1u || y >= P.height - 1u) { return; }
  let i = y * P.width + x;
  let h = f32(mapRO[i]) / HEIGHT_SCALE;
  var nb = array<u32, 4>(i - 1u, i + 1u, i - P.width, i + P.width);
  var maxDiff = 0.0;
  var slideTo = -1;   // ('target' is reserved in WGSL)
  for (var k = 0u; k < 4u; k++) {
    let diff = h - f32(mapRO[nb[k]]) / HEIGHT_SCALE;
    if (diff > maxDiff) { maxDiff = diff; slideTo = i32(nb[k]); }
  }
  if (slideTo >= 0 && maxDiff > P.talus) {
    let mv = (maxDiff - P.talus) * 0.5 * P.thermalStrength;
    let q = i32(round(mv * HEIGHT_SCALE));
    atomicAdd(&deltaAcc[i], -q);
    atomicAdd(&deltaAcc[u32(slideTo)], q);
  }
}

// Serialized between droplet batches. Two rules that sequential CPU droplets
// get for free but parallel batches need enforced:
//  - bedrock: within-batch over-removal can't push a cell below zero
//  - deposit cap: stacked same-cell deposits can fill toward the pre-batch
//    neighbourhood height but can't spike into a brand-new local peak
@compute @workgroup_size(64)
fn floorClamp(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  let W = P.width;
  if (i >= W * P.height) { return; }
  var h = max(atomicLoad(&liveMap[i]), 0);
  let x = i % W;
  let y = i / W;
  if (x >= 1u && x < W - 1u && y >= 1u && y < P.height - 1u) {
    var cap = snapshot[i];
    cap = max(cap, snapshot[i - 1u]);
    cap = max(cap, snapshot[i + 1u]);
    cap = max(cap, snapshot[i - W]);
    cap = max(cap, snapshot[i + W]);
    h = min(h, cap);   // only ever limits rises: cap >= snapshot[i]
  }
  atomicStore(&liveMap[i], h);
}

@compute @workgroup_size(64)
fn thermalApply(@builtin(global_invocation_id) gid : vec3u) {
  let i = gid.x;
  if (i >= P.width * P.height) { return; }
  mapRW[i] = mapRW[i] + deltaRW[i];
  deltaRW[i] = 0;
}
`;function S(n,s,c){return n.createBuffer({size:Math.max(4,s),usage:c})}async function O(n,s,c,h,d){const r=n.createCommandEncoder();r.copyBufferToBuffer(c,0,h,0,d),s.submit([r.finish()]),await h.mapAsync(GPUMapMode.READ);const t=new Int32Array(h.getMappedRange().slice(0));return h.unmap(),t}async function xe({width:n,height:s,heightmap:c,params:h,onProgress:d}){if(!ye())throw new Error("WebGPU 사용 불가");const r={...ee,...h},t=n*s,y=Math.max(0,Math.round(r.droplets)),o=await be();o.pushErrorScope("validation");const m=ue(r.seed|0||1),M=new Float32Array(Math.max(2,y*2));for(let a=0;a<y;a++)M[a*2]=m()*(n-1),M[a*2+1]=m()*(s-1);const f=he(n,s,Math.max(1,Math.round(r.erosionRadius))),v=new Float32Array(Math.max(4,f.offsets.length*4));for(let a=0;a<f.offsets.length;a++)v[a*4]=f.offsets[a][0],v[a*4+1]=f.offsets[a][1],v[a*4+2]=f.weights[a];const H=new Int32Array(t);for(let a=0;a<t;a++)H[a]=Math.round(c[a]*L);const l=GPUBufferUsage,x=S(o,80,l.UNIFORM|l.COPY_DST),b=S(o,t*4,l.STORAGE|l.COPY_SRC|l.COPY_DST),P=S(o,t*4,l.STORAGE|l.COPY_DST),E=S(o,t*4,l.STORAGE|l.COPY_SRC),e=S(o,t*4,l.STORAGE|l.COPY_SRC),g=S(o,t*4,l.STORAGE|l.COPY_SRC),p=S(o,t*4,l.STORAGE),u=S(o,v.byteLength,l.STORAGE|l.COPY_DST),C=S(o,M.byteLength,l.STORAGE|l.COPY_DST),W=S(o,t*4,l.MAP_READ|l.COPY_DST),D=[x,b,P,E,e,g,p,u,C,W];try{const a=o.queue;a.writeBuffer(b,0,H),a.writeBuffer(u,0,v),a.writeBuffer(C,0,M);const Y=new ArrayBuffer(80),ae=new Uint32Array(Y,0,8),ie=new Float32Array(Y,32,12);ae.set([n,s,f.offsets.length,0,0,Math.max(0,Math.round(r.maxLifetime)),0,0]),ie.set([r.inertia,r.sedimentCapacity,r.minSlope,r.depositionRate,r.erosionRate,r.evaporation,r.gravity,r.initialSpeed,r.initialWater,r.talus,r.thermalStrength,0]),a.writeBuffer(x,0,Y);const oe=o.createShaderModule({code:ve}),B=i=>o.createComputePipeline({layout:"auto",compute:{module:oe,entryPoint:i}}),q=B("droplets"),U=B("thermalMove"),z=B("thermalApply"),N=B("floorClamp"),G=(i,_)=>o.createBindGroup({layout:i.getBindGroupLayout(0),entries:_.map(([A,w])=>({binding:A,resource:{buffer:w}}))}),re=G(q,[[0,x],[1,P],[2,b],[3,E],[4,e],[5,g],[6,u],[7,C]]),ne=G(U,[[0,x],[8,b],[9,p]]),se=G(z,[[0,x],[10,b],[11,p]]),ce=G(N,[[0,x],[1,P],[2,b]]),k=256,F=Math.ceil(y/k);for(let i=0;i<F;i++){const _=i*k,A=Math.min(k,y-_);a.writeBuffer(x,12,new Uint32Array([_,A]));const w=o.createCommandEncoder();w.copyBufferToBuffer(b,0,P,0,t*4);const T=w.beginComputePass();T.setPipeline(q),T.setBindGroup(0,re),T.dispatchWorkgroups(Math.ceil(A/te)),T.end();const I=w.beginComputePass();I.setPipeline(N),I.setBindGroup(0,ce),I.dispatchWorkgroups(Math.ceil(t/64)),I.end(),a.submit([w.finish()]),((i&3)===3||i===F-1)&&(await a.onSubmittedWorkDone(),d==null||d((i+1)/F,"hydraulic"))}const X=Math.max(0,Math.round(r.thermalIterations));if(X>0&&r.thermalStrength>0){const i=o.createCommandEncoder();for(let _=0;_<X;_++){const A=i.beginComputePass();A.setPipeline(U),A.setBindGroup(0,ne),A.dispatchWorkgroups(Math.ceil(n/8),Math.ceil(s/8)),A.end();const w=i.beginComputePass();w.setPipeline(z),w.setBindGroup(0,se),w.dispatchWorkgroups(Math.ceil(t/64)),w.end()}a.submit([i.finish()]),await a.onSubmittedWorkDone(),d==null||d(1,"thermal")}const le=await O(o,a,b,W,t*4),de=await O(o,a,E,W,t*4),fe=await O(o,a,e,W,t*4),pe=await O(o,a,g,W,t*4),$=await o.popErrorScope();if($)throw new Error(`WebGPU 검증: ${$.message}`);const j=new Float32Array(t),J=new Float32Array(t),K=new Float32Array(t),Q=new Float32Array(t);for(let i=0;i<t;i++)j[i]=le[i]/L,J[i]=de[i]/ge,K[i]=fe[i]/L,Q[i]=pe[i]/L;const V=me({width:n,height:s,base:c,map:j,flow:J,erosionMask:K,depositionMask:Q,params:r}),Z=new Float32Array(t);for(let i=0;i<t;i++)Z[i]=V.eroded[i]-c[i];return d==null||d(1,"done"),{delta:Z,...V}}catch(a){throw o.popErrorScope().catch(()=>{}),a}finally{for(const a of D)a.destroy()}}export{xe as erodeWebGPU,ye as isWebGPUErosionSupported};
