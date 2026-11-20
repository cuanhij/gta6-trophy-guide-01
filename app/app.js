// Leonida Platinum — an offline GTA VI trophy guide and tracker.
// Data: data/trophies.json (the 55 official trophies, guides in our own words).
// Progress and the spoiler setting live in localStorage; nothing leaves the browser.

const STORAGE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';
const TOTAL = 55;

const ROADMAP_STAGES = [
  {
    n: 1,
    title: 'Play the story',
    blurb:
      'Chapters 1–4 and the final mission. Twelve trophies: the opening mission, four chapter ' +
      'completions, the final mission, and six named missions. Do the mission-tied ones as they ' +
      'come — and meditate at Lucia’s balcony before Chapter 1 ends.',
  },
  {
    n: 2,
    title: 'Strangers & side stories',
    blurb:
      'The character strands and the strangers of Leonida. Finish the final missions for Andy, ' +
      'Kenton, Billy, Randy and Tyrone, complete 8 stranger strands, meditate at the remaining ' +
      'spots, and hunt Bret’s animal.',
  },
  {
    n: 3,
    title: 'Activities & skills',
    blurb:
      'The repeatable activities: 250 stunts, 42 gold Shooting Range medals, drone races at 14 ' +
      'spots, 20 race wins, fishing against Cal, one arcade game, 50 challenges, Combat Focus and ' +
      'the melee drive-by.',
  },
  {
    n: 4,
    title: 'Collectibles & the map',
    blurb:
      'Cards, photos, vehicles, areas and garages: 3 card sets, WAiNK It at 100 spots, 100 ' +
      'vehicles discovered, all 52 areas, 8 garage properties, 10 vehicles on the Scooter Bros app.',
  },
  {
    n: 5,
    title: 'Money & mayhem',
    blurb:
      'Robberies and open-world chaos: bank vaults, armored trucks, gang operations, shop robberies ' +
      'with your partner, the airport departure, the showroom smash, bowling, and the two money trophies.',
  },
  {
    n: 6,
    title: '100% & the platinum',
    blurb:
      'Attain 100% completion — the in-game checklist is your to-do list — and the platinum, ' +
      'Vice Got a Price!, pops with it.',
  },
];

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

const state = {
  earned: new Set(),
  spoiler: false,
  kind: 'all',
  grade: 'all',
  status: 'all',
  query: '',
  view: 'checklist',
  detailId: null,
};

let trophies = [];

const $ = (id) => document.getElementById(id);

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter((n) => typeof n === 'string'));
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch {
    // A corrupt save is ignored; the checklist starts empty.
  }
}

function saveStoredState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ earned: [...state.earned], spoiler: state.spoiler }),
  );
}

function trophyById(id) {
  return trophies.find((t) => t.id === id) ?? null;
}

function isEarned(trophy) {
  return state.earned.has(trophy.name);
}

function isStoryHidden(trophy) {
  return state.spoiler && trophy.kind.includes('story') && !isEarned(trophy);
}

function toggleEarned(trophy, earned) {
  if (earned) state.earned.add(trophy.name);
  else state.earned.delete(trophy.name);
  saveStoredState();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  if (state.detailId === trophy.id) renderDetail();
}

function medalLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

function kindTags(trophy) {
  const tags = [...trophy.kind];
  if (trophy.missable && !tags.includes('missable')) tags.unshift('missable');
  return tags;
}

function buildTrophyRow(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy-row' + (isEarned(trophy) ? ' earned' : '');
  li.dataset.trophyId = String(trophy.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy);
  box.setAttribute('aria-label', `Earned: ${trophy.name}`);
  box.addEventListener('change', () => toggleEarned(trophy, box.checked));
  li.append(box);

  const medal = document.createElement('span');
  medal.className = `medal ${trophy.grade}`;
  medal.textContent = medalLetter(trophy.grade);
  medal.title = trophy.grade;
  li.append(medal);

  const main = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name';
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  if (isStoryHidden(trophy)) {
    name.textContent = 'Hidden story trophy';
    name.classList.add('spoiler-hidden');
    desc.textContent = 'Hidden until earned — tick it off to reveal the name and description.';
  } else {
    name.textContent = trophy.name;
    desc.textContent = trophy.description;
  }
  main.append(name, desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag grade-${trophy.grade}`;
  gradeTag.textContent = trophy.grade;
  meta.append(gradeTag);
  for (const kind of kindTags(trophy)) {
    const tag = document.createElement('span');
    tag.className = 'tag' + (kind === 'missable' ? ' missable' : '');
    tag.textContent = kind === 'missable' ? '⚠ MISSABLE' : KIND_LABELS[kind];
    meta.append(tag);
  }
  if (trophy.target != null) {
    const target = document.createElement('span');
    target.className = 'tag target';
    target.textContent = `Target: ${trophy.target.toLocaleString('en-US')} ${trophy.targetUnit}`;
    meta.append(target);
  }
  main.append(meta);
  li.append(main);

  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-btn';
  guideBtn.textContent = isStoryHidden(trophy) ? 'Why hidden?' : 'Guide →';
  guideBtn.addEventListener('click', () => openDetail(trophy.id));
  li.append(guideBtn);

  return li;
}

function trophyMatches(trophy) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && !trophy.kind.includes(state.kind)) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !isEarned(trophy)) return false;
  if (state.status === 'remaining' && isEarned(trophy)) return false;
  if (state.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function renderProgress() {
  const earned = trophies.filter(isEarned);
  $('progressCount').textContent = `${earned.length} / ${trophies.length || TOTAL}`;
  $('progressBar').style.width = `${trophies.length ? (earned.length / trophies.length) * 100 : 0}%`;
  const byGrade = (grade) => {
    const all = trophies.filter((t) => t.grade === grade).length;
    const got = earned.filter((t) => t.grade === grade).length;
    return `${got}/${all}`;
  };
  $('progressGrades').textContent =
    `Platinum ${byGrade('platinum')} · Gold ${byGrade('gold')} · ` +
    `Silver ${byGrade('silver')} · Bronze ${byGrade('bronze')}`;
  const missableTotal = trophies.filter((t) => t.missable).length;
  $('missableCount').textContent = String(missableTotal);
}

function renderChecklist() {
  const list = $('trophyList');
  list.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  for (const trophy of shown) list.append(buildTrophyRow(trophy));
  $('resultCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (state.earned.size ? ` · ${state.earned.size} earned` : '');
  const empty = $('emptyState');
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = state.kind === 'online'
      ? 'No online trophies — every trophy in this list is earned in single-player. There is nothing to track here.'
      : 'No trophies match these filters. Clear the search or pick another kind.';
  } else {
    empty.hidden = true;
  }
}

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const got = members.filter(isEarned).length;
    const item = document.createElement('li');
    item.className = 'stage';
    const heading = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = String(stage.n);
    heading.append(num, document.createTextNode(` ${stage.title}`));
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const ul = document.createElement('ul');
    for (const trophy of members) {
      const row = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = isEarned(trophy) ? 'done' : 'togo';
      mark.textContent = isEarned(trophy) ? '✓' : '○';
      const label = document.createElement('span');
      label.textContent = isStoryHidden(trophy) ? 'Hidden story trophy' : trophy.name;
      if (trophy.missable) {
        const flag = document.createElement('strong');
        flag.textContent = ' — missable';
        label.append(flag);
      }
      row.append(mark, label);
      row.addEventListener('click', () => openDetail(trophy.id));
      row.style.cursor = 'pointer';
      ul.append(row);
    }
    const progress = document.createElement('p');
    progress.className = 'stage-progress';
    progress.textContent = `Stage ${stage.n}: ${got} of ${members.length} earned`;
    item.append(heading, blurb, ul, progress);
    list.append(item);
  }
}

function renderMissables() {
  const list = $('missableList');
  list.replaceChildren();
  for (const trophy of trophies.filter((t) => t.missable)) list.append(buildTrophyRow(trophy));
}

function renderDetail() {
  const trophy = state.detailId == null ? null : trophyById(state.detailId);
  const panel = $('detailPanel');
  const backdrop = $('detailBackdrop');
  const body = $('detailBody');
  if (!trophy) {
    panel.hidden = true;
    backdrop.hidden = true;
    return;
  }
  body.replaceChildren();
  panel.hidden = false;
  backdrop.hidden = false;

  const medal = document.createElement('span');
  medal.className = `medal ${trophy.grade}`;
  medal.textContent = medalLetter(trophy.grade);
  body.append(medal);

  const title = document.createElement('h2');
  title.textContent = isStoryHidden(trophy) ? 'Hidden story trophy' : trophy.name;
  body.append(title);

  const official = document.createElement('p');
  official.className = 'official-desc';
  official.textContent = isStoryHidden(trophy)
    ? 'The name and official description are hidden by your spoiler setting until you earn this trophy.'
    : `Official description: “${trophy.description}”`;
  body.append(official);

  const tags = document.createElement('div');
  tags.className = 'detail-tags';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag grade-${trophy.grade}`;
  gradeTag.textContent = trophy.grade;
  tags.append(gradeTag);
  for (const kind of kindTags(trophy)) {
    const tag = document.createElement('span');
    tag.className = 'tag' + (kind === 'missable' ? ' missable' : '');
    tag.textContent = kind === 'missable' ? '⚠ MISSABLE' : KIND_LABELS[kind];
    tags.append(tag);
  }
  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = `Roadmap stage ${trophy.stage}: ${ROADMAP_STAGES[trophy.stage - 1].title}`;
  tags.append(stageTag);
  body.append(tags);

  if (trophy.target != null) {
    const target = document.createElement('p');
    target.className = 'target-line';
    target.textContent = `PSN target: ${trophy.target.toLocaleString('en-US')} ${trophy.targetUnit}.`;
    body.append(target);
  }

  if (trophy.missable) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = `Missable? ${trophy.missableNote}`;
    body.append(note);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  body.append(guideHeading);
  if (isStoryHidden(trophy)) {
    const hidden = document.createElement('p');
    hidden.textContent = 'The guide is hidden with the spoiler setting. Earn this trophy (or turn the spoiler setting off) to read it.';
    body.append(hidden);
  } else {
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    body.append(guide);
  }

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  body.append(sourcesHeading);
  const sources = document.createElement('ul');
  sources.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    item.append(link);
    sources.append(item);
  }
  body.append(sources);

  const earnedLine = document.createElement('label');
  earnedLine.className = 'earned-line';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy);
  box.addEventListener('change', () => toggleEarned(trophy, box.checked));
  earnedLine.append(box, document.createTextNode(' I have earned this trophy'));
  body.append(earnedLine);
}

function openDetail(id) {
  state.detailId = id;
  renderDetail();
  history.replaceState(null, '', `#/trophy/${id}`);
  $('detailPanel').scrollTop = 0;
}

function closeDetail() {
  state.detailId = null;
  renderDetail();
  history.replaceState(null, '', `#/${state.view}`);
}

function showView(view) {
  state.view = view;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('active', section.id === `view-${view}`);
  }
  if (state.detailId != null) closeDetail();
  history.replaceState(null, '', `#/${view}`);
  window.scrollTo(0, 0);
}

function applyHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('trophy/')) {
    const id = Number(hash.slice('trophy/'.length));
    if (trophyById(id)) {
      showView('checklist');
      openDetail(id);
      return;
    }
  }
  const views = ['checklist', 'roadmap', 'missables', 'about'];
  showView(views.includes(hash) ? hash : 'checklist');
}

function downloadFile(filename, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportProgress() {
  downloadFile(
    'gta6-trophy-progress.json',
    JSON.stringify(
      { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...state.earned].sort() },
      null,
      2,
    ),
  );
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('not a progress file');
    const known = new Set(trophies.map((t) => t.name));
    const imported = names.filter((n) => known.has(n));
    state.earned = new Set(imported);
    saveStoredState();
    renderProgress();
    renderChecklist();
    renderRoadmap();
    renderMissables();
    if (state.detailId != null) renderDetail();
    $('resultCount').textContent = `Imported ${imported.length} earned trophies` +
      (names.length !== imported.length ? ` (${names.length - imported.length} names were not in the list)` : '');
  } catch {
    $('resultCount').textContent = 'That file could not be imported — it is not a progress file from this guide.';
  }
}

function resetProgress() {
  if (!window.confirm('Clear all earned trophies and the spoiler setting?')) return;
  state.earned = new Set();
  state.spoiler = false;
  $('spoilerToggle').checked = false;
  saveStoredState();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderMissables();
}

function wireControls() {
  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', () => showView(button.dataset.view));
  }
  $('searchInput').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderChecklist();
  });
  for (const chip of document.querySelectorAll('.chip')) {
    chip.addEventListener('click', () => {
      state.kind = chip.dataset.kind;
      for (const other of document.querySelectorAll('.chip')) {
        other.classList.toggle('active', other === chip);
      }
      renderChecklist();
    });
  }
  $('gradeSelect').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderChecklist();
  });
  $('statusSelect').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderChecklist();
  });
  $('spoilerToggle').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveStoredState();
    renderChecklist();
    renderRoadmap();
    renderMissables();
    if (state.detailId != null) renderDetail();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', resetProgress);
  $('detailClose').addEventListener('click', closeDetail);
  $('detailBackdrop').addEventListener('click', closeDetail);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.detailId != null) closeDetail();
  });
  window.addEventListener('hashchange', applyHash);
}

async function bootGuide() {
  loadStoredState();
  const response = await fetch(DATA_URL);
  const doc = await response.json();
  trophies = doc.trophies;
  $('spoilerToggle').checked = state.spoiler;
  wireControls();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  applyHash();
}

bootGuide();
