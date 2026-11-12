(function () {
  const currentScript = document.currentScript;
  const workspaceId = currentScript ? currentScript.getAttribute('data-workspace-id') : null;
  const baseUrl = currentScript ? new URL(currentScript.src).origin : window.location.origin;

  if (!workspaceId) {
    console.warn('[ResolveFlow AI] Widget script missing data-workspace-id attribute.');
    return;
  }

  // Create Container
  const container = document.createElement('div');
  container.id = 'resolveflow-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style.right = '24px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Create Launcher Button
  const button = document.createElement('button');
  button.id = 'resolveflow-launcher-btn';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  `;
  button.style.width = '56px';
  button.style.height = '56px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#4f46e5';
  button.style.border = 'none';
  button.style.boxShadow = '0 10px 25px -5px rgba(79, 70, 229, 0.4)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s, background-color 0.2s';

  button.onmouseenter = () => (button.style.transform = 'scale(1.08)');
  button.onmouseleave = () => (button.style.transform = 'scale(1)');

  // Create Iframe for chat widget
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/widget-demo`;
  iframe.style.width = '390px';
  iframe.style.height = '580px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '24px';
  iframe.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  iframe.style.display = 'none';
  iframe.style.marginBottom = '16px';

  let isOpen = false;

  button.onclick = () => {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
  };

  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();
