/* Audit checks — run inside a kit's iframe document.
 *
 * Every check here corresponds to a rule this design system has already
 * decided. The point is not to invent taste; it is to catch the places where
 * the code and the decision have drifted apart, at a given viewport width.
 *
 * Each finding: { rule, severity, detail, sel }
 */

const WEIGHTS_ALLOWED = new Set(["400", "500", "700"]);

/* --- colour helpers --- */

function parseColor(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "transparent" || v === "rgba(0, 0, 0, 0)") return null;
  let m = v.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  return null;
}

const key = (c) => c.r + "," + c.g + "," + c.b;

function luminance(c) {
  const f = (n) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

function contrast(fg, bg) {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return a > b ? a / b : b / a;
}

/* Flatten a translucent foreground onto its ground before measuring — an
   alpha-muted label is exactly the case the palette rules call out. */
function flatten(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  };
}

/* The ground an element's text actually sits on. Returns null when an image
   or gradient is in the way — unmeasurable rather than passing. */
function groundOf(el, win) {
  let node = el;
  while (node && node.nodeType === 1) {
    const cs = win.getComputedStyle(node);
    if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a >= 1) return bg;
    if (bg && bg.a > 0) return null;
    node = node.parentElement;
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function selectorOf(el) {
  if (!el || el.nodeType !== 1) return "?";
  let s = el.tagName.toLowerCase();
  if (el.id) return s + "#" + el.id;
  const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean);
  if (cls.length) s += "." + cls.slice(0, 2).join(".");
  return s;
}

const textOf = (el) => {
  const t = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3 && n.nodeValue.trim()) t.push(n.nodeValue.trim());
  });
  return t.join(" ");
};

const visible = (el, win) => {
  const cs = win.getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/* --- the palette, read from the live document --- */

export function palette(doc, win, cssText) {
  const names = new Set();
  (cssText.match(/--[a-z0-9-]+(?=\s*:)/g) || []).forEach((n) => names.add(n));
  const root = win.getComputedStyle(doc.documentElement);
  const allowed = new Set();
  names.forEach((n) => {
    const c = parseColor(root.getPropertyValue(n));
    if (c) allowed.add(key(c));
  });
  /* Paper, ink and the two ends of the ramp are always in. */
  ["255,255,255", "0,0,0"].forEach((k) => allowed.add(k));
  return allowed;
}

/* --- the battery --- */

export function run(doc, win, opts) {
  const findings = [];
  const scope = opts.root || doc.body;
  const add = (rule, severity, detail, el) =>
    findings.push({ rule, severity, detail, sel: selectorOf(el) });

  const narrow = opts.width <= 768;
  const allowed = opts.allowed;

  /* 1. Nothing should scroll sideways. Only meaningful for a whole page — a
        dialog subtree is measured against its own panel, not the viewport. */
  const de = doc.documentElement;
  if (scope === doc.body && de.scrollWidth > de.clientWidth + 1) {
    add(
      "h-overflow",
      "high",
      "document scrolls sideways: " + de.scrollWidth + " > " + de.clientWidth,
      doc.body
    );
    /* Name the widest offender rather than leaving it to a hunt. */
    let worst = null;
    doc.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > de.clientWidth + 1 && (!worst || r.right > worst.right)) {
        worst = { el: el, right: r.right };
      }
    });
    if (worst) {
      add("h-overflow", "high", "widest element reaches " + Math.round(worst.right) + "px", worst.el);
    }
  }

  const all = scope.querySelectorAll("*");

  all.forEach((el) => {
    if (!visible(el, win)) return;
    const cs = win.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const text = textOf(el);
    const tag = el.tagName.toLowerCase();

    /* 2. Three weights, and nothing else. */
    if (!WEIGHTS_ALLOWED.has(cs.fontWeight) && text) {
      add("weight", "med", "font-weight " + cs.fontWeight + " (set is 400/500/700)", el);
    }

    /* 3. Text contrast. 3:1 only at headline scale. */
    if (text.length > 1) {
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const ground = groundOf(el, win);
      const fgRaw = parseColor(cs.color);
      if (ground && fgRaw) {
        const fg = flatten(fgRaw, ground);
        const ratio = contrast(fg, ground);
        const floor = large ? 3 : 4.5;
        if (ratio < floor) {
          add(
            "contrast",
            ratio < floor - 1 ? "high" : "med",
            ratio.toFixed(2) + ":1 needs " + floor + " (" + Math.round(size) + "px " +
              cs.fontWeight + ", " + cs.color + " on rgb(" + key(ground) + ")) \u2014 \u201c" +
              text.slice(0, 40) + "\u201d",
            el
          );
        }
      }
    }

    /* 4. Every colour on screen comes from the tokens. */
    ["color", "backgroundColor", "borderTopColor"].forEach((prop) => {
      if (prop === "color" && !text) return;
      if (prop === "backgroundColor") {
        const c = parseColor(cs.backgroundColor);
        if (c && c.a >= 1 && !allowed.has(key(c))) {
          add("off-palette", "med", "background rgb(" + key(c) + ")", el);
        }
        return;
      }
      if (prop === "borderTopColor") {
        if (parseFloat(cs.borderTopWidth) < 0.5) return;
        const c = parseColor(cs.borderTopColor);
        if (c && c.a >= 1 && !allowed.has(key(c))) {
          add("off-palette", "low", "border rgb(" + key(c) + ")", el);
        }
        return;
      }
      const c = parseColor(cs.color);
      if (c && c.a >= 1 && !allowed.has(key(c))) {
        add("off-palette", "med", "text rgb(" + key(c) + ")", el);
      }
    });

    /* 5. Disabled is 0.5 everywhere. */
    if (el.disabled || el.getAttribute("aria-disabled") === "true") {
      const o = parseFloat(cs.opacity);
      if (o < 1 && Math.abs(o - 0.5) > 0.01) {
        add("disabled-opacity", "low", "opacity " + cs.opacity + " (the rule is 0.5)", el);
      }
    }

    /* 6. Hit targets. Only for controls that stand alone: the dashboard's
          density is a decision (`.app-btn` exists for it), so a button inside
          a table row or a toolbar is not measured against the 44px floor that
          belongs to the mobile app's own surface. What IS measured is a
          control small enough to be a miss on any surface. */
    if (
      narrow &&
      /^(a|button|select|summary)$/.test(tag) &&
      cs.position !== "fixed" &&
      rect.height > 0 &&
      rect.height < 28 &&
      rect.width < 28
    ) {
      add("hit-target", "med", Math.round(rect.width) + "\u00d7" + Math.round(rect.height) + " is a miss at any density", el);
    }

    /* 7. Content clipped with no way to reach it. */
    if (
      (cs.overflowY === "hidden" || cs.overflow === "hidden") &&
      el.scrollHeight > el.clientHeight + 2 &&
      el.clientHeight > 0
    ) {
      add(
        "clipped",
        "high",
        "content " + el.scrollHeight + "px in a " + el.clientHeight + "px box, overflow hidden",
        el
      );
    }

    /* 8. Measure. The failure this system has hit repeatedly: a column that
          does not step, putting a paragraph in a 150px measure. */
    if (/^(p|li|blockquote)$/.test(tag) && text.length > 90 && rect.width > 0 && rect.width < 200) {
      add("measure", "med", Math.round(rect.width) + "px wide for " + text.length + " characters", el);
    }
  });

  return findings;
}

/* --- the dialog contract ---
   The keyboard behaviour this system wrote down: focus moves into the panel,
   the page behind stops scrolling, and Escape is one of the two exits. These
   are mechanical, so they are measured rather than trusted. */

export function dialogContract(doc, win, panel) {
  const findings = [];
  const add = (rule, severity, detail) =>
    findings.push({ rule, severity, detail, sel: selectorOf(panel) });

  if (!panel.contains(doc.activeElement)) {
    add(
      "dialog-focus",
      "high",
      "focus stayed on " + selectorOf(doc.activeElement) + " outside the panel"
    );
  }
  if (doc.body.style.overflow !== "hidden") {
    add("dialog-scroll-lock", "med", "the page behind still scrolls");
  }
  const labelled =
    panel.getAttribute("aria-label") ||
    panel.getAttribute("aria-labelledby") ||
    panel.querySelector("h1, h2, h3");
  if (!labelled) {
    add("dialog-name", "med", "no accessible name on the dialog");
  }
  return findings;
}

/* Buttons that plausibly open something, excluding the shell's own chrome —
   discovered rather than listed, so a new screen is covered the day it lands. */
const OPENERS =
  /^\s*[+\u2795]?\s*(add|new|edit|delete|remove|ban|suspend|unsuspend|apply|assign|invite|create|open|qr|export|change|reset|upload|manage)\b/i;

const CHROME = ".sidebar, .user-header, .kit-switch, .cal__nav, .modal-backdrop, .drawer-backdrop";

export function openers(doc, win, limit) {
  const out = [];
  doc.querySelectorAll("button, a[role='button']").forEach((el) => {
    if (out.length >= limit) return;
    if (el.closest(CHROME)) return;
    if (!visible(el, win)) return;
    const label = (el.textContent || "").trim();
    if (!OPENERS.test(label)) return;
    out.push({ el: el, label: label.slice(0, 32) });
  });
  return out;
}
