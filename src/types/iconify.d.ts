import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": {
        icon?: string;
        class?: string;
        style?: Record<string, string>;
        width?: string;
        height?: string;
        children?: React.ReactNode;
      };
    }
  }
}
