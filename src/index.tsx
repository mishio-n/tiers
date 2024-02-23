import satori, { init } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';

// @ts-ignore
import yoga from 'yoga-wasm-web/dist/yoga.wasm';

export interface Env {
  R2_TIERS: R2Bucket;
}

init(await initYoga(yoga));

let fontBufffer: ArrayBuffer | null = null;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const font = await env.R2_TIERS.get('fonts/number.woff');
    if (font === null) {
      return new Response('Font not found', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    const query = new URL(request.url).searchParams

    // デフォルトは予想
    const type = query.get('type') === 'rank' ? 'rank' : 'yosou'
    const s = query.getAll('s') // ◎
    const a = query.getAll('a') // ◯
    const b = query.getAll('b') // ▲
    const c = query.getAll('c') // △
    const d = query.getAll('d') // ×

    // 数字以外はエラー
    if (s.concat(a, b, c, d).join('').match(/^\d+$/) === null) {
      return new Response('Invalid input', { status: 400, headers: { 'Content-Type': 'text/plain' } });
    }

    fontBufffer = await font.arrayBuffer();

    const svg = await satori(
      <div style={{ display: 'flex' }}>
        <p style={{ color: 'red' }}>12345</p>
      </div>,
      {
        width: 120,
        height: 64,
        fonts: [
          {
            name: 'Roboto',
            data: fontBufffer,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=604800',
      },
    });
  },
};
