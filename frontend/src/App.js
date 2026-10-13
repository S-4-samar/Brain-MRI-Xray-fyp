import { useState, useEffect, useCallback } from "react";
import VirtualGadolinium from "./VirtualGadolinium";
import MainApp from "./MainApp";
import ModalitySelect from "./ModalitySelect";
import AppBackground from "./components/ui/app-background";

const STORAGE_KEY = "vg_modality";

function getPath() {
  return window.location.pathname === "/app" ? "/app" : "/";
}

function readStoredModality() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "mri" || v === "xray") return v;
    return null;
  } catch {
    return null;
  }
}

function App() {
  const [path, setPath] = useState(getPath);
  const [modality, setModality] = useState(readStoredModality);
  const [pickerOpen, setPickerOpen] = useState(false);

  const syncPath = useCallback(() => setPath(getPath()), []);

  useEffect(() => {
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, [syncPath]);

  const requestAccessFromLanding = useCallback(() => setPickerOpen(true), []);

  const handleModalityChosen = useCallback((m) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
    setModality(m);
    setPickerOpen(false);
    if (getPath() !== "/app") {
      window.history.pushState({}, "", "/app");
      setPath("/app");
    }
  }, []);

  const handleChangeModality = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setModality(null);
    if (getPath() !== "/app") {
      window.history.pushState({}, "", "/app");
      setPath("/app");
    }
  }, []);

  const handlePickerClose = useCallback(() => setPickerOpen(false), []);

  const handleFullPagePickerClose = useCallback(() => {
    window.history.pushState({}, "", "/");
    setPath("/");
  }, []);

  const showWorkspace = path === "/app" && modality;
  const showFullPagePicker = path === "/app" && !modality;

  return (
    <>
      <AppBackground />
      <div className="relative z-10 min-h-screen">
      {path === "/" && (
        <>
          <VirtualGadolinium onRequestAccess={requestAccessFromLanding} />
          {pickerOpen && (
            <ModalitySelect variant="overlay" onClose={handlePickerClose} onSelect={handleModalityChosen} />
          )}
        </>
      )}
      {showFullPagePicker && (
        <ModalitySelect variant="page" onClose={handleFullPagePickerClose} onSelect={handleModalityChosen} />
      )}
      {showWorkspace && <MainApp modality={modality} onChangeModality={handleChangeModality} />}
      </div>
    </>
  );
}

export default App;
