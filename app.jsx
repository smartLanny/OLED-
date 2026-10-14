const { useState, useEffect, useLayoutEffect, useRef } = React;
const gray = value => `rgb(${value}, ${value}, ${value})`;
const PRESETS = [
  ['近黑 G0 / G15', 0, 15], ['近黑 G0 / G25', 0, 25], ['低灰 G0 / G50', 0, 50],
  ['夜间 G18 / G220', 18, 220], ['白底 G255 / G0', 255, 0],
];
const AREAS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const TEXTS = ['The quick brown fox jumps over the lazy dog. 0123456789', '天地玄黄 宇宙洪荒 日月盈昃 辰宿列张', 'OLED BLACK SMEAR / 灰阶响应观察'];
const PATTERNS = [
  ['gradient', '全灰阶渐变', 'G0 → G255'], ['dark', '近黑渐变', 'G0 → G64'],
  ['expanded', '暗部展开渐变', '非线性分布'], ['steps', '近黑分档', 'G0 · 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48'],
  ['spectrum', '六色渐变', 'RGBCMY → 黑'], ['solid', '纯色检查', '坏点 / 色斑 / 均匀性'],
];
const SOLIDS = [['黑', '#000000'], ['白', '#ffffff'], ['红', '#ff0000'], ['绿', '#00ff00'], ['蓝', '#0000ff'], ['灰', '#808080']];

// All UI icons share one local 24 px grid; no icon font or network asset.
function Icon({ name, className = '' }) {
  const shapes = {
    motion: <><path d="M3 8h4M2 12h5M3 16h4" opacity=".5" /><rect x="10" y="6" width="10" height="12" rx="2" /><path d="M14 9v6" opacity=".45" /></>,
    gradation: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 7v10" opacity=".25" /><path d="M12 7v10" opacity=".55" /><path d="M17 7v10" /></>,
    window: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" /></>,
    back: <path d="m14 6-6 6 6 6M8 12h13" />,
    down: <path d="M12 3v17m-6-6 6 6 6-6" />,
    next: <path d="m9 5 7 7-7 7" />,
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
    hide: <><path d="m3 3 18 18M10.6 5.1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.6M6.2 6.2A22 22 0 0 0 2 12s4 7 10 7c1.8 0 3.4-.6 4.8-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    collapse: <path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  };
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}
const MENU_TESTS = [
  { id: 'smear', icon: 'motion', tone: 'violet', category: '动态响应', title: '拖影测试', description: <>低灰文字与方块<br />比较不同速度下的拖影</> },
  { id: 'pattern', icon: 'gradation', tone: 'green', category: '色阶检查', title: '色阶与纯色', description: <>近黑层次与颜色过渡<br />检查坏点、色斑与均匀性</> },
  { id: 'apl', icon: 'window', tone: 'amber', category: '亮度窗口', title: 'APL 窗口', description: <>1–100% 面积窗口<br />观察画面面积对亮度的影响</> },
];

function Choice({ active, children, ...props }) {
  return <button type="button" aria-pressed={active} className={active ? 'choice selected' : 'choice'} {...props}>{children}</button>;
}
function Level({ label, value, onChange }) {
  const id = React.useId();
  return <div className="level"><label htmlFor={id}>{label}<output>G{value}</output></label>
    <div className="level-inputs"><input id={id} type="range" min="0" max="255" step="1" value={value} onChange={e => onChange(Number(e.target.value))} />
      <input type="number" aria-label={`${label}数值`} min="0" max="255" step="1" value={value}
        onChange={e => { if (e.target.value !== '') onChange(Math.max(0, Math.min(255, Math.round(Number(e.target.value))))); }} /></div></div>;
}

// A test surface stays entirely clean when controls are hidden. Restore with two taps or H.
function TestShell({ title, onExit, children, controls, onSpace, footer }) {
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [notice, setNotice] = useState('');
  const lastTap = useRef(null);
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const key = e => {
      if (e.target.closest('input, select, textarea') || e.repeat) return;
      if (e.code === 'KeyH') { setVisible(v => !v); document.activeElement?.blur(); }
      if (e.code === 'Space' && onSpace && !e.target.closest('button')) { e.preventDefault(); onSpace(); }
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', changed); };
  }, [onSpace]);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else { setNotice('此浏览器不支持网页全屏，可添加到主屏幕后打开。'); return; }
      setNotice('');
    } catch { setNotice('未能进入全屏，请检查浏览器权限；仍可继续测试。'); }
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
      // The synthesized touch click may hit a newly restored control. Consume it.
      suppressClick.current = true;
      setVisible(v => !v); lastTap.current = null;
    } else lastTap.current = { x: e.clientX, y: e.clientY, time: now };
  };
  return <main className="test-shell" onMouseDownCapture={e => { if (suppressClick.current) e.preventDefault(); }} onClickCapture={e => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { pointerStart.current = null; lastTap.current = null; }}>
    {children}
    {visible && <aside className="panel" data-controls="true" aria-label={`${title}控制台`}>
      <header className="panel-header"><button className="icon-button" onClick={onExit} aria-label="返回菜单"><Icon name="back" /></button><h1>{title}</h1>
        <button className="quiet-button" onClick={() => { setVisible(false); document.activeElement?.blur(); }}><Icon name="hide" />隐藏控制</button></header>
      <div className="panel-content">{controls}
        <div className="test-tools"><button onClick={toggleFullscreen}><Icon name={fullscreen ? 'collapse' : 'expand'} />{fullscreen ? '退出全屏' : '进入全屏'}</button></div>
        {notice && <p role="status" className="hint">{notice}</p>}
        <p className="hint">双击空白画面或按 H 隐藏 / 恢复控制。{footer}按 Esc 返回菜单。</p>
      </div>
    </aside>}
  </main>;
}

function SmearRunner({ state }) {
  const track = useRef(null);
  const unit = useRef(null);
  const position = useRef(0);
  const [size, setSize] = useState(0);
  const vertical = state.direction === 'vertical';
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
    const offset = vertical ? -size + position.current % size : -(position.current % size);
    track.current.style.transform = vertical ? `translate3d(0,${offset}px,0)` : `translate3d(${offset}px,0,0)`;
  }, [size, vertical, state.mode, state.fontSize]);
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
      const offset = vertical ? -size + position.current : -position.current;
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
  }, [state.isPlaying, state.speed, size, vertical]);
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
  const [state, setState] = useState({ isPlaying: true, speed: 480, mode: 'text', direction: 'horizontal', bg: 0, fg: 25, fontSize: 40 });
  const update = patch => setState(s => ({ ...s, ...patch }));
  const pause = () => setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  return <TestShell title="拖影测试" onExit={onExit} onSpace={pause} footer="空格暂停 / 播放。" controls={<>
    <button className="primary full-width" onClick={pause}><Icon name={state.isPlaying ? 'pause' : 'play'} />{state.isPlaying ? '暂停滚动' : '开始滚动'}</button>
    <fieldset><legend>滚动速度 · CSS 像素 / 秒</legend><div className="choices two">{[240, 480, 960, 1920].map(speed => <Choice key={speed} active={speed === state.speed} onClick={() => update({ speed })}>{speed} px/s</Choice>)}</div></fieldset>
    <fieldset><legend>方向</legend><div className="choices two"><Choice active={state.direction === 'horizontal'} onClick={() => update({ direction: 'horizontal' })}><span className="icon-label"><Icon name="back" />向左</span></Choice><Choice active={state.direction === 'vertical'} onClick={() => update({ direction: 'vertical' })}><span className="icon-label"><Icon name="down" />向下</span></Choice></div></fieldset>
    <fieldset><legend>内容</legend><div className="choices two"><Choice active={state.mode === 'text'} onClick={() => update({ mode: 'text' })}>文字</Choice><Choice active={state.mode === 'block'} onClick={() => update({ mode: 'block' })}>纯色方块</Choice></div></fieldset>
    {state.mode === 'text' && <label className="select-label">字号<select value={state.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })}>{[24, 40, 64].map(v => <option key={v} value={v}>{v} CSS px</option>)}</select></label>}
    <fieldset><legend>灰阶预设 · 背景 / 前景</legend><div className="choices">{PRESETS.map(([label, bg, fg]) => <Choice key={label} active={state.bg === bg && state.fg === fg} onClick={() => update({ bg, fg })}>{label}</Choice>)}</div></fieldset>
    <Level label="背景灰阶" value={state.bg} onChange={bg => update({ bg })} /><Level label="前景灰阶" value={state.fg} onChange={fg => update({ fg })} />
    {state.bg === state.fg && <p className="hint">前景与背景相同，当前没有可见边缘。</p>}
    <p className="hint">跟随文字或方块边缘观察。速度使用 CSS 像素，受浏览器帧率影响；本页不测量响应时间或屏幕刷新率。</p>
  </>}><SmearRunner state={state} /></TestShell>;
}

function PatternTest({ onExit }) {
  const [pattern, setPattern] = useState('gradient');
  const [solid, setSolid] = useState('#000000');
  const backgrounds = {
    gradient: 'linear-gradient(to right, #000, #fff)', dark: 'linear-gradient(to right, #000, #404040)',
    expanded: 'linear-gradient(to right, #000 0%, #050505 10%, #0f0f0f 20%, #1e1e1e 30%, #333 40%, #4d4d4d 50%, #707070 60%, #909090 70%, #b0b0b0 80%, #d0d0d0 90%, #fff 100%)', solid,
  };
  return <TestShell title="色阶与纯色" onExit={onExit} controls={<>
    <fieldset><legend>测试图案</legend><div className="choices">{PATTERNS.map(([id, title, desc]) => <Choice key={id} active={pattern === id} onClick={() => setPattern(id)}><span>{title}</span><small>{desc}</small></Choice>)}</div></fieldset>
    {pattern === 'solid' && <fieldset><legend>纯色</legend><div className="choices three">{SOLIDS.map(([name, value]) => <Choice key={name} active={solid === value} onClick={() => setSolid(value)}>{name}</Choice>)}</div><label className="select-label">自定义颜色<input aria-label="自定义颜色" type="color" value={solid} onChange={e => setSolid(e.target.value)} /></label></fieldset>}
    <p className="hint">隐藏控制后再观察，测试区域不保留文字、阴影或按钮。近黑分档从左到右递增；渐变用于目视检查，不代表仪器校准结果。</p>
  </>}>
    <div className="test-surface pattern-surface" data-pattern={pattern} style={{ background: backgrounds[pattern] || '#000' }}>
      {pattern === 'steps' && <div className="gray-steps">{[0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48].map(value => <div key={value} style={{ background: gray(value) }} />)}</div>}
      {pattern === 'spectrum' && <div className="spectrum">{['#f00', '#0f0', '#00f', '#0ff', '#f0f', '#ff0'].map(color => <div key={color} style={{ background: `linear-gradient(to right, ${color}, #000)` }} />)}</div>}
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
  return <TestShell title="APL 窗口" onExit={onExit} controls={<>
    <div className="readout"><span>窗口面积</span><strong>{area}%</strong><span>占当前网页测试区域</span></div>
    <fieldset><legend>窗口面积比例</legend><div className="choices area-choices">{AREAS.map(value => <Choice key={value} active={value === area} onClick={() => setArea(value)}>{value}%</Choice>)}</div></fieldset>
    <Level label="窗口灰阶" value={box} onChange={setBox} /><Level label="底色灰阶" value={background} onChange={setBackground} />
    <div className="metric"><span>平均信号电平</span><output>{signalMean.toFixed(2)}%</output></div>
    <p className="hint">按 8 位 RGB 码值和面积加权计算，不是实测亮度或线性光 APL。白窗黑底时，该值等于窗口面积比例。</p>
    <p className="hint">请隐藏控制后测量：面板也会发光，改变实际平均画面亮度。浏览器工具栏不计入面积；全屏可减少干扰。</p>
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
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const exit = () => setView('menu');
  useWakeLock(view !== 'menu');
  useEffect(() => {
    const key = e => { if (e.code === 'Escape') setView('menu'); };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', changed); };
  }, []);
  return <div className="app">
    {view === 'menu' && <main className="menu"><div className="menu-inner">
      <div className="eyebrow"><span>手机屏幕 · 目视测试</span><span className="offline-badge"><i />离线可用</span></div>
      <h1>装机宅OLED测试</h1>
      <p className="intro">从拖影到暗部层次，选一项开始观察。</p>
      <div className="section-label"><span>屏幕测试</span><span>3 项工具</span></div>
      <div className="test-cards">
        {MENU_TESTS.map((test, index) => <button key={test.id} className={`test-card ${test.tone}`} onClick={() => setView(test.id)}>
          <span className="card-icon"><Icon name={test.icon} /></span>
          <span className="card-copy"><span className="card-category">{test.category}<span className="card-number">0{index + 1}</span></span>
            <span className="card-title">{test.title}</span><span className="card-description">{test.description}</span></span>
          <span className="card-enter"><Icon name="next" /></span>
        </button>)}
      </div>
      <div className="instructions"><div className="instructions-heading"><Icon name="info" /><strong>测试前准备</strong></div>
        <p>固定系统亮度，关闭自动亮度、护眼与自适应色温。对比设备时保持环境与设置一致。</p>
        <div className="gesture-note"><span className="gesture-symbol" aria-hidden="true"><i /><i /></span><span>双击画面，隐藏 / 恢复控制</span></div>
        <details><summary>全屏、常亮与键盘操作</summary><p>进入测试后可选择全屏。局域网 HTTP 若不能保持常亮，请延长手机自动锁屏时间。键盘 H 隐藏 / 恢复控制，Esc 返回菜单。</p></details>
      </div>
      {fullscreen && <button className="quiet-button" onClick={() => document.exitFullscreen().catch(() => {})}><Icon name="collapse" />退出全屏</button>}
      <footer>浏览器目视测试工具 · 不直接测量亮度、频闪或响应时间</footer>
    </div></main>}
    {view === 'smear' && <SmearTest onExit={exit} />}
    {view === 'pattern' && <PatternTest onExit={exit} />}
    {view === 'apl' && <APLTest onExit={exit} />}
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
