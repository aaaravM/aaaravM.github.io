// GLSL for the morphing point cloud. Each vertex knows its position in two
// formations (A → B); the stage scrubs uMix with scroll. Mid-morph the points
// are thrown into curl-ish noise — structure → noise → structure, the same
// arc a diffusion model walks in reverse.

const SIMPLEX_3D = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMix;
uniform float uMorphNoise;
uniform vec4 uLayoutA;   // offsetX, offsetY, scale, -
uniform vec4 uLayoutB;
uniform vec4 uSpinA;     // axis.xyz, speed (rad/s)
uniform vec4 uSpinB;
uniform vec2 uMouse;     // world xy on the z = 0 plane
uniform float uMouseActive;
uniform vec2 uTilt;      // small global tilt from the pointer (radians)
uniform float uViewH;    // drawing-buffer height in px
uniform float uCamDist;
uniform float uParallax; // star drift from scroll
uniform float uSizeScale;
uniform float uFlowSpeed;
uniform float uHi;       // tagged group to light up (aux value), e.g. a stack cluster
uniform float uHiAmt;    // 0..1, eased

attribute vec4 aPosA;
attribute vec4 aPosB;
attribute vec4 aMetaA;
attribute vec4 aMetaB;
attribute vec4 aSeed;

varying float vHeat;
varying float vAlpha;
varying float vBright;

#define PI 3.141592653589793

${SIMPLEX_3D}

vec3 rotateAxis(vec3 p, vec3 k, float a) {
  float c = cos(a), s = sin(a);
  return p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c);
}

mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

// Evaluates one endpoint of the morph. Returns position; writes size/heat/alpha/bright.
vec3 evalPoint(vec4 pos, vec4 meta, vec4 lay, vec4 spin, out float size, out float heat, out float alpha, out float bright, out float still) {
  float mode = meta.w;
  vec3 p = pos.xyz;
  size = pos.w;
  heat = meta.x;
  alpha = 1.0;
  bright = 0.78;
  still = 0.0;
  bool structure = mode < 2.5;

  if (mode < 0.5) {
    // rigid: spins with the formation (aux = spin multiplier, -1 = static;
    // aux >= 10 is a group tag instead, and those points spin at the normal rate)
    bool tagged = meta.z >= 9.5;
    p = rotateAxis(p, spin.xyz, uTime * spin.w * (tagged ? 1.0 : 1.0 + meta.z));
    still = step(meta.z, -0.99);
    if (tagged) {
      float on = (1.0 - step(0.5, abs(meta.z - uHi))) * uHiAmt;
      heat = max(heat, on * 0.95);
      size *= 1.0 + on * 0.55;
      bright *= 1.0 - (uHiAmt - on) * 0.45; // the rest of the space steps back
      bright += on * 0.3;
    }
  } else if (mode < 1.5) {
    // halftone surface: a flat, screen-fixed dot grid (like print); the globe
    // turns underneath it. aux = sphere radius, used to rebuild the normal.
    still = 1.0;
    vec2 q2 = p.xy / max(meta.z, 1e-3);
    vec3 n = vec3(q2, sqrt(max(0.0, 1.0 - dot(q2, q2))));
    vec3 tn = rotateAxis(n, spin.xyz, -uTime * spin.w);
    float light = clamp(dot(n, normalize(vec3(-0.5, 0.62, 0.62))) * 0.9 + 0.18, 0.0, 1.0);
    float land = snoise(tn * 1.55) * 0.65 + snoise(tn * 3.7 + 4.0) * 0.35;
    float lat = abs(tn.y);
    float ice = smoothstep(0.82, 0.95, lat);
    float m = max(smoothstep(-0.02, 0.22, land), ice * 0.7);
    float limb = smoothstep(0.0, 0.35, n.z);
    size *= mix(0.16, 1.0, light) * mix(0.38, 1.0, m) * mix(0.55, 1.0, limb);
    bright = mix(0.38, 1.0, light) * mix(0.7, 1.0, m);
  } else if (mode < 2.5) {
    // wave: vertical undulation, aux = amplitude
    p.y += sin(p.x * 3.1 + uTime * 1.25 + p.z * 2.0) * meta.z
         + sin(p.x * 7.3 - uTime * 0.9) * meta.z * 0.35;
  } else if (mode < 3.5) {
    // star: twinkle + scroll parallax (wrapped so the sky never empties)
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.y * 1.8) + meta.z * 6.2831);
    alpha = tw;
    bright = 0.72;
    float depth = clamp((-p.z - 1.0) / 5.5, 0.0, 1.0);
    p.y = mod(p.y + uParallax * (0.25 + 0.75 * (1.0 - depth)) + 3.4, 6.8) - 3.4;
  } else {
    // hidden: parked in the sky, invisible
    size = 0.0;
    alpha = 0.0;
    float depth = clamp((-p.z - 1.0) / 5.5, 0.0, 1.0);
    p.y = mod(p.y + uParallax * (0.25 + 0.75 * (1.0 - depth)) + 3.4, 6.8) - 3.4;
  }

  if (structure) {
    // signal pulses travelling along authored paths (forward passes, message passing…)
    if (meta.y >= 0.0) {
      float ph = fract(meta.y * 0.9 - uTime * uFlowSpeed);
      float pulse = smoothstep(0.9, 1.0, ph) * (1.0 - smoothstep(0.995, 1.0, ph));
      heat = max(heat, pulse);
      bright += pulse * 0.6;
      size *= 1.0 + pulse * 1.3;
    }
    // global pointer tilt, then layout
    p = rotY(uTilt.x) * rotX(uTilt.y) * p;
    p = p * lay.z + vec3(lay.xy, 0.0);
    size *= mix(1.0, lay.z, 0.6);
  }
  return p;
}

void main() {
  float sA, hA, aA, bA, stA, sB, hB, aB, bB, stB;
  vec3 pA = evalPoint(aPosA, aMetaA, uLayoutA, uSpinA, sA, hA, aA, bA, stA);
  vec3 pB = evalPoint(aPosB, aMetaB, uLayoutB, uSpinB, sB, hB, aB, bB, stB);

  // staggered, eased per-point progress (a dissolve rather than a lerp)
  float delay = aSeed.x * 0.45;
  float t = clamp((uMix - delay) / 0.55, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  vec3 p = mix(pA, pB, t);
  float size = mix(sA, sB, t);
  float heat = mix(hA, hB, t);
  float alpha = mix(aA, aB, t);
  float bright = mix(bA, bB, t);

  // diffusion burst mid-morph + a faint idle breathing on the living (non-diagram) points
  float burst = sin(PI * t) * uMorphNoise;
  float amp = burst * (0.35 + aSeed.y * 0.65) + 0.0028 * (1.0 - mix(stA, stB, t));
  if (amp > 1e-4) {
    vec3 q = p * 1.35 + aSeed.yzw * 3.0;
    vec3 nz = vec3(
      snoise(q + vec3(uTime * 0.12, 0.0, 0.0)),
      snoise(q + vec3(17.1, uTime * 0.12, 3.2)),
      snoise(q + vec3(5.7, 31.4, uTime * 0.12))
    );
    p += nz * amp;
  }
  heat = max(heat, burst * 0.35 * step(0.7, aSeed.z));

  // the cursor is an attention head: it parts the cloud and heats what it touches
  vec2 d = p.xy - uMouse;
  float r2 = dot(d, d);
  float f = exp(-r2 / 0.028) * uMouseActive * step(0.01, size);
  p.xy += normalize(d + vec2(1e-5)) * f * 0.1;
  p.z += f * 0.15;
  heat = max(heat, f * 0.95);
  bright += f * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float persp = uCamDist / max(0.2, -mv.z);
  gl_PointSize = size * uSizeScale * persp * (uViewH / 1000.0);

  // depth cue for 3D formations
  float depthFade = smoothstep(-2.2, 0.6, p.z);
  vHeat = heat;
  vAlpha = alpha * mix(0.35, 1.0, depthFade);
  vBright = bright * mix(0.55, 1.0, depthFade);
}
`;

export const fragmentShader = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uAccent;
uniform vec3 uHot;
uniform float uGlobalAlpha;

varying float vHeat;
varying float vAlpha;
varying float vBright;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float a = 1.0 - smoothstep(0.38, 0.5, r);
  if (a < 0.01) discard;
  vec3 col = uBase * clamp(vBright, 0.0, 1.6);
  col = mix(col, uAccent, smoothstep(0.08, 0.62, vHeat));
  col = mix(col, uHot, smoothstep(0.78, 1.0, vHeat));
  gl_FragColor = vec4(col, a * vAlpha * uGlobalAlpha);
}
`;
