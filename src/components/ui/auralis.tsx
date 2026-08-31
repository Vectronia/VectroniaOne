"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Some mobile GPUs advertise no high precision in fragment shaders; asking for
// it unconditionally fails to compile there.
const fragmentShaderGLSL = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[3];

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv * vec2(ratio, 1.0);
  float t = u_time * 0.2;

  float n1 = snoise(p * 0.5 + t);
  float n2 = snoise(p * 0.9 - t * 0.5 + n1);

  float light = pow(abs(n2), 2.5) * 0.5;

  vec3 col = vec3(0.02, 0.01, 0.01);

  col += u_colors[0] * smoothstep(0.1, 1.0, n1) * 0.5;
  col += u_colors[1] * light;

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.5;

  float dist = length(uv - 0.5);
  col *= smoothstep(1.2, 0.2, dist);

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface AuralisProps {
  /** Up to three hex colours; the shader reads the first two. */
  colors?: string[];
  /** Field drift while nothing is happening. Keep it low for a backdrop. */
  speed?: number;
  /**
   * Extra field time added per 1000px scrolled. 0 ignores scrolling entirely;
   * with it set, the field answers the reader instead of running on its own.
   */
  scrollBoost?: number;
  grain?: number;
  /**
   * Device-pixel cap. A full-screen noise shader costs fragments quadratically,
   * so an ambient backdrop rarely justifies more than 1.
   */
  maxDpr?: number;
  height?: string;
  className?: string;
  /** Content drawn over the field. */
  children?: React.ReactNode;
}

const DEFAULT_COLORS = ["#ef4444", "#dc2626", "#b91c1c"];

/** Parses #rgb and #rrggbb; anything unparseable falls back to black. */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Left visible in development; the caller falls back to the flat backdrop.
    console.error("Auralis shader failed to compile:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * A WebGL ambient field: layered simplex noise, a glow term and film grain.
 *
 * Renders a single frame rather than animating when the reader has asked for
 * reduced motion, and suspends its loop whenever it scrolls out of view or the
 * tab is hidden — an ambient background is not worth a permanent frame budget.
 */
const Auralis = ({
  colors = DEFAULT_COLORS,
  speed = 0.3,
  scrollBoost = 0,
  grain = 0.6,
  maxDpr = 1.5,
  height = "100vh",
  className,
  children,
}: AuralisProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Colour values, not array identity, decide whether the context is rebuilt —
  // an inline `colors={[...]}` prop would otherwise tear down WebGL every render.
  const colorKey = colors.join(",");
  const colorData = useMemo(
    () => new Float32Array(colorKey.split(",").slice(0, 3).flatMap(hexToRgb)),
    [colorKey],
  );

  // Read live inside the loop so tuning these never rebuilds the context.
  const speedRef = useRef(speed);
  const grainRef = useRef(grain);
  const scrollBoostRef = useRef(scrollBoost);
  useEffect(() => {
    speedRef.current = speed;
    grainRef.current = grain;
    scrollBoostRef.current = scrollBoost;
  }, [speed, grain, scrollBoost]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    // Software rasterisers compile this shader on the main thread and block it
    // for seconds — measured at 3.6s under SwiftShader, against a 17ms worst
    // frame with WebGL off. Not worth an ambient background: leave the
    // container's CSS backdrop in place instead.
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, vertexShaderGLSL);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderGLSL);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Auralis program failed to link:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      // Array uniforms are addressed by their first element; querying the bare
      // name is not portable across WebGL implementations.
      colors: gl.getUniformLocation(program, "u_colors[0]"),
    };
    gl.uniform3fv(locs.colors, colorData);

    const draw = (seconds: number) => {
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, seconds);
      gl.uniform1f(locs.grain, grainRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, maxDpr);
      const width = Math.max(1, Math.round(container.clientWidth * dpr));
      const nextHeight = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width === width && canvas.height === nextHeight) return;
      canvas.width = width;
      canvas.height = nextHeight;
      gl.viewport(0, 0, width, nextHeight);
    };

    const ro = new ResizeObserver(() => {
      resize();
      // Keep the still frame correct while paused or under reduced motion.
      if (!running) draw(elapsed);
    });
    ro.observe(container);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let running = false;
    let last = 0;
    let elapsed = 0;
    let onScreen = true;
    let scrolled = 0;
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      scrolled += Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
    };

    const frame = (now: number) => {
      // Advance by real elapsed time so pausing does not jump the field, plus
      // whatever distance was scrolled since the previous frame.
      elapsed += ((now - last) / 1000) * speedRef.current;
      elapsed += (scrolled / 1000) * scrollBoostRef.current;
      scrolled = 0;
      last = now;
      draw(elapsed);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const sync = () => {
      const shouldRun = onScreen && !document.hidden && !reduceMotion.matches;
      if (shouldRun) start();
      else {
        stop();
        draw(elapsed);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px" },
    );
    io.observe(container);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reduceMotion.addEventListener?.("change", sync);
    sync();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      reduceMotion.removeEventListener?.("change", sync);
      gl.deleteBuffer(buffer);
      gl.detachShader(program, vertex);
      gl.detachShader(program, fragment);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [colorData, height, maxDpr]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={cn("relative w-full overflow-hidden bg-[#010103]", className)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {children && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default Auralis;
