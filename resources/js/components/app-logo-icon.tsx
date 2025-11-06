// PawWithMiddleGap.tsx
import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { title?: string };

export default function PawWithMiddleGap({ title = "Paw (middle gap)", ...props }: Props) {
  const titleId = React.useId();
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      shapeRendering="geometricPrecision"
      {...props}
    >
      <title id={titleId}>{title}</title>

      {/* outer toes */}
      <ellipse cx="20" cy="39" rx="9.0" ry="12.0" transform="rotate(-22 20 39)" />
      <ellipse cx="80" cy="39" rx="9.0" ry="12.0" transform="rotate(22 80 39)" />

      {/* center toes — nudged outward & slightly narrower for a visible middle gap */}
      <ellipse cx="38.5" cy="23.5" rx="9.7" ry="13.3" transform="rotate(-10 38.5 23.5)" />
      <ellipse cx="61.5" cy="23.5" rx="9.7" ry="13.3" transform="rotate(10 61.5 23.5)" />

      {/* main pad — still lowered to keep gap under toes */}
      <path d="
        M20 80
        C20 60 35.5 47 50 47
        C64.5 47 80 60 80 80
        C80 90 72.7 95.5 64 95.5
        C57.2 93.3 52.8 91.3 50 91.3
        C47.2 91.3 42.8 93.3 36 95.5
        C27.3 95.5 20 90 20 80
        Z
      " />
    </svg>
  );
}

/*
Tweak tips:
- More middle gap: move centers further (38 → 37, 62 → 63) or reduce rx to 9.4.
- Less gap: bring them in (39.5 & 60.5) or increase rx to ~10.2.
*/
