import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Builds a self-contained server under .next/standalone: its own server.js
   * plus only the dependencies actually reached at run time. That is what the
   * Node application manager of a shared host wants — an entry file it can
   * start — and it cuts what has to be uploaded from about 174 MB to a few.
   *
   * It does not copy `public` or `.next/static`; scripts/package.sh does that.
   */
  output: "standalone",

  /*
   * Every picture on this site is a plain <img> pointing at a WebP that
   * scripts/build-artwork.py already produced at the sizes needed, so the
   * image optimiser never runs. Saying so keeps `sharp` and its platform
   * binaries out of the bundle — 46 MB of the 68 MB it was otherwise.
   */
  images: { unoptimized: true },

  /*
   * `sharp` comes in as a dependency of next itself and is traced into the
   * standalone bundle whether or not the optimiser runs — 46 MB of platform
   * binaries for work this site never asks for. Excluding it leaves the
   * upload at a fraction of the size.
   */
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
};

export default nextConfig;
