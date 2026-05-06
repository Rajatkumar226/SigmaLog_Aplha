
  import { createRoot } from "react-dom/client";
  import { Toaster } from "sonner";
  import App from "./AppWithSupabase.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.10)', color: '#f1f5f9' },
        }}
      />
    </>
  );
  