# Quantum Circuit Learning Lab

## Description

Quantum Circuit Learning Lab is an interactive platform for learning the basics of quantum computing through hands-on experimentation.

It allows users to build quantum circuits, run simulations using a FastAPI + Qiskit backend, and understand concepts through guided notes and quizzes. The goal is to make abstract quantum concepts more intuitive through visual and interactive learning.

## Features

### Simulation
- Quantum circuit builder (H, X, Y, Z, CX, RX, RZ)
- Step-by-step simulation playback
- Statevector and measurement result visualization

### Learning
- Guided notes with module demos and progress tracking
- Quiz system with topic filtering and session flow

### Platform
- Firebase authentication (Email + Google)
- Interactive homepage mascot
- Fully responsive UI (mobile, tablet, desktop)

## Tech Stack

### Frontend
- React + Vite
- TailwindCSS
- Zustand

### Backend
- FastAPI
- Qiskit / Aer simulator

### Other
- Firebase Auth
- EmailJS
- Vercel (frontend deployment)
- Render (backend deployment)

## Folder Structure

```text
frontend/
backend/
```

## Setup Instructions

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

Configure environment variables in the frontend and backend environments (do not commit secrets):

- `VITE_API_BASE_URL`
- Firebase keys (`VITE_FIREBASE_*`)
- EmailJS keys (`VITE_EMAILJS_*`)

## Deployment

- Frontend: Vercel
- Backend: Render

## Usage Flow

1. Sign up or log in.
2. Start with guided Notes modules.
3. Open Simulation to build and run circuits.
4. Use Test mode to evaluate understanding.
5. Log out when done.

## Author

Parth Dhunde

## Screenshots

Screenshots of the application interface (home page, simulation, notes, and quiz) can be added here.

## Notes

This project was built as a learning tool to simplify understanding of quantum computing concepts through visualization and interaction.