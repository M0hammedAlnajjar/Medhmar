// Bind once, including images that failed before the page listener was attached.
export function bindHomePhotoFallbacks(container) {
  container.querySelectorAll('img[data-mh-story-fallback]').forEach(img => {
    if (img.dataset.mhFallbackBound) return;
    img.dataset.mhFallbackBound = '1';
    const recover = () => {
      if (img.dataset.mhFallbackUsed) return;
      img.dataset.mhFallbackUsed = '1';
      img.src = img.dataset.mhStoryFallback;
    };
    img.addEventListener('error', recover, { once: true });
    if (img.complete && img.naturalWidth === 0) recover();
  });
}
