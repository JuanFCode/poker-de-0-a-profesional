import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({
  options: {
    // String form required: Turbopack cannot receive JS functions.
    remarkPlugins: [["remark-gfm", {}]],
  },
});

export default withMDX(nextConfig);
