import { OrthographicCamera, Scene, WebGLRenderer } from 'three';

export function verifyRenderer() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2');
  if (!context) {
    throw new Error('WebGL 2 is unavailable. Enable hardware acceleration or try another browser, then retry.');
  }

  let renderer: WebGLRenderer | undefined;
  try {
    renderer = new WebGLRenderer({ canvas, context });
    renderer.setSize(16, 16, false);
    renderer.render(new Scene(), new OrthographicCamera(-1, 1, 1, -1, 0.1, 10));
    if (context.isContextLost() || context.getError() !== context.NO_ERROR) {
      throw new Error('The browser could not render the scene. Check graphics settings and retry.');
    }
  } finally {
    renderer?.dispose();
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
