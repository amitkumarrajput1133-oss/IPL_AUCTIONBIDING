# 🌐 24/7 Public Cloud Deployment Guide

This guide explains how to deploy the **IPL Auction System** for free on the public web so it can be opened on any smartphone, tablet, or PC worldwide with live real-time bidding.

---

## 🏗️ Architecture Overview
- **Backend**: Spring Boot 3/4 + Java 17 + WebSockets (STOMP/SockJS) deployed on **Render** (via Docker container).
- **Frontend**: Vite + React 19 SPA deployed on **Vercel** with global CDN and automatic SSL.

---

## 🚀 Step 1: Deploy the Backend on [Render.com](https://render.com/) (Free)

The backend powers the database, authentication, REST APIs, and live WebSocket bidding.

1. **Sign up or Log in**:
   - Go to [render.com](https://render.com/) and sign in with GitHub.

2. **Create New Web Service**:
   - Click the **"New +"** button in the dashboard and select **"Web Service"**.
   - Under *Connect a repository*, choose your repository (`IPL_AUCTIONBIDING`).

3. **Configure the Service**:
   - **Name**: `ipl-auction-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g., *Singapore* or *Frankfurt*)
   - **Root Directory**: `backend`
   - **Runtime**: Select **Docker**
   - **Instance Type**: **Free**

4. **Deploy**:
   - Click **"Deploy Web Service"** at the bottom.
   - Render will build the container using `backend/Dockerfile`. The initial build takes approximately 2–3 minutes.

5. **Copy Backend URL**:
   - Once the status shows **Live**, copy your public service URL from the top of the Render dashboard:
   ```text
   https://ipl-auction-backend.onrender.com
   ```
   *(Ensure you remove any trailing slash `/`)*

---

## ⚡ Step 2: Deploy the Frontend on [Vercel.com](https://vercel.com/) (Free)

The frontend provides the responsive interface accessible across all mobile phones, tablets, and PCs.

1. **Sign up or Log in**:
   - Go to [vercel.com](https://vercel.com/) and sign in with GitHub.

2. **Import Project**:
   - Click **"Add New..."** → **"Project"**.
   - Find and click **"Import"** next to your repository (`IPL_AUCTIONBIDING`).

3. **Configure Project Settings**:
   - **Framework Preset**: Vite *(automatically detected)*
   - **Root Directory**: Click **Edit** and select **`frontend`**
   - **Environment Variables**:
     - Expand the *Environment Variables* section and add:
       - **Key**: `VITE_API_URL`
       - **Value**: `https://ipl-auction-backend.onrender.com` *(paste your backend URL from Step 1)*

4. **Deploy**:
   - Click **"Deploy"**.
   - Within 30–60 seconds, Vercel will build and assign your live URL:
   ```text
   https://ipl-auction-frontend.vercel.app
   ```

---

## 🛠️ Configuration Files Included in Repository

- **`backend/Dockerfile`**: Multi-stage Maven container build with Eclipse Temurin Java 17 runtime.
- **`backend/src/main/resources/application.properties`**: Dynamic port binding via `${PORT:8082}` to adapt to cloud environments automatically.
- **`backend/src/main/java/com/ipl/auction/config/SecurityConfig.java`**: Configured `CorsConfigurationSource` allowing cross-origin requests, preflight OPTIONS, and WebSocket handshakes from any device.
- **`backend/src/main/java/com/ipl/auction/controller/HealthController.java`**: Cloud health probe endpoint (`/` and `/api/health`).
- **`frontend/vercel.json`**: SPA routing rewrite rules ensuring page reloads and direct links never throw 404 errors.
- **`render.yaml`**: Infrastructure-as-code blueprint for Render.

---

## 📱 Verifying Multi-Device Access
Once deployed:
1. Open the Vercel URL on your computer: log in as `admin` (password: `admin123`).
2. Open the same Vercel URL on your phone: log in as a team owner (e.g., `csk_owner`, password: `csk123`).
3. Place a bid on either device — the live WebSocket will synchronize the bid, timer, and purse instantly across all screens.
