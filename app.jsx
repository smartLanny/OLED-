const { useState, useEffect, useLayoutEffect, useRef } = React;
const gray = value => `rgb(${value}, ${value}, ${value})`;
const PRESETS = [
  ['极低灰阶', 0, 15], ['低灰阶', 0, 25], ['中低灰阶', 0, 50],
  ['夜间模式', 18, 220], ['白底黑字', 255, 0],
];
const AREAS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const TEXTS = ['The quick brown fox jumps over the lazy dog. 0123456789', '天地玄黄 宇宙洪荒 日月盈昃 辰宿列张', 'OLED BLACK SMEAR / 灰阶响应观察'];
const PATTERNS = [
  ['gradient', '全灰阶渐变', 'G0 → G255'], ['dark', '近黑渐变', 'G0 → G64'],
  ['expanded', '暗部展开渐变', '非线性分布'], ['steps', '近黑分档', 'G0 · 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48'],
  ['spectrum', '六色渐变', 'RGBCMY → 黑'], ['solid', '纯色检查', '坏点 / 色斑 / 均匀性'],
];
const SOLIDS = [['黑', '#000000'], ['白', '#ffffff'], ['红', '#ff0000'], ['绿', '#00ff00'], ['蓝', '#0000ff'], ['灰', '#808080']];

function Icon({ name }) {
  const shapes = {
    settings: <><path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h2m4 0h10" /><circle cx="10" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    text: <path d="M5 7V4h14v3M12 4v16m-4 0h8" />,
    block: <rect x="4" y="5" width="16" height="14" rx="2" />,
    back: <path d="m14 6-6 6 6 6M8 12h13" />,
    right: <path d="M3 12h17m-6-6 6 6-6 6" />,
    up: <path d="M12 21V4m-6 6 6-6 6 6" />,
    down: <path d="M12 3v17m-6-6 6 6 6-6" />,
    next: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    move: <><path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" strokeWidth="3" /></>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    collapse: <path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5" />,
  };
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}
const MENU_TESTS = [
  { id: 'smear', title: '拖影测试', position: '0%' },
  { id: 'pattern', title: '色阶与纯色', position: '50%' },
  { id: 'apl', title: 'APL 窗口', position: '100%' },
];

function Choice({ active, children, ...props }) {
  return <button type="button" aria-pressed={active} className={active ? 'choice selected' : 'choice'} {...props}>{children}</button>;
}
function Level({ label, value, onChange }) {
  const id = React.useId();
  return <div className="level">
    <div className="level-heading"><label htmlFor={id}>{label}</label>
      <input type="number" inputMode="numeric" aria-label={`${label}数值`} min="0" max="255" step="1" value={value}
        onChange={e => { if (e.target.value !== '') onChange(Math.max(0, Math.min(255, Math.round(Number(e.target.value))))); }} /></div>
    <input id={id} type="range" min="0" max="255" step="1" value={value} onChange={e => onChange(Number(e.target.value))} />
  </div>;
}

// Double-tap opens the complete floating panel; its visibility controls motion.
function TestShell({ title, tone, onExit, children, controls, help }) {
  const [visible, setVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [notice, setNotice] = useState('');
  const [panelPosition, setPanelPosition] = useState(null);
  const shellRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const lastTap = useRef(null);
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);

  const clampPosition = position => {
    const shell = shellRef.current, panel = panelRef.current;
    return {
      x: Math.max(12, Math.min(position.x, shell.clientWidth - panel.offsetWidth - 12)),
      y: Math.max(12, Math.min(position.y, shell.clientHeight - panel.offsetHeight - 12)),
    };
  };
  useLayoutEffect(() => {
    if (!visible) return;
    const fit = () => setPanelPosition(previous => {
      const next = clampPosition(previous || { x: shellRef.current.clientWidth, y: 16 });
      return previous?.x === next.x && previous?.y === next.y ? previous : next;
    });
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(shellRef.current);
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    const key = e => {
      if (e.target.closest('input, select, textarea') || e.repeat) return;
      if (e.code === 'KeyH') { setVisible(v => !v); document.activeElement?.blur(); }
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', changed); };
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else { setNotice('浏览器不支持全屏，可添加到主屏幕后打开。'); return; }
      setNotice('');
    } catch { setNotice('暂时无法全屏，可继续测试。'); }
  };
  const pointerDown = e => {
    suppressClick.current = false;
    if (!e.isPrimary || e.button !== 0 || e.target.closest('[data-controls]')) { pointerStart.current = null; lastTap.current = null; return; }
    pointerStart.current = { x: e.clientX, y: e.clientY, time: performance.now(), id: e.pointerId };
  };
  const pointerUp = e => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== e.pointerId || e.target.closest('[data-controls]')) return;
    const now = performance.now();
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12 || now - start.time > 350) { lastTap.current = null; return; }
    const previous = lastTap.current;
    if (previous && now - previous.time < 350 && Math.hypot(e.clientX - previous.x, e.clientY - previous.y) < 30) {
      // A compatibility mouse event must not focus or activate a newly shown control.
      suppressClick.current = true;
      setVisible(v => !v); lastTap.current = null;
    } else lastTap.current = { x: e.clientX, y: e.clientY, time: now };
  };
  const startDrag = e => {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: panelRef.current.offsetLeft, top: panelRef.current.offsetTop };
  };
  const moveDrag = e => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    setPanelPosition(clampPosition({ x: drag.left + e.clientX - drag.x, y: drag.top + e.clientY - drag.y }));
  };
  const moveByKey = e => {
    const offsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (!offsets[e.key]) return;
    e.preventDefault();
    const [dx, dy] = offsets[e.key];
    setPanelPosition(clampPosition({ x: panelRef.current.offsetLeft + dx, y: panelRef.current.offsetTop + dy }));
  };
  return <main className={`test-shell tone-${tone}`} ref={shellRef}
    onMouseDownCapture={e => { if (suppressClick.current) e.preventDefault(); }}
    onClickCapture={e => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
    onPointerDown={pointerDown} onPointerUp={pointerUp}
    onPointerCancel={() => { pointerStart.current = null; lastTap.current = null; }}>
    {typeof children === 'function' ? children(visible) : children}
    {visible && <aside className="panel" data-controls="true" ref={panelRef} aria-label={`${title}控制台`}
      style={panelPosition ? { left: panelPosition.x, top: panelPosition.y, right: 'auto' } : undefined}>
      <header className="panel-header">
        <button className="panel-drag" aria-label={`拖动${title}面板`} title="拖动面板，或用方向键移动"
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }} onLostPointerCapture={() => { dragRef.current = null; }} onKeyDown={moveByKey}>
          <Icon name="settings" /><span>{title}</span>
        </button>
        <button className="icon-button" onClick={onExit} aria-label="返回菜单"><Icon name="back" /></button>
        <button className="icon-button" aria-label="收起面板" onClick={() => { setVisible(false); document.activeElement?.blur(); }}><Icon name="close" /></button>
      </header>
      <div className="panel-content">{controls}
        <div className="test-tools"><button onClick={toggleFullscreen}><Icon name={fullscreen ? 'collapse' : 'expand'} />{fullscreen ? '退出全屏' : '全屏'}</button></div>
        {notice && <p role="status" className="hint">{notice}</p>}
        <details className="help"><summary>使用帮助</summary><p>双击空白处打开或收起面板；打开时滚动自动暂停，收起后继续。拖动标题可移动面板。</p>{help}<p>对比时固定系统亮度与色温。H 显示控制，Esc 返回。</p></details>
      </div>
    </aside>}
  </main>;
}

function SmearRunner({ state }) {
  const track = useRef(null);
  const unit = useRef(null);
  const position = useRef(0);
  const [size, setSize] = useState(0);
  const vertical = state.vertical;
  const offsetAt = distance => state.reverse ? -distance : -size + distance;
  useLayoutEffect(() => {
    position.current = 0;
    const measure = () => {
      const rect = unit.current.getBoundingClientRect();
      setSize(vertical ? rect.height : rect.width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(unit.current);
    return () => observer.disconnect();
  }, [vertical, state.mode, state.fontSize]);
  useLayoutEffect(() => {
    if (!size) return;
    position.current %= size;
    const offset = offsetAt(position.current % size);
    track.current.style.transform = vertical ? `translate3d(0,${offset}px,0)` : `translate3d(${offset}px,0,0)`;
  }, [size, vertical, state.reverse, state.mode, state.fontSize]);
  useEffect(() => {
    let frame;
    let last = null;
    const draw = time => {
      if (last !== null) {
        // Avoid a large discontinuity after the tab or device has suspended.
        const dt = (time - last) / 1000;
        if (dt < 0.25) position.current = (position.current + state.speed * dt) % size;
      }
      last = time;
      const offset = offsetAt(position.current);
      track.current.style.transform = vertical ? `translate3d(0,${offset}px,0)` : `translate3d(${offset}px,0,0)`;
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      cancelAnimationFrame(frame); last = null;
      if (state.isPlaying && size > 0 && !document.hidden) frame = requestAnimationFrame(draw);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', sync); };
  }, [state.isPlaying, state.speed, state.reverse, size, vertical]);
  return <div className="test-surface smear-surface" style={{ background: gray(state.bg), color: gray(state.fg) }}>
    <div ref={track} className={`smear-track ${vertical ? 'vertical' : 'horizontal'}`} aria-hidden="true">
      {[0, 1].map(copy => <div className="smear-unit" key={copy} ref={copy === 0 ? unit : null}>
        {[0, 1, 2].map(i => state.mode === 'block'
          ? <div className="smear-block" key={i} style={{ background: gray(state.fg) }} />
          : <div className="smear-text" key={i} style={{ fontSize: state.fontSize }}>{TEXTS.map(text => <p key={text}>{text}</p>)}</div>)}
      </div>)}
    </div>
  </div>;
}
function SmearTest({ onExit }) {
  const [vertical, setVertical] = useState(() => !window.matchMedia('(orientation: landscape)').matches);
  useEffect(() => {
    const orientation = window.matchMedia('(orientation: landscape)');
    const changed = () => setVertical(!orientation.matches);
    changed();
    orientation.addEventListener('change', changed);
    return () => orientation.removeEventListener('change', changed);
  }, []);
  const [state, setState] = useState({ speed: 480, mode: 'text', reverse: false, bg: 0, fg: 25, fontSize: 40 });
  const update = patch => setState(s => ({ ...s, ...patch }));
  return <TestShell tone="smear" title="拖影测试" onExit={onExit} help={<p>竖屏上下滚动，横屏左右滚动。速度单位为 CSS 像素 / 秒。此页面用于目视观察，不直接测量响应时间或刷新率。</p>} controls={<>
    <fieldset><legend>滚动速度 · px/s</legend><div className="choices two">{[[240, '慢速'], [480, '中速'], [960, '高速'], [1920, '极速']].map(([speed, label]) => <Choice key={speed} active={speed === state.speed} onClick={() => update({ speed })}>{label} ({speed})</Choice>)}</div></fieldset>
    <fieldset><legend>滚动方向</legend><div className="choices two"><Choice active={!state.reverse} onClick={() => update({ reverse: false })}><span className="icon-label"><Icon name={vertical ? 'down' : 'right'} />{vertical ? '向下' : '向右'}</span></Choice><Choice active={state.reverse} onClick={() => update({ reverse: true })}><span className="icon-label"><Icon name={vertical ? 'up' : 'back'} />{vertical ? '向上' : '向左'}</span></Choice></div></fieldset>
    <fieldset><legend>内容</legend><div className="choices two"><Choice active={state.mode === 'text'} onClick={() => update({ mode: 'text' })}><span className="icon-label"><Icon name="text" />文字</span></Choice><Choice active={state.mode === 'block'} onClick={() => update({ mode: 'block' })}><span className="icon-label"><Icon name="block" />纯色方块</span></Choice></div></fieldset>
    {state.mode === 'text' && <label className="select-label">字号<select value={state.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })}>{[24, 40, 64].map(v => <option key={v} value={v}>{v} CSS px</option>)}</select></label>}
    <fieldset><legend>灰阶预设 · 背景 / 前景</legend><div className="choices preset-choices">{PRESETS.map(([label, bg, fg]) => <Choice key={label} active={state.bg === bg && state.fg === fg} onClick={() => update({ bg, fg })}><span>{label} <span className="preset-values">(G{bg}/G{fg})</span></span><span className="swatches" aria-hidden="true"><i style={{ background: gray(bg) }} /><i style={{ background: gray(fg) }} /></span></Choice>)}</div></fieldset>
    <section className="manual-levels" aria-label="手动微调"><p className="section-label">手动微调 · 0–255</p><Level label="背景灰阶" value={state.bg} onChange={bg => update({ bg })} /><Level label="前景灰阶" value={state.fg} onChange={fg => update({ fg })} /></section>
    {state.bg === state.fg && <p className="hint">前景与背景相同，当前没有可见边缘。</p>}

  </>}>{panelOpen => <SmearRunner state={{ ...state, vertical, isPlaying: !panelOpen }} />}</TestShell>;
}

function PatternTest({ onExit }) {
  const [pattern, setPattern] = useState('gradient');
  const [solid, setSolid] = useState('#000000');
  const backgrounds = {
    gradient: 'linear-gradient(to bottom, #000, #fff)', dark: 'linear-gradient(to bottom, #000, #404040)',
    expanded: 'linear-gradient(to bottom, #000 0%, #050505 10%, #0f0f0f 20%, #1e1e1e 30%, #333 40%, #4d4d4d 50%, #707070 60%, #909090 70%, #b0b0b0 80%, #d0d0d0 90%, #fff 100%)', solid,
  };
  return <TestShell tone="pattern" title="色阶与纯色" onExit={onExit} help={<p>近黑分档从上到下：G0、1、2、3、4、6、8、12、16、24、32、48。隐藏面板后观察。</p>} controls={<>
    <fieldset><legend>图案</legend><div className="choices two">{PATTERNS.map(([id, title]) => <Choice key={id} active={pattern === id} onClick={() => setPattern(id)}><span>{title}</span></Choice>)}</div></fieldset>
    {pattern === 'solid' && <fieldset><legend>纯色</legend><div className="choices three">{SOLIDS.map(([name, value]) => <Choice key={name} active={solid === value} onClick={() => setSolid(value)}><span className="solid-label"><i className="color-dot" style={{ background: value }} aria-hidden="true" />{name}</span></Choice>)}</div><label className="select-label">自定义颜色<input aria-label="自定义颜色" type="color" value={solid} onChange={e => setSolid(e.target.value)} /></label></fieldset>}
  </>}>
    <div className="test-surface pattern-surface" data-pattern={pattern} style={{ background: backgrounds[pattern] || '#000' }}>
      {pattern === 'steps' && <div className="gray-steps">{[0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48].map(value => <div key={value} style={{ background: gray(value) }} />)}</div>}
      {pattern === 'spectrum' && <div className="spectrum">{['#f00', '#0f0', '#00f', '#0ff', '#f0f', '#ff0'].map(color => <div key={color} style={{ background: `linear-gradient(to bottom, ${color}, #000)` }} />)}</div>}
    </div>
  </TestShell>;
}

function APLTest({ onExit }) {
  const [area, setArea] = useState(10);
  const [box, setBox] = useState(255);
  const [background, setBackground] = useState(0);
  const surface = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const { width, height } = surface.current.getBoundingClientRect();
      const target = width * height * area / 100;
      const side = Math.sqrt(target);
      const w = Math.min(side, width);
      const h = Math.min(target / w, height);
      setDimensions({ width: target / h, height: h });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, [area]);
  const signalMean = (area / 100 * box + (1 - area / 100) * background) / 255 * 100;
  return <TestShell tone="apl" title="APL 窗口" onExit={onExit} help={<><p>面积以当前网页区域为分母。测量前收起面板，避免面板自身发光影响读数。</p><p>平均信号电平按 8 位码值与面积加权，不是实测亮度或线性光 APL。</p></>} controls={<>
    <fieldset><legend>窗口面积比例</legend><div className="choices area-choices">{AREAS.map(value => <Choice key={value} active={value === area} onClick={() => setArea(value)}>{value}%</Choice>)}</div></fieldset>
    <section className="manual-levels" aria-label="灰阶调整"><Level label="窗口灰阶" value={box} onChange={setBox} /><Level label="底色灰阶" value={background} onChange={setBackground} /></section>
    <div className="metric"><span>平均信号电平</span><output>{signalMean.toFixed(2)}%</output></div>
  </>}><div className="test-surface apl-surface" ref={surface} style={{ background: gray(background) }}><div className="apl-window" style={{ ...dimensions, background: gray(box) }} /></div></TestShell>;
}

function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let disposed = false;
    let lock = null;
    let requesting = false;
    const acquire = async () => {
      if (document.hidden || lock || requesting) return;
      requesting = true;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (disposed || document.hidden) await next.release();
        else { lock = next; next.addEventListener('release', () => { if (lock === next) lock = null; }); }
      } catch { /* Plain HTTP and power-saving modes may deny wake lock. */ }
      finally { requesting = false; }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => { disposed = true; document.removeEventListener('visibilitychange', acquire); lock?.release().catch(() => {}); };
  }, [active]);
}
function App() {
  const [view, setView] = useState('menu');
  const exit = () => {
    setView('menu');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  const enter = id => {
    setView(id);
    // Fullscreen must be requested during this user gesture. Unsupported browsers stay usable.
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };
  useWakeLock(view !== 'menu');
  useEffect(() => {
    const key = e => { if (e.code === 'Escape') exit(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return <div className="app">
    {view === 'menu' && <main className="menu"><div className="menu-inner">
      <h1>装机宅OLED测试</h1>
      <div className="test-cards">
        {MENU_TESTS.map(test => <button key={test.id} className={`test-card tone-${test.id}`} onClick={() => enter(test.id)}>
          <span className="test-art" aria-hidden="true" style={{ backgroundPosition: `${test.position} center` }} />
          <span className="card-title">{test.title}</span><Icon name="next" />
        </button>)}
      </div>
      <p className="gesture-hint">双击画面，调出控制面板</p>
    </div></main>}
    {view === 'smear' && <SmearTest onExit={exit} />}
    {view === 'pattern' && <PatternTest onExit={exit} />}
    {view === 'apl' && <APLTest onExit={exit} />}
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
