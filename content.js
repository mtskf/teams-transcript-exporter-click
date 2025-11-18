(async () => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const container = document.querySelector('#scrollToTargetTargetedFocusZone');
  if (!container) {
    console.error('❌ Teamsチャットのスクロールコンテナが見つかりません。');
    return;
  }

  const seenIndexes = new Set();
  const rawResults = [];
  let lastKnownSpeaker = 'Unknown';

  let lastScrollTop = -1;
  let idleCounter = 0;
  const maxIdleCount = 5;

  while (idleCounter < maxIdleCount) {
    const cells = container.querySelectorAll('.ms-List-cell');

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const index = cell.getAttribute('data-list-index');
      if (seenIndexes.has(index)) continue;
      seenIndexes.add(index);

      const speakerElem = cell.querySelector('[class*="itemDisplayName-"]');
      let speaker = speakerElem?.innerText?.trim() || 'Unknown';
      if (speaker === 'Unknown' && rawResults.length > 0) {
        speaker = lastKnownSpeaker;
      } else {
        lastKnownSpeaker = speaker;
      }

      const textElem = cell.querySelector('[id^="sub-entry-"]');
      const text = textElem?.innerText?.trim() || '';

      const timeElem = cell.querySelector('[id^="Header-timestamp-"]');
      const time = timeElem?.innerText?.trim() || null;

      rawResults.push({ speaker, text, time });
    }

    container.scrollBy(0, 500);
    await delay(300);

    const currentScrollTop = container.scrollTop;
    if (currentScrollTop === lastScrollTop) {
      idleCounter++;
    } else {
      idleCounter = 0;
      lastScrollTop = currentScrollTop;
    }
  }

  const merged = [];
  for (let i = 0; i < rawResults.length; i++) {
    const current = rawResults[i];
    const prev = merged[merged.length - 1];

    if (prev && prev.speaker === current.speaker) {
      prev.text += `\n${current.text}`;
    } else {
      merged.push({ ...current });
    }
  }

  const finalResults = merged.map((item, idx) => ({
    index: idx,
    speaker: item.speaker,
    text: item.text,
    time: item.time
  }));

  window.transcriptData = finalResults;

  const blob = new Blob([JSON.stringify(finalResults, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'transcript.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Teams transcript exported.');
})();
