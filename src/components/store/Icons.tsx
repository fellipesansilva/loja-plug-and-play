import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const MenuIcon = () => (
  <svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const SearchIcon = () => (
  <svg {...base}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const CartIcon = () => (
  <svg {...base}><path d="M3 4h2.5l2 11h10l2-8H7" /><circle cx="9.5" cy="19" r="1" /><circle cx="16.5" cy="19" r="1" /></svg>
);
export const ChevronLeftIcon = () => (
  <svg {...base}><path d="M15 5l-7 7 7 7" /></svg>
);
export const ChevronRightIcon = () => (
  <svg {...base}><path d="M9 5l7 7-7 7" /></svg>
);
export const PlusIcon = () => (
  <svg {...base} strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = () => (
  <svg {...base} strokeWidth={2.5}><path d="M5 12h14" /></svg>
);
export const CheckIcon = () => (
  <svg {...base} strokeWidth={2.5}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg {...base} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
