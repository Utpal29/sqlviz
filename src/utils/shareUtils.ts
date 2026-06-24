import type { DatasetName } from "../types/database";

const VALID_DATASETS: DatasetName[] = ["ecommerce", "music", "employees", "social"];

export interface ShareParams {
  dataset: DatasetName;
  query: string;
}

function isDatasetName(value: string): value is DatasetName {
  return (VALID_DATASETS as string[]).includes(value);
}

export function buildShareUrl(dataset: DatasetName, query: string): string {
  const params = new URLSearchParams();
  params.set("dataset", dataset);
  params.set("q", query);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${params.toString()}`;
}

export function parseShareParams(search: string = window.location.search): ShareParams | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const dataset = params.get("dataset");
  const query = params.get("q");
  if (!dataset || !query) return null;
  if (!isDatasetName(dataset)) return null;
  return { dataset, query };
}

export function writeShareParams(dataset: DatasetName, query: string): void {
  const url = buildShareUrl(dataset, query);
  window.history.replaceState({}, "", url);
}

export function clearShareParams(): void {
  const base = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, "", base);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to fallback
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
