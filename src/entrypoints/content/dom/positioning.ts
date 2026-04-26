export function positionButtonAtEndOfField(
  buttonContainer: HTMLElement,
  inputField: HTMLElement,
  updatePositionListeners: Array<() => void>
): void {
  const updatePosition = () => {
    const rect = inputField.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = `${rect.top + scrollTop + (rect.height - 24) / 2}px`;
    buttonContainer.style.left = `${rect.right + scrollLeft - 30}px`;
  };

  updatePosition();

  const resizeHandler = () => updatePosition();
  const scrollHandler = () => updatePosition();
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('scroll', scrollHandler);

  updatePositionListeners.push(() => {
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('scroll', scrollHandler);
  });
}
