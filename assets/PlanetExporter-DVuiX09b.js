import{b as ae,z as te,d as T,s as ne,V as h,j as oe,G as re,n as ce,o as D,t as se,C as le,S as ie,M as H,c as ue}from"./three-DQ4dZCk9.js";import{G as de,O as me}from"./OBJExporter-BKrm3w8v.js";import{zipSync as pe}from"./browser-DGemqFXA.js";import{q as ve,t as fe,w as ge,B as he,D as Se,F as be}from"./ExportValidator-Cxn0i5Hr.js";import{i as ye,P as xe,j as Ae}from"./Engine-Dm-bYkn5.js";import{P as we}from"./PlanetHeightSampler-7EC3YV_Z.js";import{bi as Le}from"./index-DvodJW7n.js";import"./react-DJ1oPbzn.js";const Ce=ve(Le()),W=[{name:"pos_x",o:[1,-1,-1],u:[0,2,0],v:[0,0,2]},{name:"neg_x",o:[-1,-1,1],u:[0,2,0],v:[0,0,-2]},{name:"pos_y",o:[-1,1,-1],u:[0,0,2],v:[2,0,0]},{name:"neg_y",o:[-1,-1,1],u:[0,0,-2],v:[2,0,0]},{name:"pos_z",o:[-1,-1,1],u:[2,0,0],v:[0,2,0]},{name:"neg_z",o:[1,-1,-1],u:[-2,0,0],v:[0,2,0]}],Be=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`,_e=S=>`
  precision highp float;
  ${fe}
  ${xe}
  ${ge}
  ${he}
  ${Ae}
  ${S}
  ${Se}
  ${be}

  uniform vec3 uFaceOrigin, uFaceU, uFaceV;
  uniform float uNormalStrength, uAO;
  uniform bool uBakeLighting;
  varying vec2 vUv;

  void main() {
    vec3 cube = uFaceOrigin + vUv.x * uFaceU + vUv.y * uFaceV;
    vec3 dir = normalize(cube);

    vec3 ref = abs(dir.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    vec3 t1 = normalize(cross(ref, dir));
    vec3 t2 = cross(dir, t1);
    float eps = uPlanetEps;
    vec3 dA = normalize(dir + t1 * eps);
    vec3 dB = normalize(dir + t2 * eps);
    float hC = heightAt3D(dir), hA = heightAt3D(dA), hB = heightAt3D(dB);
    vec3 pC = dir*(uPlanetRadius+hC), pA = dA*(uPlanetRadius+hA), pB = dB*(uPlanetRadius+hB);
    vec3 nGeo = normalize(cross(pA-pC, pB-pC));
    if (dot(nGeo, dir) < 0.0) nGeo = -nGeo;
    float up = clamp(dot(nGeo, dir), 0.0, 1.0);
    vec3 n = normalize(mix(dir, nGeo, uNormalStrength));

    Climate cl = planetClimateAt(dir);
    BiomeWeights bw = biomeWeightsAt(cl);
    float slope = 1.0 - up;
    float hRel = hC - uSeaLevel;
    float h01 = hC / max(uHeightScale, 1e-3);
    // triplanar color-detail (matches PlanetMaterial's live shader so baked
    // textures line up): avoids the sphere xz-projection stretching
    vec3 colP = pC;
    vec3 colBlend = abs(dir);
    colBlend /= max(colBlend.x + colBlend.y + colBlend.z, 1e-4);
    vec3 colSeed = vec3(uSeedOffset, uSeedOffset.x - uSeedOffset.y);
    float jitter = (cl.region-0.5)*0.8 + (vnoiseTri(colP*0.045+colSeed, colBlend)-0.5)*0.6;
    float detail = vnoiseTri(colP*0.35 + colSeed.yzx, colBlend);
    float microN = vnoiseTri(colP*0.9, colBlend);
    TerrainColorResult tc = computeTerrainAlbedo(cl, bw, hC, hRel, h01, slope, detail, jitter, microN);

    vec3 col = tc.albedo;
    if (uBakeLighting) {
      float concave = clamp(((hA+hB)*0.5 - hC) / (uHeightScale*0.02 + 1.0), 0.0, 1.0);
      float valley = 1.0 - smoothstep(0.0, uHeightScale*0.55, hC);
      float ao = 1.0 - uAO*(concave*0.45 + valley*0.22);
      ao = applyRidgeAccent(ao, (hC - (hA+hB)*0.5) / (uHeightScale*0.02 + 1.0));
      float diff = max(dot(n, uSunDir), 0.0);
      vec3 sunCol = uTerrainSunCol * uTerrainSunIntensity;
      vec3 skyAmb = uTerrainSkyAmb * 0.50 * (up*0.5+0.5);
      vec3 bounce = uTerrainBounce * 0.25 * (1.0 - up*0.5);
      col = tc.albedo * (sunCol*diff + skyAmb + bounce) * ao;
    }
    col = pow(col, vec3(1.0/2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;function Oe(S,i,t,n){const o=new Uint8Array(t*n*4);S.readRenderTargetPixels(i,0,0,t,n,o);const c=document.createElement("canvas");c.width=t,c.height=n;const L=c.getContext("2d"),C=L.createImageData(t,n);for(let m=0;m<n;m++){const u=(n-1-m)*t*4;C.data.set(o.subarray(u,u+t*4),m*t*4)}return L.putImageData(C,0,0),c}function Pe(S){return new Promise(i=>{S.toBlob(t=>{const n=new FileReader;n.onload=()=>i(new Uint8Array(n.result)),n.readAsArrayBuffer(t)},"image/png")})}class ze{static async export(i,t,n,o,c,L=Ce,C=null){var M,z;const m=o.format||"glb",u=parseInt(o.meshRes,10)||128,q=o.bakeColor!==!1,B=parseInt(o.texRes,10)||1024,Z=!!o.bakeLighting,J=!!o.exportWater,K=!!o.exportPreset,G=t.planetRadius;t.heightScale;const E=t.seaLevel,X=new we(n,()=>({octaves:Math.round(t.octaves)}),C),U=new ae,Q=new te(-1,1,1,-1,0,1),O=new T(new ne(2,2),null);U.add(O);const y={uFaceOrigin:{value:new h},uFaceU:{value:new h},uFaceV:{value:new h},uBakeLighting:{value:Z}};for(const a in n){const e=n[a].value;y[a]={value:e&&typeof e.clone=="function"?e.clone():e}}const k=new oe({defines:{OCTAVES:Math.round(t.octaves),PLANET_MODE:1},uniforms:y,vertexShader:Be,fragmentShader:_e(ye(L.body3d))});O.material=k;const p=new re;p.name="Planet";const d=u+1,v=new h;for(let a=0;a<W.length;a++){const e=W[a];c(`Building face ${a+1}/6 (${e.name})…`);const l=new h(...e.o),N=new h(...e.u),I=new h(...e.v),_=new Float32Array(d*d*3),R=new Float32Array(d*d*2);let F=0,$=0;for(let r=0;r<d;r++)for(let s=0;s<d;s++){const b=s/u,w=r/u;v.copy(l).addScaledVector(N,b).addScaledVector(I,w).normalize();const g=G+X.heightAt3D(v.x,v.y,v.z);_[F++]=v.x*g,_[F++]=v.y*g,_[F++]=v.z*g,R[$++]=b,R[$++]=w}const j=[];for(let r=0;r<u;r++)for(let s=0;s<u;s++){const b=r*d+s,w=b+1,g=b+d,ee=g+1;j.push(b,w,g,w,ee,g)}const x=new ce;x.setAttribute("position",new D(_,3)),x.setAttribute("uv",new D(R,2)),x.setIndex(j),x.computeVertexNormals();let A=null;if(q){y.uFaceOrigin.value.copy(l),y.uFaceU.value.copy(N),y.uFaceV.value.copy(I);const r=new se(B,B);i.setRenderTarget(r),i.render(U,Q);const s=Oe(i,r,B,B);i.setRenderTarget(null),r.dispose(),A=new le(s),A.colorSpace=ie,A._canvas=s}const Y=new H({name:`Planet_${e.name}`,map:A,roughness:.9,metalness:.03,color:A?16777215:9083498}),V=new T(x,Y);V.name=`Planet_${e.name}`,p.add(V)}if(J&&E>.5){c("Adding ocean shell…");const a=new ue(G+E,128,96),e=new H({name:"Planet_Ocean",color:1200234,roughness:.15,metalness:.6,transparent:!0,opacity:.75}),l=new T(a,e);l.name="Planet_Ocean",p.add(l)}k.dispose(),O.geometry.dispose(),c(`Packaging ${m.toUpperCase()}…`);const f={};let P=null;if(m==="glb")P=await new Promise(a=>{new de().parse(p,e=>a(new Uint8Array(e)),e=>{console.error(e),a(null)},{binary:!0})}),P&&(f["planet.glb"]=P);else{const a=new me().parse(p);f["planet.obj"]=new TextEncoder().encode(a);for(const e of p.children)(z=(M=e.material)==null?void 0:M.map)!=null&&z._canvas&&(f[`textures/${e.name}.png`]=await Pe(e.material.map._canvas))}if(K&&(f["planet_preset.json"]=new TextEncoder().encode(JSON.stringify({app:"terrain-studio",mode:"planet",version:1,params:t},null,2))),p.traverse(a=>{a.isMesh&&(a.geometry.dispose(),a.material.map&&a.material.map.dispose(),a.material.dispose())}),o.extraZipFiles&&Object.assign(f,o.extraZipFiles),Object.keys(f).length>0){c("Compressing planet package (ZIP)…");const a=pe(f),e=URL.createObjectURL(new Blob([a])),l=document.createElement("a");l.href=e,l.download=`planet_export-${t.seed}.zip`,l.click(),setTimeout(()=>URL.revokeObjectURL(e),5e3)}c("행성 내보내기 완료!")}}export{ze as PlanetExporter};
