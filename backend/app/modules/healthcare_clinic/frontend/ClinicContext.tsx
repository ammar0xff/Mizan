import { createContext, useContext } from "react";

// Shared context for the clinic module. The shell (ClinicHealthcarePage) owns all
// state/queries/handlers and provides them here; each tab component consumes them
// via useClinic() so that every tab lives in its own file under tabs/.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ClinicContext = createContext<any>(null);

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within ClinicProvider");
  return ctx;
}

export const ClinicProvider = ClinicContext.Provider;