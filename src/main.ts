import './style.css';
import fixtureUrl from '../content/EXAMPLE_PACK.json?url';

const status = document.querySelector<HTMLParagraphElement>('#boot-status')!;
const bootError = document.querySelector<HTMLParagraphElement>('#boot-error')!;
const retry = document.querySelector<HTMLButtonElement>('#retry')!;
const build = document.querySelector<HTMLElement>('#build')!;

build.textContent = `Foundation ${__BUILD_VERSION__} · ${__BUILD_SHA__}`;

async function boot() {
  const restoreFocus = document.activeElement === retry;
  retry.disabled = true;
  bootError.hidden = true;
  status.textContent = 'Loading the kitchen…';

  try {
    const [{ parseContentPack }, response] = await Promise.all([
      import('./content/pack'),
      fetch(fixtureUrl),
    ]);
    if (!response.ok) throw new Error('Could not load the content fixture.');
    const pack = parseContentPack(await response.json());
    const { verifyRenderer } = await import('./rendering/probe');
    verifyRenderer();
    build.textContent += ` · Content schema ${pack.schemaVersion}`;
    status.textContent = 'Kitchen foundation ready.';
    if (restoreFocus) {
      status.tabIndex = -1;
      status.focus();
    }
    retry.hidden = true;
  } catch (error) {
    status.textContent = 'The kitchen could not start.';
    bootError.textContent = error instanceof Error && error.message.startsWith('WebGL 2')
      ? error.message
      : 'Refresh the page to load the current build, or retry after checking your browser and connection.';
    bootError.hidden = false;
    retry.hidden = false;
    retry.disabled = false;
  }
}

retry.addEventListener('click', () => void boot());
void boot();
