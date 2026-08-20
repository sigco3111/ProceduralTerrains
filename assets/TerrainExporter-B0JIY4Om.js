import{b as ct,z as ut,d as U,s as Ee,h as Ve,j as pt,G as qe,M as ue,k as mt,C as _e,S as Je,n as ye,o as re,e as ht,t as Pe,Z as Ke,U as dt,m as ft,a5 as gt}from"./three-DQ4dZCk9.js";import{G as Ye,O as xt}from"./OBJExporter-BKrm3w8v.js";import{o as Qe,p as wt}from"./Engine-C28Fcwnr.js";import{zipSync as vt}from"./browser-DGemqFXA.js";import{t as bt,u as _t,w as yt,B as Mt,D as zt,F as kt,o as Ct,q as St}from"./ExportValidator-C4qiKdLu.js";import{bi as Rt}from"./index-BodXcjOD.js";import"./react-DJ1oPbzn.js";function pe({cx:C,cz:u}){return`tiles/tile_${C}_${u}`}function K(C,u){const n=C.replaceAll("\\","/"),y=u==null?void 0:u.replaceAll("\\","/").replace(/\/$/,"");return y&&n.startsWith(`${y}/`)?n.slice(y.length+1):n}function ne(C,u,n={}){var S;const y=((S=n.packagePaths)==null?void 0:S[u])??u;return`${pe(C)}/${K(y,n.packageRoot)}`}function At(C,u={}){return u.heightmapRawPath?`${pe(C)}/${K(u.heightmapRawPath,u.packageRoot)}`:ne(C,"textures/terrain_heightmap.png",u)}function Bt(C,u,n={}){const y=u==="obj"?"obj":"glb";return{version:1,mode:"separate",tiles:C.map(({cx:S,cz:r})=>{var z,D,E,v,I;return{cx:S,cz:r,folder:pe({cx:S,cz:r}),model:n.includeMesh===!1?null:K(((z=n.packagePaths)==null?void 0:z[`terrain.${y}`])??`terrain.${y}`,n.packageRoot),collision:n.exportCollision?"collision.glb":null,water:n.includeMesh!==!1&&!!n.exportWater,maps:{color:n.bakeColor?K(((D=n.packagePaths)==null?void 0:D["textures/terrain_color.png"])??"textures/terrain_color.png",n.packageRoot):null,normal:n.bakeNormal?K(((E=n.packagePaths)==null?void 0:E["textures/terrain_normal.png"])??"textures/terrain_normal.png",n.packageRoot):null,heightmap:n.exportHeightmap?K(n.heightmapRawPath??((v=n.packagePaths)==null?void 0:v["textures/terrain_heightmap.png"])??"textures/terrain_heightmap.png",n.packageRoot):null,splat:n.exportHeightmap&&n.exportSplat?K(((I=n.packagePaths)==null?void 0:I["textures/terrain_splat.png"])??"textures/terrain_splat.png",n.packageRoot):null}}}).sort((S,r)=>S.cz-r.cz||S.cx-r.cx)}}const Tt=St(Rt()),et=`
vec3 applyTerrainGraphColor(vec3 fallback, vec2 xz, float h01, float slope, float detail, float moisture) {
  return fallback;
}
`,$t=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`,Et=(C,u=et)=>`
  precision highp float;

  ${bt}
  ${_t}
  ${yt}
  ${Mt}
  ${C}
  ${zt}
  ${kt}
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
`;function Pt(C,u,n,y){const S=new Uint8Array(n*y*4);C.readRenderTargetPixels(u,0,0,n,y,S);const r=document.createElement("canvas");r.width=n,r.height=y;const z=r.getContext("2d"),D=z.createImageData(n,y);for(let E=0;E<y;E++){const v=(y-1-E)*n*4,I=E*n*4;D.data.set(S.subarray(v,v+n*4),I)}return z.putImageData(D,0,0),r}async function q(C){return new Promise(u=>{C.toBlob(n=>{const y=new FileReader;y.onload=()=>u(new Uint8Array(y.result)),y.readAsArrayBuffer(n)},"image/png")})}class Wt{static async export(u,n,y,S,r,z,D=Tt){var He;const E=r.format||"glb",v=parseInt(r.meshRes,10)||256,I=r.includeMesh!==!1,Ge=!!r.includeSkirts,tt=!!r.includeBase,me=!!r.bakeColor,w=parseInt(r.texRes,10)||1024,at=!!r.bakeLighting,he=!!r.bakeNormal,oe=!!r.exportHeightmap,le=!!r.exportCollision,O=parseInt(r.collisionRes,10)||128,Me=!!r.exportWater,Le=!!r.exportPreset,p=S,Y=Array.isArray(r.tiles)&&r.tiles.length?r.tiles:[{cx:0,cz:0}],W=r.tileAssemblyShape==="circle"?"circle":"square",Ie=W==="circle"?"merged":r.exportTileMode==="separate"?"separate":"merged",de=((Number(r.diskRadiusCells)||0)+.5)*p,Q=(t,e)=>W!=="circle"||Math.hypot(t,e)<=de+1e-6,rt=new Set(Y.map(t=>`${t.cx},${t.cz}`)),fe=(t,e)=>rt.has(`${t},${e}`),Oe=(t,e)=>({x:t*p,z:e*p});let ge=1/0,xe=1/0,we=-1/0,ve=-1/0;for(const t of Y)ge=Math.min(ge,t.cx),xe=Math.min(xe,t.cz),we=Math.max(we,t.cx),ve=Math.max(ve,t.cz);const nt=we-ge+1,ot=ve-xe+1,X=nt*p,Z=ot*p,T={x:(ge+we)*.5*p,z:(xe+ve)*.5*p},Fe=n.heightScale,ee=n.seaLevel;z("Baking shader parameters...");const be=new ct,ze=new ut(-1,1,1,-1,0,1),ke=new U(new Ee(2,2),null);be.add(ke);const j={uBoardSize:{value:S},uBoardSizeXZ:{value:new Ve(S,S)},uCellOffset:{value:new Ve(0,0)},uBakeMode:{value:0},uBakeLighting:{value:at},uEps:{value:Math.max(.35,S/4096)}};for(const t in y){const e=y[t].value;e&&typeof e.clone=="function"?j[t]={value:e.clone()}:j[t]={value:e}}const lt=Math.round(n.octaves),Ne=new pt({defines:{OCTAVES:lt},uniforms:j,vertexShader:$t,fragmentShader:Et(Ct(D.body2d),D.colorBody||et)});ke.material=Ne;const Ce=(t,e,a,m)=>{j.uCellOffset.value.set(t,e),j.uBoardSizeXZ.value.set(a,m)},Ue=(t,e,a,m,g,f)=>{const i=g+1,s=f+1,d=new Pe(i,s,{format:ft,type:dt,minFilter:Ke,magFilter:Ke});Ce(t,e,a,m),j.uBakeMode.value=0,u.setRenderTarget(d),u.render(be,ze);const o=new Uint8Array(i*s*4);return u.readRenderTargetPixels(d,0,0,i,s,o),u.setRenderTarget(null),d.dispose(),{wpx:i,hpx:s,px:o,at:(_,c)=>{const l=(c*i+_)*4;return(o[l]*65536+o[l+1]*256+o[l+2])/16777215*Fe}}},H=(t,e,a,m,g,f)=>{const i=new Pe(f,f);Ce(e,a,m,g),j.uBakeMode.value=t,u.setRenderTarget(i),u.render(be,ze);const s=Pt(u,i,f,f);return u.setRenderTarget(null),i.dispose(),s},De=(t,e,a,m)=>{const g=new Pe(w,w);Ce(t,e,a,m),j.uBakeMode.value=0,u.setRenderTarget(g),u.render(be,ze);const f=new Uint8Array(w*w*4);u.readRenderTargetPixels(g,0,0,w,w,f),u.setRenderTarget(null),g.dispose();const i=document.createElement("canvas");i.width=w,i.height=w;const s=i.getContext("2d"),d=s.createImageData(w,w),o=new Uint8Array(w*w*2),x=new DataView(o.buffer);for(let _=0;_<w;_++){const c=(w-1-_)*w*4,l=_*w*4;for(let h=0;h<w;h++){const R=c+h*4,$=l+h*4,F=(f[R]*65536+f[R+1]*256+f[R+2])/16777215,b=Math.round(F*255);d.data[$]=b,d.data[$+1]=b,d.data[$+2]=b,d.data[$+3]=255,x.setUint16((_*w+h)*2,Math.round(F*65535),!0)}}return s.putImageData(d,0,0),{canvas:i,raw16:o}},te=-Math.max(24,Fe*.08),V=Y.length>1,J=V&&W==="square"&&Ie==="separate",B=new qe;if(B.name=V?"Terrain_Assembly":"Terrain_Board",I){z(V?"Generating tile geometry...":"지형 지오메트리 생성 중...");const t=new ue({name:"Slab_Material",color:2301465,roughness:.9,metalness:.05,side:mt});for(const e of Y){const a=Oe(e.cx,e.cz),{at:m}=Ue(a.x,a.z,p,p,v,v);let g=null,f=null;if(me){const c=H(2,a.x,a.z,p,p,w);g=new _e(c),g.colorSpace=Je}if(he){const c=H(1,a.x,a.z,p,p,w);f=new _e(c)}const i=new ue({name:V?`Terrain_Material_${e.cx}_${e.cz}`:"Terrain_Material",map:g,normalMap:f,roughness:.85,metalness:.05}),s=[],d=[],o=[];for(let c=0;c<=v;c++){const l=a.z+(c/v-.5)*p;for(let h=0;h<=v;h++)s.push(a.x+(h/v-.5)*p,m(h,c),l),d.push(h/v,c/v)}for(let c=0;c<v;c++)for(let l=0;l<v;l++){const h=c*(v+1)+l,R=h+1,$=(c+1)*(v+1)+l,F=$+1,b=s[h*3],P=s[h*3+2],A=s[R*3],G=s[R*3+2],L=s[$*3],N=s[$*3+2],$e=s[F*3],it=s[F*3+2];Q(b,P)&&Q(L,N)&&Q(A,G)&&o.push(h,$,R),Q(A,G)&&Q(L,N)&&Q($e,it)&&o.push(R,$,F)}const x=new ye;x.setAttribute("position",new re(new Float32Array(s),3)),x.setAttribute("uv",new re(new Float32Array(d),2)),x.setIndex(o),x.computeVertexNormals();const _=new U(x,i);if(_.name=V?`Terrain_Tile_${e.cx}_${e.cz}`:"Terrain_Surface",B.add(_),Ge&&W!=="circle"){const c=V&&Ie==="merged"?{bottom:!fe(e.cx,e.cz-1),top:!fe(e.cx,e.cz+1),left:!fe(e.cx-1,e.cz),right:!fe(e.cx+1,e.cz)}:{bottom:!0,top:!0,left:!0,right:!0},l=[],h=[],R=b=>{const P=l.length/3;for(const{i:A,j:G}of b){const L=a.x+(A/v-.5)*p,N=a.z+(G/v-.5)*p;l.push(L,m(A,G),N),l.push(L,te,N)}for(let A=0;A<b.length-1;A++){const G=P+2*A,L=G+1,N=P+2*(A+1),$e=N+1;h.push(G,L,N,N,L,$e)}},$=b=>Array.from({length:v+1},(P,A)=>({i:A,j:b})),F=b=>Array.from({length:v+1},(P,A)=>({i:b,j:A}));if(c.bottom&&R($(0)),c.top&&R($(v)),c.left&&R(F(0)),c.right&&R(F(v)),tt){const b=l.length/3,P=a.x-p/2,A=a.x+p/2,G=a.z-p/2,L=a.z+p/2;l.push(P,te,G,A,te,G,A,te,L,P,te,L),h.push(b,b+1,b+2,b,b+2,b+3)}if(l.length){const b=new ye;b.setAttribute("position",new re(new Float32Array(l),3)),b.setIndex(h),b.computeVertexNormals();const P=new U(b,t);P.name=V?`Tile_Base_${e.cx}_${e.cz}`:"Terrain_Base_Slab",B.add(P)}}}if(Ge&&W==="circle"){const e=Math.max(64,v*2),a=[],m=[];for(let i=0;i<=e;i++){const s=i/e*Math.PI*2,d=Math.cos(s)*de,o=Math.sin(s)*de;a.push(d,ee,o,d,te,o)}for(let i=0;i<e;i++){const s=i*2,d=s+1,o=(i+1)*2,x=o+1;m.push(s,d,o,o,d,x)}const g=new ye;g.setAttribute("position",new re(new Float32Array(a),3)),g.setIndex(m),g.computeVertexNormals();const f=new U(g,t);f.name="Circular_Base_Skirt",B.add(f)}}let Se=null,Re=null;if(oe){z("Baking grayscale heightmap...");const t=De(T.x,T.z,X,Z);Se=t.canvas,Re=t.raw16}let Ae=null;oe&&r.exportSplat&&(z("스플랫 맵 굽는 중..."),Ae=H(3,T.x,T.z,X,Z,w));let se=null,ie=null;if(me&&(se=H(2,T.x,T.z,X,Z,w)),he&&(ie=H(1,T.x,T.z,X,Z,w)),I&&V&&!J){const t=[];if(B.traverse(e=>{e.isMesh&&/^Terrain_Tile_/.test(e.name)&&t.push(e)}),t.length){const e=t.map(o=>{const x=o.geometry.clone(),_=x.getAttribute("position"),c=x.getAttribute("uv");for(let l=0;l<_.count;l++)c.setXY(l,(_.getX(l)-(T.x-X*.5))/X,(_.getZ(l)-(T.z-Z*.5))/Z);return x.deleteAttribute("normal"),x}),a=Qe(e),m=wt(a);a.dispose(),m.computeVertexNormals(),e.forEach(o=>o.dispose());let g=null,f=null;se&&(g=new _e(se),g.colorSpace=Je),ie&&(f=new _e(ie));const i=new ue({name:"Terrain_Material",map:g,normalMap:f,roughness:.85,metalness:.05});t.forEach(o=>{B.remove(o),o.geometry.dispose(),o.material.map&&o.material.map.dispose(),o.material.normalMap&&o.material.normalMap.dispose(),o.material.dispose()});const s=new U(m,i);s.name="Terrain_Surface",B.add(s);const d=[];if(B.traverse(o=>{o.isMesh&&(/^Tile_Base_/.test(o.name)||o.name==="Circular_Base_Skirt")&&d.push(o)}),d.length){const o=[s.geometry.clone(),...d.map(l=>{const h=l.geometry.clone();if(!h.getAttribute("uv")){const R=h.getAttribute("position");h.setAttribute("uv",new re(new Float32Array(R.count*2),2))}return h})],x=Qe(o,!0);o.forEach(l=>l.dispose());const _=[s.material,...d.map(l=>l.material)];B.remove(s),s.geometry.dispose(),d.forEach(l=>{B.remove(l),l.geometry.dispose()});const c=new U(x,_);c.name="Terrain_Surface",B.add(c)}}}if(!J&&Me&&!r.excludeWaterFromExport&&ee>.5){z("수면 평면 추가 중...");const t=W==="circle"?new ht(de,96):new Ee(X,Z);t.rotateX(-Math.PI/2);const e=new ue({name:"Water_Material",color:1007219,roughness:.1,metalness:.8,transparent:!0,opacity:.6}),a=new U(t,e);a.name="물",a.position.set(W==="circle"?0:T.x,ee,W==="circle"?0:T.z),B.add(a)}const We=(t,e,a,m,g="Collision_Mesh")=>{const{at:f}=Ue(t,e,a,m,O,O),i=[],s=[];for(let x=0;x<=O;x++){const _=e+(x/O-.5)*m;for(let c=0;c<=O;c++){const l=t+(c/O-.5)*a;i.push(l,f(c,x),_)}}for(let x=0;x<O;x++)for(let _=0;_<O;_++){const c=x*(O+1)+_,l=c+1,h=(x+1)*(O+1)+_,R=h+1;s.push(c,h,l,l,h,R)}const d=new ye;d.setAttribute("position",new re(new Float32Array(i),3)),d.setIndex(s),d.computeVertexNormals();const o=new U(d,new gt({name:"Collision_Material",wireframe:!0,visible:!1}));return o.name=g,o};let ae=null;le&&!J&&(z("충돌 지오메트리 생성 중..."),ae=We(T.x,T.z,X,Z));const ce=[];if(J){z("개별 타일 패키지 준비 중...");for(const t of Y){const e=Oe(t.cx,t.cz),a=new qe;a.name=`Terrain_Tile_${t.cx}_${t.cz}`;const m=B.getObjectByName(`Terrain_Tile_${t.cx}_${t.cz}`),g=B.getObjectByName(`Tile_Base_${t.cx}_${t.cz}`);m&&a.add(m.clone()),g&&a.add(g.clone());let f=null;if(Me&&!r.excludeWaterFromExport&&ee>.5){const s=new Ee(p,p);s.rotateX(-Math.PI/2),f=new U(s,new ue({name:"Water_Material",color:1007219,roughness:.1,metalness:.8,transparent:!0,opacity:.6})),f.name="물",f.position.set(e.x,ee,e.z),a.add(f)}const i=oe?De(e.x,e.z,p,p):null;ce.push({cell:t,group:a,water:f,colorCanvas:me?H(2,e.x,e.z,p,p,w):null,normalCanvas:he?H(1,e.x,e.z,p,p,w):null,heightCanvas:(i==null?void 0:i.canvas)??null,heightRaw16:(i==null?void 0:i.raw16)??null,splatCanvas:oe&&r.exportSplat?H(3,e.x,e.z,p,p,w):null,collisionModel:le?We(e.x,e.z,p,p,`Collision_Tile_${t.cx}_${t.cz}`):null})}}Ne.dispose(),ke.geometry.dispose();const M={},k=t=>{var a;const e=r.packageRoot;return!e||t===e||t.startsWith(`${e}/`)?t:((a=r.packagePaths)==null?void 0:a[t])??`${e}/${t}`};if(Le){const t={app:"terrain-studio",version:1,exportedAt:new Date().toISOString(),params:n};M[k("terrain_preset.json")]=new TextEncoder().encode(JSON.stringify(t,null,2))}se&&(M[k("textures/terrain_color.png")]=await q(se)),ie&&(M[k("textures/terrain_normal.png")]=await q(ie)),Se&&(r.heightmapRawPath&&Re?M[k(r.heightmapRawPath)]=Re:M[k("textures/terrain_heightmap.png")]=await q(Se)),Ae&&(M[k("textures/terrain_splat.png")]=await q(Ae));let Be=null,Te=null;const Xe=t=>new Promise(e=>{E==="glb"?new Ye().parse(t,a=>e(new Uint8Array(a)),a=>{console.error(a),e(null)},{binary:!0,animations:[]}):e(new TextEncoder().encode(new xt().parse(t)))}),Ze=t=>new Promise(e=>{new Ye().parse(t,a=>e(new Uint8Array(a)),a=>{console.error(a),e(null)},{binary:!0,animations:[]})});if(I&&J)for(const t of ce)z(`Packaging tile ${t.cell.cx}, ${t.cell.cz}...`),t.model=await Xe(t.group);else I&&(z(`Packaging primary ${E.toUpperCase()}...`),Be=await Xe(B));if(J&&le)for(const t of ce)t.collisionModel&&(t.collision=await Ze(t.collisionModel));else le&&ae&&(z("충돌 메시 패키징 중..."),Te=await Ze(ae));B.traverse(t=>{t.isMesh&&(t.geometry.dispose(),(Array.isArray(t.material)?t.material:[t.material]).forEach(a=>{a.map&&a.map.dispose(),a.normalMap&&a.normalMap.dispose(),a.dispose()}))}),ae&&(ae.geometry.dispose(),ae.material.dispose());for(const t of ce)t.water&&(t.water.geometry.dispose(),t.water.material.dispose()),t.collisionModel&&(t.collisionModel.geometry.dispose(),t.collisionModel.material.dispose());function st(t,e){const a=URL.createObjectURL(t),m=document.createElement("a");m.href=a,m.download=e,m.click(),setTimeout(()=>URL.revokeObjectURL(a),5e3)}const je=E==="glb"?"glb":"obj";if(Be&&(M[k(`terrain.${je}`)]=Be),Te&&(M[k("collision.glb")]=Te),J){const t=Bt(Y,E,{includeMesh:I,packageRoot:r.packageRoot,packagePaths:r.packagePaths,heightmapRawPath:r.heightmapRawPath,exportCollision:le,exportWater:Me&&!r.excludeWaterFromExport&&ee>.5,bakeColor:me,bakeNormal:he,exportHeightmap:oe,exportSplat:r.exportSplat});M[k("tiles.json")]=new TextEncoder().encode(JSON.stringify(t,null,2));for(const e of ce){if(e.model&&(M[k(ne(e.cell,`terrain.${je}`,r))]=e.model),e.collision&&(M[k(ne(e.cell,"collision.glb",r))]=e.collision),e.colorCanvas&&(M[k(ne(e.cell,"textures/terrain_color.png",r))]=await q(e.colorCanvas)),e.normalCanvas&&(M[k(ne(e.cell,"textures/terrain_normal.png",r))]=await q(e.normalCanvas)),e.heightCanvas){const m=At(e.cell,r);M[k(m)]=r.heightmapRawPath&&e.heightRaw16?e.heightRaw16:await q(e.heightCanvas)}e.splatCanvas&&(M[k(ne(e.cell,"textures/terrain_splat.png",r))]=await q(e.splatCanvas));const a=(He=r.tileWaterMaskFiles)==null?void 0:He[`${e.cell.cx},${e.cell.cz}`];if(a)for(const[m,g]of Object.entries(a))M[k(`${pe(e.cell)}/${m}`)]=g;Le&&(M[k(`${pe(e.cell)}/terrain_preset.json`)]=new TextEncoder().encode(JSON.stringify({app:"terrain-studio",version:1,exportedAt:new Date().toISOString(),params:n,tile:e.cell},null,2)))}}if(r.extraZipFiles)for(const[t,e]of Object.entries(r.extraZipFiles))M[k(t)]=e;if(Object.keys(M).length>0){z("내보내기 패키지 압축 중 (ZIP)...");const t=vt(M);st(new Blob([t]),`${r.exportPresetId&&r.exportPresetId!=="custom"?`${r.exportPresetId}_`:""}terrain_export-${n.seed}.zip`)}z("내보내기 완료!")}}export{Wt as TerrainExporter,Et as buildTerrainBakeFragment};
