(() => {
  const desktopQuery = window.matchMedia("(min-width: 769px)");
  const feeds = Array.from(
    document.querySelectorAll(".l_main.feed-grid .post-list.post")
  );

  if (!feeds.length) return;

  let scheduled = false;

  const resetCard = (card) => {
    card.style.position = "";
    card.style.width = "";
    card.style.left = "";
    card.style.top = "";
  };

  const layoutFeed = (feed) => {
    const cards = Array.from(feed.querySelectorAll(":scope > .post-card"));
    feed.classList.remove("masonry-active");
    feed.style.height = "";
    cards.forEach(resetCard);

    if (!desktopQuery.matches || cards.length < 2) return;

    const styles = window.getComputedStyle(feed);
    const gap = Number.parseFloat(styles.columnGap) || 16;
    const cardWidth = (feed.clientWidth - gap) / 2;
    const columnHeights = [0, 0];

    cards.forEach((card) => {
      card.style.width = `${cardWidth}px`;
    });

    const cardHeights = cards.map((card) => card.getBoundingClientRect().height);
    feed.classList.add("masonry-active");

    cards.forEach((card, index) => {
      const column = index % 2;
      card.style.position = "absolute";
      card.style.left = `${column * (cardWidth + gap)}px`;
      card.style.top = `${columnHeights[column]}px`;
      columnHeights[column] += cardHeights[index] + gap;
    });

    feed.style.height = `${Math.max(...columnHeights) - gap}px`;
  };

  const layoutAll = () => {
    scheduled = false;
    feeds.forEach(layoutFeed);
  };

  const scheduleLayout = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(layoutAll);
  };

  window.addEventListener("resize", scheduleLayout, { passive: true });
  window.addEventListener("load", scheduleLayout, { once: true });
  desktopQuery.addEventListener?.("change", scheduleLayout);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleLayout);
    feeds.forEach((feed) => {
      feed.querySelectorAll(":scope > .post-card").forEach((card) => {
        observer.observe(card);
      });
    });
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleLayout);
  }

  scheduleLayout();
})();
