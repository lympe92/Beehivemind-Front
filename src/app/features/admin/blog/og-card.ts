/**
 * Draws a post's 1200x630 Open Graph card in the browser.
 *
 * `tools/build-og.mjs` produces the site's three static cards, but it drives
 * headless Chrome through puppeteer — neither of which exists on the droplet,
 * so a card per post cannot be generated when the post is saved server-side.
 * The console has a browser already, so it draws the card here and uploads the
 * result as an ordinary image.
 *
 * The artwork is the same one: ink ground, a faint honeycomb in the top-right
 * corner, the amber rule, the category as an uppercase kicker, the title, and
 * the domain on the baseline. Colours are the brand tokens, repeated as
 * literals because a canvas cannot read a custom property.
 */

const WIDTH = 1200;
const HEIGHT = 630;

const INK = '#212121';
const AMBER = '#f69520';
const WHITE = '#ffffff';
const FOOT = '#c9c4bd';

const FONT = '"Peridot PE", -apple-system, "Segoe UI", sans-serif';

export interface OgCardInput {
  title: string;
  /** The category name, or any short label. Rendered uppercase. */
  kicker: string;
}

export async function drawOgCard({ title, kicker }: OgCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw the card.');

  // Peridot is what the whole brand is set in; without waiting, the first card
  // of a session renders in the fallback stack.
  await document.fonts.ready;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawComb(ctx);
  await drawLockup(ctx);
  drawRule(ctx);
  drawKicker(ctx, kicker);
  drawTitle(ctx, title);
  drawFooter(ctx);

  return toBlob(canvas);
}

/**
 * The honeycomb, faded out from its own centre. Drawn on a scratch canvas so
 * the radial fade can be applied as a mask; painting hexagons straight onto the
 * card would leave a hard-edged rectangle of them.
 */
function drawComb(ctx: CanvasRenderingContext2D): void {
  const size = 900;
  const scratch = document.createElement('canvas');
  scratch.width = size;
  scratch.height = size;

  const s = scratch.getContext('2d');
  if (!s) return;

  const cellW = 112;
  const cellH = 97;

  s.strokeStyle = AMBER;
  s.lineWidth = 2;

  for (let y = 0; y < size + cellH; y += cellH) {
    for (let x = 0; x < size + cellW; x += cellW) {
      hexagon(s, x, y, cellW, cellH);
    }
  }

  // Keep only what is inside the fade.
  const fade = s.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.39);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  s.globalCompositeOperation = 'destination-in';
  s.fillStyle = fade;
  s.fillRect(0, 0, size, size);

  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.drawImage(scratch, WIDTH - size + 140, -120);
  ctx.restore();
}

function hexagon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y);
  ctx.lineTo(x + w * 0.75, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w * 0.75, y + h);
  ctx.lineTo(x + w * 0.25, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
  ctx.stroke();
}

/** The mark ships black on transparent, so it is inverted onto the ink ground. */
async function drawLockup(ctx: CanvasRenderingContext2D): Promise<void> {
  const mark = await loadImage('assets/img/logotr.webp').catch(() => null);

  if (mark) {
    ctx.save();
    // Not supported everywhere; the card is still correct without it, just
    // with a dark mark, so it is applied optimistically.
    ctx.filter = 'brightness(0) invert(1)';
    ctx.drawImage(mark, 80, 74, 54, 54);
    ctx.restore();
  }

  ctx.fillStyle = WHITE;
  ctx.font = `700 30px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '0.9px';
  ctx.fillText('BEEHIVEMIND', mark ? 150 : 80, 74 + 27);
  ctx.letterSpacing = '0px';
}

function drawRule(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.roundRect(80, 192, 74, 5, 2);
  ctx.fill();
}

function drawKicker(ctx: CanvasRenderingContext2D, kicker: string): void {
  ctx.fillStyle = AMBER;
  ctx.font = `500 21px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '3.36px';
  ctx.fillText(kicker.toUpperCase(), 80, 252);
  ctx.letterSpacing = '0px';
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string): void {
  // The same two sizes build-og.mjs picks between.
  const size = title.length > 46 ? 62 : 72;

  ctx.fillStyle = WHITE;
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textBaseline = 'alphabetic';

  const lines = wrap(ctx, title, 880).slice(0, 4);
  const lineHeight = size * 1.06;

  lines.forEach((line, i) => ctx.fillText(line, 80, 300 + size + i * lineHeight));
}

function drawFooter(ctx: CanvasRenderingContext2D): void {
  const y = HEIGHT - 74;

  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(83.5, y - 8, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = FOOT;
  ctx.font = `400 23px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('beehivemind.tech', 101, y);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('The card could not be encoded.'))),
      'image/jpeg',
      0.88,
    );
  });
}
