import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { QuizSessionProvider } from "./quiz/QuizSessionProvider";
import "./index.css";
import "./theme/themeStore";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <QuizSessionProvider>
        <App />
      </QuizSessionProvider>
    </AuthProvider>
  </StrictMode>,
);
