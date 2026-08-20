import{b as ct,z as ut,d as U,s as Ee,h as Ve,j as pt,G as qe,M as ue,k as mt,C as _e,S as Je,n as Me,o as re,e as dt,t as Ge,Z as Ke,U as ht,m as ft,a5 as gt}from"./three-DQ4dZCk9.js";import{G as Ye,O as xt}from"./OBJExporter-BKrm3w8v.js";import{o as Qe,p as wt}from"./Engine-DqKlD0Ww.js";import{zipSync as vt}from"./browser-DGemqFXA.js";import{t as bt,u as _t,w as Mt,B as yt,D as zt,F as Ct,o as St,q as kt}from"./ExportValidator-zPk92P0X.js";import{bi as Rt}from"./index-CZPkIRf6.js";import"./react-DJ1oPbzn.js";function pe({cx:S,cz:u}){return`tiles/tile_${S}_${u}`}function K(S,u){const o=S.replaceAll("\\","/"),M=u==null?void 0:u.replaceAll("\\","/").replace(/\/$/,"");return M&&o.startsWith(`${M}/`)?o.slice(M.length+1):o}function oe(S,u,o={}){var k;const M=((k=o.packagePaths)==null?void 0:k[u])??u;return`${pe(S)}/${K(M,o.packageRoot)}`}function At(S,u={}){return u.heightmapRawPath?`${pe(S)}/${K(u.heightmapRawPath,u.packageRoot)}`:oe(S,"textures/terrain_heightmap.png",u)}function Tt(S,u,o={}){const M=u==="obj"?"obj":"glb";return{version:1,mode:"separate",tiles:S.map(({cx:k,cz:r})=>{var z,D,E,v,I;return{cx:k,cz:r,folder:pe({cx:k,cz:r}),model:o.includeMesh===!1?null:K(((z=o.packagePaths)==null?void 0:z[`terrain.${M}`])??`terrain.${M}`,o.packageRoot),collision:o.exportCollision?"collision.glb":null,water:o.includeMesh!==!1&&!!o.exportWater,maps:{color:o.bakeColor?K(((D=o.packagePaths)==null?void 0:D["textures/terrain_color.png"])??"textures/terrain_color.png",o.packageRoot):null,normal:o.bakeNormal?K(((E=o.packagePaths)==null?void 0:E["textures/terrain_normal.png"])??"textures/terrain_normal.png",o.packageRoot):null,heightmap:o.exportHeightmap?K(o.heightmapRawPath??((v=o.packagePaths)==null?void 0:v["textures/terrain_heightmap.png"])??"textures/terrain_heightmap.png",o.packageRoot):null,splat:o.exportHeightmap&&o.exportSplat?K(((I=o.packagePaths)==null?void 0:I["textures/terrain_splat.png"])??"textures/terrain_splat.png",o.packageRoot):null}}}).sort((k,r)=>k.cz-r.cz||k.cx-r.cx)}}const Bt=kt(Rt()),et=`
vec3 applyTerrainGraphColor(vec3 fallback, vec2 xz, float h01, float slope, float detail, float moisture) {
  return fallback;
}
`,$t=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`,Et=(S,u=et)=>`
  precision highp float;

  ${bt}
  ${_t}
  ${Mt}
  ${yt}
  ${S}
  ${zt}
  ${Ct}
  ${u}

  uniform float uAO;
  uniform float uNormalStrength;
  uniform float uEps;
  uniform float uBoardSize;
  uniform vec2 uBoardSizeXZ;    // baked region size (per-axis; == uBoardSize,uBoardSize for one cell)
  uniform vec2 uCellOffset;     // world XZ of the baked region center
  uniform int uBakeMode;       // 0 = heightmap, 1 = normalmap, 2 = color, 3 = biome splat
  uniform bool uBakeLighting;

  varying vec2 vUv;

  // Stable 24-bit float packing into RGB
  vec4 packDepth(float v) {
    float value = clamp(v, 0.0, 1.0) * 16777215.0;
    float r = floor(value / 65536.0);
    value -= r * 65536.0;
    float g = floor(value / 256.0);
    value -= g * 256.0;
    float b = floor(value);
    return vec4(r / 255.0, g / 255.0, b / 255.0, 1.0);
  }

  void main() {
    // Map UV back to world coordinates for the baked region (one cell, or the
    // whole assembly for the union-wide auxiliary maps).
    vec2 xz = uCellOffset + (vUv - 0.5) * uBoardSizeXZ;

    Climate cl = climateAt(xz * uFrequency + uSeedOffset);
    BiomeWeights bw = biomeWeightsAt(cl);

    float eps = uEps;
    // Export the final authoring stack, including paint, erosion and baked
    // spline offsets, rather than only the procedural source field.
    float hC = heightAt(xz);
    float hX = heightAt(xz + vec2(eps, 0.0));
    float hZ = heightAt(xz + vec2(0.0, eps));

    if (uBakeMode == 0) {
      float h01 = clamp(hC / max(uHeightScale, 1e-3), 0.0, 1.0);
      gl_FragColor = packDepth(h01);
      return;
    }

    vec3 nGeo = normalize(vec3(-(hX - hC) / eps, 1.0, -(hZ - hC) / eps));
    vec3 n = normalize(vec3(nGeo.x * uNormalStrength, 1.0, nGeo.z * uNormalStrength));

    if (uBakeMode == 1) {
      // Tangent space normal map (R: x, G: z, B: y)
      vec3 tangentNormal = vec3(n.x, n.z, n.y);
      gl_FragColor = vec4(tangentNormal * 0.5 + 0.5, 1.0);
      return;
    }

    float slope = 1.0 - nGeo.y;
    float hRel = hC - uSeaLevel;
    float h01 = hC / max(uHeightScale, 1e-3);
    float jitter = (cl.region - 0.5) * 0.8 + (vnoise(xz * 0.045 + uSeedOffset) - 0.5) * 0.6;
    float detail = vnoise(xz * 0.35 + uSeedOffset.yx);

    TerrainColorResult tc = computeTerrainAlbedo(cl, bw, hC, hRel, h01, slope, detail, jitter, vnoise(xz * 0.9));
    tc.albedo = applyTerrainGraphColor(tc.albedo, xz, clamp(h01, 0.0, 1.0), slope, detail, cl.moist);
    // Match the live terrain shader: real-world satellite/topographic imagery
    // is the final albedo layer and shares the imported heightmap's geo region.
    tc.albedo = applyImportedImageryAlbedo(tc.albedo, xz);

    if (uBakeMode == 2) {
      if (uBakeLighting) {
        float concave = clamp(((hX + hZ) * 0.5 - hC) / (eps * 0.9), 0.0, 1.0);
        float valley = 1.0 - smoothstep(0.0, uHeightScale * 0.55, hC);
        float ao = 1.0 - uAO * (concave * 0.45 + valley * 0.22);
        ao = applyRidgeAccent(ao, (hC - (hX + hZ) * 0.5) / (eps * 0.9));
        vec3 viewDir = vec3(0.0, 1.0, 0.0);
        vec3 col = terrainLighting(
          tc.albedo, n, uSunDir, ao,
          tc.snow, tc.sandBand, hRel, tc.flatness, bw.wetland,
          viewDir
        );
        col = pow(col, vec3(1.0 / 2.2));
        gl_FragColor = vec4(col, 1.0);
      } else {
        gl_FragColor = vec4(pow(tc.albedo, vec3(1.0 / 2.2)), 1.0);
      }
      return;
    }

    if (uBakeMode == 3) {
      // Biome weights: R=desert, G=canyon, B=wetland, A=mountains
      gl_FragColor = vec4(bw.desert, bw.canyon, bw.wetland, bw.mountains);
      return;
    }
  }
`;function Gt(S,u,o,M){const k=new Uint8Array(o*M*4);S.readRenderTargetPixels(u,0,0,o,M,k);const r=document.createElement("canvas");r.width=o,r.height=M;const z=r.getContext("2d"),D=z.createImageData(o,M);for(let E=0;E<M;E++){const v=(M-1-E)*o*4,I=E*o*4;D.data.set(k.subarray(v,v+o*4),I)}return z.putImageData(D,0,0),r}async function q(S){return new Promise(u=>{S.toBlob(o=>{const M=new FileReader;M.onload=()=>u(new Uint8Array(M.result)),M.readAsArrayBuffer(o)},"image/png")})}class Wt{static async export(u,o,M,k,r,z,D=Bt){var He;const E=r.format||"glb",v=parseInt(r.meshRes,10)||256,I=r.includeMesh!==!1,Le=!!r.includeSkirts,tt=!!r.includeBase,me=!!r.bakeColor,w=parseInt(r.texRes,10)||1024,at=!!r.bakeLighting,de=!!r.bakeNormal,ne=!!r.exportHeightmap,le=!!r.exportCollision,O=parseInt(r.collisionRes,10)||128,ye=!!r.exportWater,Pe=!!r.exportPreset,p=k,Y=Array.isArray(r.tiles)&&r.tiles.length?r.tiles:[{cx:0,cz:0}],W=r.tileAssemblyShape==="circle"?"circle":"square",Ie=W==="circle"?"merged":r.exportTileMode==="separate"?"separate":"merged",he=((Number(r.diskRadiusCells)||0)+.5)*p,Q=(t,e)=>W!=="circle"||Math.hypot(t,e)<=he+1e-6,rt=new Set(Y.map(t=>`${t.cx},${t.cz}`)),fe=(t,e)=>rt.has(`${t},${e}`),Oe=(t,e)=>({x:t*p,z:e*p});let ge=1/0,xe=1/0,we=-1/0,ve=-1/0;for(const t of Y)ge=Math.min(ge,t.cx),xe=Math.min(xe,t.cz),we=Math.max(we,t.cx),ve=Math.max(ve,t.cz);const ot=we-ge+1,nt=ve-xe+1,X=ot*p,Z=nt*p,B={x:(ge+we)*.5*p,z:(xe+ve)*.5*p},Fe=o.heightScale,ee=o.seaLevel;z("셰이더 매개변수 베이크 중...");const be=new ct,ze=new ut(-1,1,1,-1,0,1),Ce=new U(new Ee(2,2),null);be.add(Ce);const j={uBoardSize:{value:k},uBoardSizeXZ:{value:new Ve(k,k)},uCellOffset:{value:new Ve(0,0)},uBakeMode:{value:0},uBakeLighting:{value:at},uEps:{value:Math.max(.35,k/4096)}};for(const t in M){const e=M[t].value;e&&typeof e.clone=="function"?j[t]={value:e.clone()}:j[t]={value:e}}const lt=Math.round(o.octaves),Ne=new pt({defines:{OCTAVES:lt},uniforms:j,vertexShader:$t,fragmentShader:Et(St(D.body2d),D.colorBody||et)});Ce.material=Ne;const Se=(t,e,a,m)=>{j.uCellOffset.value.set(t,e),j.uBoardSizeXZ.value.set(a,m)},Ue=(t,e,a,m,g,f)=>{const i=g+1,s=f+1,h=new Ge(i,s,{format:ft,type:ht,minFilter:Ke,magFilter:Ke});Se(t,e,a,m),j.uBakeMode.value=0,u.setRenderTarget(h),u.render(be,ze);const n=new Uint8Array(i*s*4);return u.readRenderTargetPixels(h,0,0,i,s,n),u.setRenderTarget(null),h.dispose(),{wpx:i,hpx:s,px:n,at:(_,c)=>{const l=(c*i+_)*4;return(n[l]*65536+n[l+1]*256+n[l+2])/16777215*Fe}}},H=(t,e,a,m,g,f)=>{const i=new Ge(f,f);Se(e,a,m,g),j.uBakeMode.value=t,u.setRenderTarget(i),u.render(be,ze);const s=Gt(u,i,f,f);return u.setRenderTarget(null),i.dispose(),s},De=(t,e,a,m)=>{const g=new Ge(w,w);Se(t,e,a,m),j.uBakeMode.value=0,u.setRenderTarget(g),u.render(be,ze);const f=new Uint8Array(w*w*4);u.readRenderTargetPixels(g,0,0,w,w,f),u.setRenderTarget(null),g.dispose();const i=document.createElement("canvas");i.width=w,i.height=w;const s=i.getContext("2d"),h=s.createImageData(w,w),n=new Uint8Array(w*w*2),x=new DataView(n.buffer);for(let _=0;_<w;_++){const c=(w-1-_)*w*4,l=_*w*4;for(let d=0;d<w;d++){const R=c+d*4,$=l+d*4,F=(f[R]*65536+f[R+1]*256+f[R+2])/16777215,b=Math.round(F*255);h.data[$]=b,h.data[$+1]=b,h.data[$+2]=b,h.data[$+3]=255,x.setUint16((_*w+d)*2,Math.round(F*65535),!0)}}return s.putImageData(h,0,0),{canvas:i,raw16:n}},te=-Math.max(24,Fe*.08),V=Y.length>1,J=V&&W==="square"&&Ie==="separate",T=new qe;if(T.name=V?"Terrain_Assembly":"Terrain_Board",I){z(V?"타일 지오메트리 생성 중...":"지형 지오메트리 생성 중...");const t=new ue({name:"Slab_Material",color:2301465,roughness:.9,metalness:.05,side:mt});for(const e of Y){const a=Oe(e.cx,e.cz),{at:m}=Ue(a.x,a.z,p,p,v,v);let g=null,f=null;if(me){const c=H(2,a.x,a.z,p,p,w);g=new _e(c),g.colorSpace=Je}if(de){const c=H(1,a.x,a.z,p,p,w);f=new _e(c)}const i=new ue({name:V?`Terrain_Material_${e.cx}_${e.cz}`:"Terrain_Material",map:g,normalMap:f,roughness:.85,metalness:.05}),s=[],h=[],n=[];for(let c=0;c<=v;c++){const l=a.z+(c/v-.5)*p;for(let d=0;d<=v;d++)s.push(a.x+(d/v-.5)*p,m(d,c),l),h.push(d/v,c/v)}for(let c=0;c<v;c++)for(let l=0;l<v;l++){const d=c*(v+1)+l,R=d+1,$=(c+1)*(v+1)+l,F=$+1,b=s[d*3],G=s[d*3+2],A=s[R*3],L=s[R*3+2],P=s[$*3],N=s[$*3+2],$e=s[F*3],it=s[F*3+2];Q(b,G)&&Q(P,N)&&Q(A,L)&&n.push(d,$,R),Q(A,L)&&Q(P,N)&&Q($e,it)&&n.push(R,$,F)}const x=new Me;x.setAttribute("position",new re(new Float32Array(s),3)),x.setAttribute("uv",new re(new Float32Array(h),2)),x.setIndex(n),x.computeVertexNormals();const _=new U(x,i);if(_.name=V?`Terrain_Tile_${e.cx}_${e.cz}`:"Terrain_Surface",T.add(_),Le&&W!=="circle"){const c=V&&Ie==="merged"?{bottom:!fe(e.cx,e.cz-1),top:!fe(e.cx,e.cz+1),left:!fe(e.cx-1,e.cz),right:!fe(e.cx+1,e.cz)}:{bottom:!0,top:!0,left:!0,right:!0},l=[],d=[],R=b=>{const G=l.length/3;for(const{i:A,j:L}of b){const P=a.x+(A/v-.5)*p,N=a.z+(L/v-.5)*p;l.push(P,m(A,L),N),l.push(P,te,N)}for(let A=0;A<b.length-1;A++){const L=G+2*A,P=L+1,N=G+2*(A+1),$e=N+1;d.push(L,P,N,N,P,$e)}},$=b=>Array.from({length:v+1},(G,A)=>({i:A,j:b})),F=b=>Array.from({length:v+1},(G,A)=>({i:b,j:A}));if(c.bottom&&R($(0)),c.top&&R($(v)),c.left&&R(F(0)),c.right&&R(F(v)),tt){const b=l.length/3,G=a.x-p/2,A=a.x+p/2,L=a.z-p/2,P=a.z+p/2;l.push(G,te,L,A,te,L,A,te,P,G,te,P),d.push(b,b+1,b+2,b,b+2,b+3)}if(l.length){const b=new Me;b.setAttribute("position",new re(new Float32Array(l),3)),b.setIndex(d),b.computeVertexNormals();const G=new U(b,t);G.name=V?`Tile_Base_${e.cx}_${e.cz}`:"Terrain_Base_Slab",T.add(G)}}}if(Le&&W==="circle"){const e=Math.max(64,v*2),a=[],m=[];for(let i=0;i<=e;i++){const s=i/e*Math.PI*2,h=Math.cos(s)*he,n=Math.sin(s)*he;a.push(h,ee,n,h,te,n)}for(let i=0;i<e;i++){const s=i*2,h=s+1,n=(i+1)*2,x=n+1;m.push(s,h,n,n,h,x)}const g=new Me;g.setAttribute("position",new re(new Float32Array(a),3)),g.setIndex(m),g.computeVertexNormals();const f=new U(g,t);f.name="Circular_Base_Skirt",T.add(f)}}let ke=null,Re=null;if(ne){z("그레이스케일 높이맵 베이크 중...");const t=De(B.x,B.z,X,Z);ke=t.canvas,Re=t.raw16}let Ae=null;ne&&r.exportSplat&&(z("스플랫 맵 굽는 중..."),Ae=H(3,B.x,B.z,X,Z,w));let se=null,ie=null;if(me&&(se=H(2,B.x,B.z,X,Z,w)),de&&(ie=H(1,B.x,B.z,X,Z,w)),I&&V&&!J){const t=[];if(T.traverse(e=>{e.isMesh&&/^Terrain_Tile_/.test(e.name)&&t.push(e)}),t.length){const e=t.map(n=>{const x=n.geometry.clone(),_=x.getAttribute("position"),c=x.getAttribute("uv");for(let l=0;l<_.count;l++)c.setXY(l,(_.getX(l)-(B.x-X*.5))/X,(_.getZ(l)-(B.z-Z*.5))/Z);return x.deleteAttribute("normal"),x}),a=Qe(e),m=wt(a);a.dispose(),m.computeVertexNormals(),e.forEach(n=>n.dispose());let g=null,f=null;se&&(g=new _e(se),g.colorSpace=Je),ie&&(f=new _e(ie));const i=new ue({name:"Terrain_Material",map:g,normalMap:f,roughness:.85,metalness:.05});t.forEach(n=>{T.remove(n),n.geometry.dispose(),n.material.map&&n.material.map.dispose(),n.material.normalMap&&n.material.normalMap.dispose(),n.material.dispose()});const s=new U(m,i);s.name="Terrain_Surface",T.add(s);const h=[];if(T.traverse(n=>{n.isMesh&&(/^Tile_Base_/.test(n.name)||n.name==="Circular_Base_Skirt")&&h.push(n)}),h.length){const n=[s.geometry.clone(),...h.map(l=>{const d=l.geometry.clone();if(!d.getAttribute("uv")){const R=d.getAttribute("position");d.setAttribute("uv",new re(new Float32Array(R.count*2),2))}return d})],x=Qe(n,!0);n.forEach(l=>l.dispose());const _=[s.material,...h.map(l=>l.material)];T.remove(s),s.geometry.dispose(),h.forEach(l=>{T.remove(l),l.geometry.dispose()});const c=new U(x,_);c.name="Terrain_Surface",T.add(c)}}}if(!J&&ye&&!r.excludeWaterFromExport&&ee>.5){z("수면 평면 추가 중...");const t=W==="circle"?new dt(he,96):new Ee(X,Z);t.rotateX(-Math.PI/2);const e=new ue({name:"Water_Material",color:1007219,roughness:.1,metalness:.8,transparent:!0,opacity:.6}),a=new U(t,e);a.name="물",a.position.set(W==="circle"?0:B.x,ee,W==="circle"?0:B.z),T.add(a)}const We=(t,e,a,m,g="Collision_Mesh")=>{const{at:f}=Ue(t,e,a,m,O,O),i=[],s=[];for(let x=0;x<=O;x++){const _=e+(x/O-.5)*m;for(let c=0;c<=O;c++){const l=t+(c/O-.5)*a;i.push(l,f(c,x),_)}}for(let x=0;x<O;x++)for(let _=0;_<O;_++){const c=x*(O+1)+_,l=c+1,d=(x+1)*(O+1)+_,R=d+1;s.push(c,d,l,l,d,R)}const h=new Me;h.setAttribute("position",new re(new Float32Array(i),3)),h.setIndex(s),h.computeVertexNormals();const n=new U(h,new gt({name:"Collision_Material",wireframe:!0,visible:!1}));return n.name=g,n};let ae=null;le&&!J&&(z("충돌 지오메트리 생성 중..."),ae=We(B.x,B.z,X,Z));const ce=[];if(J){z("개별 타일 패키지 준비 중...");for(const t of Y){const e=Oe(t.cx,t.cz),a=new qe;a.name=`Terrain_Tile_${t.cx}_${t.cz}`;const m=T.getObjectByName(`Terrain_Tile_${t.cx}_${t.cz}`),g=T.getObjectByName(`Tile_Base_${t.cx}_${t.cz}`);m&&a.add(m.clone()),g&&a.add(g.clone());let f=null;if(ye&&!r.excludeWaterFromExport&&ee>.5){const s=new Ee(p,p);s.rotateX(-Math.PI/2),f=new U(s,new ue({name:"Water_Material",color:1007219,roughness:.1,metalness:.8,transparent:!0,opacity:.6})),f.name="물",f.position.set(e.x,ee,e.z),a.add(f)}const i=ne?De(e.x,e.z,p,p):null;ce.push({cell:t,group:a,water:f,colorCanvas:me?H(2,e.x,e.z,p,p,w):null,normalCanvas:de?H(1,e.x,e.z,p,p,w):null,heightCanvas:(i==null?void 0:i.canvas)??null,heightRaw16:(i==null?void 0:i.raw16)??null,splatCanvas:ne&&r.exportSplat?H(3,e.x,e.z,p,p,w):null,collisionModel:le?We(e.x,e.z,p,p,`Collision_Tile_${t.cx}_${t.cz}`):null})}}Ne.dispose(),Ce.geometry.dispose();const y={},C=t=>{var a;const e=r.packageRoot;return!e||t===e||t.startsWith(`${e}/`)?t:((a=r.packagePaths)==null?void 0:a[t])??`${e}/${t}`};if(Pe){const t={app:"terrain-studio",version:1,exportedAt:new Date().toISOString(),params:o};y[C("terrain_preset.json")]=new TextEncoder().encode(JSON.stringify(t,null,2))}se&&(y[C("textures/terrain_color.png")]=await q(se)),ie&&(y[C("textures/terrain_normal.png")]=await q(ie)),ke&&(r.heightmapRawPath&&Re?y[C(r.heightmapRawPath)]=Re:y[C("textures/terrain_heightmap.png")]=await q(ke)),Ae&&(y[C("textures/terrain_splat.png")]=await q(Ae));let Te=null,Be=null;const Xe=t=>new Promise(e=>{E==="glb"?new Ye().parse(t,a=>e(new Uint8Array(a)),a=>{console.error(a),e(null)},{binary:!0,animations:[]}):e(new TextEncoder().encode(new xt().parse(t)))}),Ze=t=>new Promise(e=>{new Ye().parse(t,a=>e(new Uint8Array(a)),a=>{console.error(a),e(null)},{binary:!0,animations:[]})});if(I&&J)for(const t of ce)z(`타일 ${t.cell.cx}, ${t.cell.cz} 패키징 중...`),t.model=await Xe(t.group);else I&&(z(`기본 ${E.toUpperCase()} 패키징 중...`),Te=await Xe(T));if(J&&le)for(const t of ce)t.collisionModel&&(t.collision=await Ze(t.collisionModel));else le&&ae&&(z("충돌 메시 패키징 중..."),Be=await Ze(ae));T.traverse(t=>{t.isMesh&&(t.geometry.dispose(),(Array.isArray(t.material)?t.material:[t.material]).forEach(a=>{a.map&&a.map.dispose(),a.normalMap&&a.normalMap.dispose(),a.dispose()}))}),ae&&(ae.geometry.dispose(),ae.material.dispose());for(const t of ce)t.water&&(t.water.geometry.dispose(),t.water.material.dispose()),t.collisionModel&&(t.collisionModel.geometry.dispose(),t.collisionModel.material.dispose());function st(t,e){const a=URL.createObjectURL(t),m=document.createElement("a");m.href=a,m.download=e,m.click(),setTimeout(()=>URL.revokeObjectURL(a),5e3)}const je=E==="glb"?"glb":"obj";if(Te&&(y[C(`terrain.${je}`)]=Te),Be&&(y[C("collision.glb")]=Be),J){const t=Tt(Y,E,{includeMesh:I,packageRoot:r.packageRoot,packagePaths:r.packagePaths,heightmapRawPath:r.heightmapRawPath,exportCollision:le,exportWater:ye&&!r.excludeWaterFromExport&&ee>.5,bakeColor:me,bakeNormal:de,exportHeightmap:ne,exportSplat:r.exportSplat});y[C("tiles.json")]=new TextEncoder().encode(JSON.stringify(t,null,2));for(const e of ce){if(e.model&&(y[C(oe(e.cell,`terrain.${je}`,r))]=e.model),e.collision&&(y[C(oe(e.cell,"collision.glb",r))]=e.collision),e.colorCanvas&&(y[C(oe(e.cell,"textures/terrain_color.png",r))]=await q(e.colorCanvas)),e.normalCanvas&&(y[C(oe(e.cell,"textures/terrain_normal.png",r))]=await q(e.normalCanvas)),e.heightCanvas){const m=At(e.cell,r);y[C(m)]=r.heightmapRawPath&&e.heightRaw16?e.heightRaw16:await q(e.heightCanvas)}e.splatCanvas&&(y[C(oe(e.cell,"textures/terrain_splat.png",r))]=await q(e.splatCanvas));const a=(He=r.tileWaterMaskFiles)==null?void 0:He[`${e.cell.cx},${e.cell.cz}`];if(a)for(const[m,g]of Object.entries(a))y[C(`${pe(e.cell)}/${m}`)]=g;Pe&&(y[C(`${pe(e.cell)}/terrain_preset.json`)]=new TextEncoder().encode(JSON.stringify({app:"terrain-studio",version:1,exportedAt:new Date().toISOString(),params:o,tile:e.cell},null,2)))}}if(r.extraZipFiles)for(const[t,e]of Object.entries(r.extraZipFiles))y[C(t)]=e;if(Object.keys(y).length>0){z("내보내기 패키지 압축 중 (ZIP)...");const t=vt(y);st(new Blob([t]),`${r.exportPresetId&&r.exportPresetId!=="custom"?`${r.exportPresetId}_`:""}terrain_export-${o.seed}.zip`)}z("내보내기 완료!")}}export{Wt as TerrainExporter,Et as buildTerrainBakeFragment};
