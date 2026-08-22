import CreativeCloud from "@/assets/skills/creative-cloud.svg";
import Deno from "@/assets/skills/deno.svg";
import Figma from "@/assets/skills/figma.svg";
import JavaScript from "@/assets/skills/javascript.svg";
import NodeJS from "@/assets/skills/nodejs.svg";
import ReactRouter from "@/assets/skills/react-router.svg";
import TailwindCSS from "@/assets/skills/tailwindcss.svg";
import TypeScript from "@/assets/skills/typescript.svg";
import VisualStudioCode from "@/assets/skills/visual-studio-code.svg";
import Vite from "@/assets/skills/vite.svg";
import Copilot from "@/assets/skills/copilot.svg";
import CSS from "@/assets/skills/css.svg";
import HTML from "@/assets/skills/html.svg";
import React from "@/assets/skills/react.svg";
import Vue from "@/assets/skills/vue.svg";
import Nuxt from "@/assets/skills/nuxt.svg";
import Rust from "@/assets/skills/rust.svg";
import Cursor from "@/assets/skills/cursor.svg";
import GitHub from "@/assets/skills/github.svg";
import Nextjs from "@/assets/skills/nextjs.svg";
import Remix from "@/assets/skills/remix.svg";
import PHP from "@/assets/skills/php.svg";
import Payload from "@/assets/skills/payload.svg";
import Sanity from "@/assets/skills/sanity.svg";
import Wordpress from "@/assets/skills/wordpress.svg";
import Claude from "@/assets/skills/claude.svg";

export const SKILLS = {
  Frontend: [
    {
      name: "HTML",
      logo: HTML,
      url: "https://developer.mozilla.org/de/docs/Web/HTML",
    },
    {
      name: "CSS",
      logo: CSS,
      url: "https://developer.mozilla.org/de/docs/Web/CSS",
    },
    {
      name: "JavaScript",
      logo: JavaScript,
      url: "https://developer.mozilla.org/de/docs/Web/JavaScript",
    },
    {
      name: "TypeScript",
      logo: TypeScript,
      url: "https://www.typescriptlang.org",
    },
    {
      name: "Tailwind",
      logo: TailwindCSS,
      url: "https://tailwindcss.com",
    },
    {
      name: "React",
      logo: React,
      url: "https://react.dev",
    },
    {
      name: "Vue.js",
      logo: Vue,
      url: "https://vuejs.org",
    },
    {
      name: "Nuxt.js",
      logo: Nuxt,
      url: "https://nuxt.com",
    },
    {
      name: "Next.js",
      logo: Nextjs,
      url: "https://nextjs.org",
    },
  ],
  Backend: [
    {
      name: "Node.js",
      logo: NodeJS,
      url: "https://nodejs.org",
    },
    {
      name: "Actix-web(Rust)",
      logo: Rust,
      url: "https://actix.rs",
    },
  ],
  Desktop: [
    {
      name: "Tauri",
      logo: Rust,
      url: "https://tauri.app",
    },
  ],
  Mobile: [
    {
      name: "React Native",
      logo: React,
      url: "https://reactnative.dev",
    },
    {
      name: "Tauri",
      logo: Rust,
      url: "https://tauri.app",
    },
  ],
  Tools: [
    {
      name: "VS Code",
      logo: VisualStudioCode,
      url: "https://code.visualstudio.com",
    },
    {
      name: "Cursor",
      logo: Cursor,
      url: "https://cursor.com",
    },
    {
      name: "Claude Code",
      logo: Claude,
      url: "https://claude.com/product/claude-code",
    },
    {
      name: "GitHub Copilot",
      logo: Copilot,
      url: "https://github.com/features/copilot",
    },
    {
      name: "GitHub",
      logo: GitHub,
      url: "https://github.com",
    },
    {
      name: "Figma",
      logo: Figma,
      url: "https://www.figma.com",
    },
    {
      name: "Vite",
      logo: Vite,
      url: "https://vite.dev",
    },
  ],
} as const;
