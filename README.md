# CoDraw
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![YJS](https://img.shields.io/badge/YJS-CRDT-orange?style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

**CoDraw** is a local first high-performance, real-time collaborative whiteboard. It utilizes **CRDTs (Conflict-free Replicated Data Types)** to ensure state consistency across distributed users and implements advanced viewport culling for 60 FPS rendering performance.

---

## Key Features

* **Real-Time Collaboration:** Syncs drawings, text, and images instantly between users using **YJS** and WebSockets.
* **High-Performance Rendering:** Implements **O(1) viewport culling** via AABB (Axis-Aligned Bounding Box) caching to handle 10,000+ shapes without frame drops.
* **Multiplayer Presence:** Live Ghost Cursors showing other users' positions and names.
* **Magic Draw (Shape Recognition):** Custom algorithm that detects freehand strokes and auto-converts them into perfect geometric polygons (Circles, Rectangles, Triangles).
* **Persistence:** Local-first dashboard using `localStorage` for session management + Server persistence.

---

## Tech Stack

### Frontend
* **Framework:** React, TypeScript, Vite
* **Graphics:** React-Konva
* **State & Sync:** YJS, Hocuspocus
* **Styling:** Tailwind CSS, Shadcn/UI
* **Icons:** Lucide React

### Backend
* **Server:** Node.js, Fastify
* **Deployment:** Vercel (Frontend), Render/Docker (Backend)

---

## 💻 Getting Started

### Prerequisites
* Node.js (v18+)
* npm or pnpm

### Installation

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/jehan1241/coDraw.git](https://github.com/jehan1241/coDraw.git)
    cd coDraw
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```
---
