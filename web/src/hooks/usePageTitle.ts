import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title === "Coldi Freight" ? title : `${title} — Coldi Freight`;
  }, [title]);
}
