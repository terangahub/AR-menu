import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerJSX = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    src?: string;
    "ios-src"?: string;
    alt?: string;
    ar?: boolean;
    "ar-modes"?: string;
    "camera-controls"?: boolean;
    "auto-rotate"?: boolean;
    "shadow-intensity"?: string;
    poster?: string;
    reveal?: string;
    exposure?: string;
  },
  HTMLElement
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSX;
    }
  }
}

export {};
