import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "storage/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Thumbnails come from arbitrary public sources (YouTube, archive.org, church sites),
    // so plain <img> with lazy loading is used instead of next/image remote patterns.
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default config;
