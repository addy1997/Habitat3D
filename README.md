<div align="center">

# 🏠 Habitat 3D

**AI-Powered Interior Design & Spatial Staging Engine**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## 🌟 What is Habitat 3D?

**Habitat 3D** is a next-generation, AI-powered interior design staging platform that lets you instantly visualise any room in multiple architectural styles — complete with procedurally generated, style-accurate 3D furniture, real-time lighting, and a conversational AI design assistant.

Whether you're a homeowner looking for interior inspiration, a real estate agent staging a listing, or an interior designer presenting to clients, Habitat 3D gives you a photorealistic, interactive 3D staging engine right in your browser.

---

## ✨ Features

### 🎨 8 Deeply Curated Interior Styles
Each style generates **completely unique** 3D geometry — not just colour swaps. Every sofa, bed, lamp, and rug is procedurally constructed from scratch based on the selected style.

| Style | Vibe |
|---|---|
| 🪵 **Scandinavian Living** | Clean, minimal, hygge warmth with oak tones |
| 🏡 **French Country Lounge** | Rustic, romantic, distressed wood & toile |
| ⚙️ **Industrial Chic Lounge** | Exposed steel, Edison bulbs, Chesterfield sofas |
| 🍃 **Japandi Harmony** | Japanese-Scandinavian fusion, floor-hugging platforms |
| 🕰️ **Mid-Century Modern** | Tapered legs, walnut, arc lamps |
| 🌺 **Bohemian Oasis** | Layered textiles, rattan, paper lanterns |
| 🌊 **Coastal Hampton** | Pale blues, driftwood, linen weaves |
| 💼 **Executive Home Office** | Leather, dark walnut, antique rugs |

---

### 🧠 AI-Powered Spatial Analysis
- Upload a photo of your **real room** and Gemini Vision analyses the dimensions, lighting, and layout
- AI generates **tailored staging variants** with furniture placement optimised for the space
- Multi-turn **Spatial Chatbot** lets you ask questions and refine the design in natural language

### 🎮 Interactive Dual 3D Viewport
- **Split-screen view**: empty room on the left, staged design on the right
- Full **OrbitControls** — drag to orbit, scroll to zoom, right-click to pan
- Procedural meshes with **contact shadows**, ambient occlusion, and **multi-light rigs**

### 🔬 NeRF & 3D Gaussian Splatting Pipeline
- Camera frustum visualisation across multiple pose estimates
- Gaussian Splat controls (scale, opacity, spherical harmonics toggle)
- Bounding volume inspector for NeRF training metadata

### 📊 Pydantic Logfire Telemetry
- Live trace dashboard showing AI pipeline spans
- Real-time request metadata, timing, and status

### 🖥️ Modal GPU Cluster Monitor
- Serverless GPU worker status panel for rendering jobs

---

## 🛠️ Tech Stack

```
Frontend          → React 18 + TypeScript + Vite 8
3D Engine         → Three.js (procedural mesh generation, OrbitControls)
Styling           → Tailwind CSS v4
AI Backend        → Google Gemini 2.5 Flash (vision + text)
Server            → Express.js + tsx
Deployment        → Vercel (Serverless Functions + Edge CDN)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- A [Google Gemini API Key](https://ai.google.dev/)

### Installation

```bash
# Clone the repository
git clone https://github.com/addy1997/Habitat3D.git
cd Habitat3D

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Add your Gemini API key inside .env:
# GOOGLE_API_KEY=your_key_here

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

---

## 🌐 Deployment (Vercel)

This project is pre-configured for one-click Vercel deployment.

1. Fork this repo and connect it to [Vercel](https://vercel.com/)
2. Set the following **Environment Variables** in your Vercel project dashboard:

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Your Google Gemini API key |
| `NODE_ENV` | `production` |

3. Deploy — Vercel automatically detects the Vite config and serverless functions.

---

## 📁 Project Structure

```
Habitat3D/
├── src/
│   ├── components/
│   │   ├── Login.tsx                 # Authentication UI
│   │   ├── DualRealisticViewport.tsx # Split 3D canvas engine
│   │   ├── StyleSwitcher.tsx         # 8-style carousel selector
│   │   ├── SpatialChatbot.tsx        # AI design assistant drawer
│   │   ├── NeRFPipelineModal.tsx     # NeRF / Gaussian Splat controls
│   │   ├── TopBar.tsx                # Navigation & system controls
│   │   └── ...
│   ├── data/
│   │   ├── defaultVariants.ts        # 8 hardcoded curated styles
│   │   └── sampleRooms.ts            # Sample room configurations
│   ├── utils/
│   │   ├── sceneBuilder.ts           # Procedural 3D mesh generator
│   │   ├── nerfPipeline.ts           # NeRF camera pose estimation
│   │   └── photorealisticAssets.ts   # Material & texture generators
│   └── App.tsx                       # Root application component
├── api/
│   └── index.ts                      # Vercel Serverless Function entry
├── server.ts                         # Express API server
├── vercel.json                       # Vercel routing configuration
└── vite.config.ts                    # Vite build configuration
```

---

## 🎯 Roadmap

- [ ] Real-time AI image generation per selected style (via Imagen)
- [ ] AR view — project staged furniture onto your live camera feed
- [ ] Export staged room as GLTF / OBJ for use in Blender / Unreal
- [ ] Furniture marketplace integration with direct purchase links
- [ ] Multi-user collaboration mode

---

## 📄 License

```
SPDX-License-Identifier: Apache-2.0
```

---

<div align="center">

Built with ❤️ using React, Three.js & Google Gemini AI

</div>
