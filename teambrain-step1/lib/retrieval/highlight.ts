// ts_headline wraps matches in these. Control characters can't collide with real
// document text the way HTML tags could, and the UI turns them into <mark> safely.
// Kept free of server imports so client components can use them.
export const HIGHLIGHT_START = "\u0001";
export const HIGHLIGHT_END = "\u0002";
