function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useLayoutEffect,
  useRef
} = React;
const gray = value => `rgb(${value}, ${value}, ${value})`;
const PRESETS = [['近黑 G0 / G15', 0, 15], ['近黑 G0 / G25', 0, 25], ['低灰 G0 / G50', 0, 50], ['夜间 G18 / G220', 18, 220], ['白底 G255 / G0', 255, 0]];
const AREAS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const TEXTS = ['The quick brown fox jumps over the lazy dog. 0123456789', '天地玄黄 宇宙洪荒 日月盈昃 辰宿列张', 'OLED BLACK SMEAR / 灰阶响应观察'];
const PATTERNS = [['gradient', '全灰阶渐变', 'G0 → G255'], ['dark', '近黑渐变', 'G0 → G64'], ['expanded', '暗部展开渐变', '非线性分布'], ['steps', '近黑分档', 'G0 · 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48'], ['spectrum', '六色渐变', 'RGBCMY → 黑'], ['solid', '纯色检查', '坏点 / 色斑 / 均匀性']];
const SOLIDS = [['黑', '#000000'], ['白', '#ffffff'], ['红', '#ff0000'], ['绿', '#00ff00'], ['蓝', '#0000ff'], ['灰', '#808080']];
function Choice({
  active,
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-pressed": active,
    className: active ? 'choice selected' : 'choice'
  }, props), children);
}
function Level({
  label,
  value,
  onChange
}) {
  const id = React.useId();
  return /*#__PURE__*/React.createElement("div", {
    className: "level"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id
  }, label, /*#__PURE__*/React.createElement("output", null, "G", value)), /*#__PURE__*/React.createElement("div", {
    className: "level-inputs"
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "range",
    min: "0",
    max: "255",
    step: "1",
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": `${label}数值`,
    min: "0",
    max: "255",
    step: "1",
    value: value,
    onChange: e => {
      if (e.target.value !== '') onChange(Math.max(0, Math.min(255, Math.round(Number(e.target.value)))));
    }
  })));
}

// A test surface stays entirely clean when controls are hidden. Restore with two taps or H.
function TestShell({
  title,
  onExit,
  children,
  controls,
  onSpace,
  footer
}) {
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [notice, setNotice] = useState('');
  const lastTap = useRef(null);
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const key = e => {
      if (e.target.closest('input, select, textarea') || e.repeat) return;
      if (e.code === 'KeyH') {
        setVisible(v => !v);
        document.activeElement?.blur();
      }
      if (e.code === 'Space' && onSpace && !e.target.closest('button')) {
        e.preventDefault();
        onSpace();
      }
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', changed);
    };
  }, [onSpace]);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();else {
        setNotice('此浏览器不支持网页全屏，可添加到主屏幕后打开。');
        return;
      }
      setNotice('');
    } catch {
      setNotice('未能进入全屏，请检查浏览器权限；仍可继续测试。');
    }
  };
  const pointerDown = e => {
    suppressClick.current = false;
    if (!e.isPrimary || e.button !== 0 || e.target.closest('[data-controls]')) {
      pointerStart.current = null;
      lastTap.current = null;
      return;
    }
    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      id: e.pointerId
    };
  };
  const pointerUp = e => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== e.pointerId || e.target.closest('[data-controls]')) return;
    const now = performance.now();
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12 || now - start.time > 350) {
      lastTap.current = null;
      return;
    }
    const previous = lastTap.current;
    if (previous && now - previous.time < 350 && Math.hypot(e.clientX - previous.x, e.clientY - previous.y) < 30) {
      // The synthesized touch click may hit a newly restored control. Consume it.
      suppressClick.current = true;
      setVisible(v => !v);
      lastTap.current = null;
    } else lastTap.current = {
      x: e.clientX,
      y: e.clientY,
      time: now
    };
  };
  return /*#__PURE__*/React.createElement("main", {
    className: "test-shell",
    onMouseDownCapture: e => {
      if (suppressClick.current) e.preventDefault();
    },
    onClickCapture: e => {
      if (suppressClick.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
      }
    },
    onPointerDown: pointerDown,
    onPointerUp: pointerUp,
    onPointerCancel: () => {
      pointerStart.current = null;
      lastTap.current = null;
    }
  }, children, visible && /*#__PURE__*/React.createElement("aside", {
    className: "panel",
    "data-controls": "true",
    "aria-label": `${title}控制台`
  }, /*#__PURE__*/React.createElement("header", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    onClick: onExit,
    "aria-label": "\u8FD4\u56DE\u83DC\u5355"
  }, "\u2190"), /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("button", {
    className: "quiet-button",
    onClick: () => {
      setVisible(false);
      document.activeElement?.blur();
    }
  }, "\u9690\u85CF\u63A7\u5236")), /*#__PURE__*/React.createElement("div", {
    className: "panel-content"
  }, controls, /*#__PURE__*/React.createElement("div", {
    className: "test-tools"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleFullscreen
  }, fullscreen ? '退出全屏' : '进入全屏')), notice && /*#__PURE__*/React.createElement("p", {
    role: "status",
    className: "hint"
  }, notice), /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, "\u53CC\u51FB\u7A7A\u767D\u753B\u9762\u6216\u6309 H \u9690\u85CF / \u6062\u590D\u63A7\u5236\u3002", footer, "\u6309 Esc \u8FD4\u56DE\u83DC\u5355\u3002"))));
}
function SmearRunner({
  state
}) {
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
      cancelAnimationFrame(frame);
      last = null;
      if (state.isPlaying && size > 0 && !document.hidden) frame = requestAnimationFrame(draw);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [state.isPlaying, state.speed, size, vertical]);
  return /*#__PURE__*/React.createElement("div", {
    className: "test-surface smear-surface",
    style: {
      background: gray(state.bg),
      color: gray(state.fg)
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: track,
    className: `smear-track ${vertical ? 'vertical' : 'horizontal'}`,
    "aria-hidden": "true"
  }, [0, 1].map(copy => /*#__PURE__*/React.createElement("div", {
    className: "smear-unit",
    key: copy,
    ref: copy === 0 ? unit : null
  }, [0, 1, 2].map(i => state.mode === 'block' ? /*#__PURE__*/React.createElement("div", {
    className: "smear-block",
    key: i,
    style: {
      background: gray(state.fg)
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "smear-text",
    key: i,
    style: {
      fontSize: state.fontSize
    }
  }, TEXTS.map(text => /*#__PURE__*/React.createElement("p", {
    key: text
  }, text))))))));
}
function SmearTest({
  onExit
}) {
  const [state, setState] = useState({
    isPlaying: true,
    speed: 480,
    mode: 'text',
    direction: 'horizontal',
    bg: 0,
    fg: 25,
    fontSize: 40
  });
  const update = patch => setState(s => ({
    ...s,
    ...patch
  }));
  const pause = () => setState(s => ({
    ...s,
    isPlaying: !s.isPlaying
  }));
  return /*#__PURE__*/React.createElement(TestShell, {
    title: "\u62D6\u5F71\u6D4B\u8BD5",
    onExit: onExit,
    onSpace: pause,
    footer: "\u7A7A\u683C\u6682\u505C / \u64AD\u653E\u3002",
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "primary full-width",
      onClick: pause
    }, state.isPlaying ? '暂停滚动' : '开始滚动'), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u6EDA\u52A8\u901F\u5EA6 \xB7 CSS \u50CF\u7D20 / \u79D2"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, [240, 480, 960, 1920].map(speed => /*#__PURE__*/React.createElement(Choice, {
      key: speed,
      active: speed === state.speed,
      onClick: () => update({
        speed
      })
    }, speed, " px/s")))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u65B9\u5411"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, /*#__PURE__*/React.createElement(Choice, {
      active: state.direction === 'horizontal',
      onClick: () => update({
        direction: 'horizontal'
      })
    }, "\u2190 \u5411\u5DE6"), /*#__PURE__*/React.createElement(Choice, {
      active: state.direction === 'vertical',
      onClick: () => update({
        direction: 'vertical'
      })
    }, "\u2193 \u5411\u4E0B"))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u5185\u5BB9"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, /*#__PURE__*/React.createElement(Choice, {
      active: state.mode === 'text',
      onClick: () => update({
        mode: 'text'
      })
    }, "\u6587\u5B57"), /*#__PURE__*/React.createElement(Choice, {
      active: state.mode === 'block',
      onClick: () => update({
        mode: 'block'
      })
    }, "\u7EAF\u8272\u65B9\u5757"))), state.mode === 'text' && /*#__PURE__*/React.createElement("label", {
      className: "select-label"
    }, "\u5B57\u53F7", /*#__PURE__*/React.createElement("select", {
      value: state.fontSize,
      onChange: e => update({
        fontSize: Number(e.target.value)
      })
    }, [24, 40, 64].map(v => /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, v, " CSS px")))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u7070\u9636\u9884\u8BBE \xB7 \u80CC\u666F / \u524D\u666F"), /*#__PURE__*/React.createElement("div", {
      className: "choices"
    }, PRESETS.map(([label, bg, fg]) => /*#__PURE__*/React.createElement(Choice, {
      key: label,
      active: state.bg === bg && state.fg === fg,
      onClick: () => update({
        bg,
        fg
      })
    }, label)))), /*#__PURE__*/React.createElement(Level, {
      label: "\u80CC\u666F\u7070\u9636",
      value: state.bg,
      onChange: bg => update({
        bg
      })
    }), /*#__PURE__*/React.createElement(Level, {
      label: "\u524D\u666F\u7070\u9636",
      value: state.fg,
      onChange: fg => update({
        fg
      })
    }), state.bg === state.fg && /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u524D\u666F\u4E0E\u80CC\u666F\u76F8\u540C\uFF0C\u5F53\u524D\u6CA1\u6709\u53EF\u89C1\u8FB9\u7F18\u3002"), /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u8DDF\u968F\u6587\u5B57\u6216\u65B9\u5757\u8FB9\u7F18\u89C2\u5BDF\u3002\u901F\u5EA6\u4F7F\u7528 CSS \u50CF\u7D20\uFF0C\u53D7\u6D4F\u89C8\u5668\u5E27\u7387\u5F71\u54CD\uFF1B\u672C\u9875\u4E0D\u6D4B\u91CF\u54CD\u5E94\u65F6\u95F4\u6216\u5C4F\u5E55\u5237\u65B0\u7387\u3002"))
  }, /*#__PURE__*/React.createElement(SmearRunner, {
    state: state
  }));
}
function PatternTest({
  onExit
}) {
  const [pattern, setPattern] = useState('gradient');
  const [solid, setSolid] = useState('#000000');
  const backgrounds = {
    gradient: 'linear-gradient(to right, #000, #fff)',
    dark: 'linear-gradient(to right, #000, #404040)',
    expanded: 'linear-gradient(to right, #000 0%, #050505 10%, #0f0f0f 20%, #1e1e1e 30%, #333 40%, #4d4d4d 50%, #707070 60%, #909090 70%, #b0b0b0 80%, #d0d0d0 90%, #fff 100%)',
    solid
  };
  return /*#__PURE__*/React.createElement(TestShell, {
    title: "\u8272\u9636\u4E0E\u7EAF\u8272",
    onExit: onExit,
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u6D4B\u8BD5\u56FE\u6848"), /*#__PURE__*/React.createElement("div", {
      className: "choices"
    }, PATTERNS.map(([id, title, desc]) => /*#__PURE__*/React.createElement(Choice, {
      key: id,
      active: pattern === id,
      onClick: () => setPattern(id)
    }, /*#__PURE__*/React.createElement("span", null, title), /*#__PURE__*/React.createElement("small", null, desc))))), pattern === 'solid' && /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u7EAF\u8272"), /*#__PURE__*/React.createElement("div", {
      className: "choices three"
    }, SOLIDS.map(([name, value]) => /*#__PURE__*/React.createElement(Choice, {
      key: name,
      active: solid === value,
      onClick: () => setSolid(value)
    }, name))), /*#__PURE__*/React.createElement("label", {
      className: "select-label"
    }, "\u81EA\u5B9A\u4E49\u989C\u8272", /*#__PURE__*/React.createElement("input", {
      "aria-label": "\u81EA\u5B9A\u4E49\u989C\u8272",
      type: "color",
      value: solid,
      onChange: e => setSolid(e.target.value)
    }))), /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u9690\u85CF\u63A7\u5236\u540E\u518D\u89C2\u5BDF\uFF0C\u6D4B\u8BD5\u533A\u57DF\u4E0D\u4FDD\u7559\u6587\u5B57\u3001\u9634\u5F71\u6216\u6309\u94AE\u3002\u8FD1\u9ED1\u5206\u6863\u4ECE\u5DE6\u5230\u53F3\u9012\u589E\uFF1B\u6E10\u53D8\u7528\u4E8E\u76EE\u89C6\u68C0\u67E5\uFF0C\u4E0D\u4EE3\u8868\u4EEA\u5668\u6821\u51C6\u7ED3\u679C\u3002"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "test-surface pattern-surface",
    "data-pattern": pattern,
    style: {
      background: backgrounds[pattern] || '#000'
    }
  }, pattern === 'steps' && /*#__PURE__*/React.createElement("div", {
    className: "gray-steps"
  }, [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48].map(value => /*#__PURE__*/React.createElement("div", {
    key: value,
    style: {
      background: gray(value)
    }
  }))), pattern === 'spectrum' && /*#__PURE__*/React.createElement("div", {
    className: "spectrum"
  }, ['#f00', '#0f0', '#00f', '#0ff', '#f0f', '#ff0'].map(color => /*#__PURE__*/React.createElement("div", {
    key: color,
    style: {
      background: `linear-gradient(to right, ${color}, #000)`
    }
  })))));
}
function APLTest({
  onExit
}) {
  const [area, setArea] = useState(10);
  const [box, setBox] = useState(255);
  const [background, setBackground] = useState(0);
  const surface = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });
  useLayoutEffect(() => {
    const measure = () => {
      const {
        width,
        height
      } = surface.current.getBoundingClientRect();
      const target = width * height * area / 100;
      const side = Math.sqrt(target);
      const w = Math.min(side, width);
      const h = Math.min(target / w, height);
      setDimensions({
        width: target / h,
        height: h
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, [area]);
  const signalMean = (area / 100 * box + (1 - area / 100) * background) / 255 * 100;
  return /*#__PURE__*/React.createElement(TestShell, {
    title: "APL \u7A97\u53E3",
    onExit: onExit,
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "readout"
    }, /*#__PURE__*/React.createElement("span", null, "\u7A97\u53E3\u9762\u79EF"), /*#__PURE__*/React.createElement("strong", null, area, "%"), /*#__PURE__*/React.createElement("span", null, "\u5360\u5F53\u524D\u7F51\u9875\u6D4B\u8BD5\u533A\u57DF")), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u7A97\u53E3\u9762\u79EF\u6BD4\u4F8B"), /*#__PURE__*/React.createElement("div", {
      className: "choices area-choices"
    }, AREAS.map(value => /*#__PURE__*/React.createElement(Choice, {
      key: value,
      active: value === area,
      onClick: () => setArea(value)
    }, value, "%")))), /*#__PURE__*/React.createElement(Level, {
      label: "\u7A97\u53E3\u7070\u9636",
      value: box,
      onChange: setBox
    }), /*#__PURE__*/React.createElement(Level, {
      label: "\u5E95\u8272\u7070\u9636",
      value: background,
      onChange: setBackground
    }), /*#__PURE__*/React.createElement("div", {
      className: "metric"
    }, /*#__PURE__*/React.createElement("span", null, "\u5E73\u5747\u4FE1\u53F7\u7535\u5E73"), /*#__PURE__*/React.createElement("output", null, signalMean.toFixed(2), "%")), /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u6309 8 \u4F4D RGB \u7801\u503C\u548C\u9762\u79EF\u52A0\u6743\u8BA1\u7B97\uFF0C\u4E0D\u662F\u5B9E\u6D4B\u4EAE\u5EA6\u6216\u7EBF\u6027\u5149 APL\u3002\u767D\u7A97\u9ED1\u5E95\u65F6\uFF0C\u8BE5\u503C\u7B49\u4E8E\u7A97\u53E3\u9762\u79EF\u6BD4\u4F8B\u3002"), /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u8BF7\u9690\u85CF\u63A7\u5236\u540E\u6D4B\u91CF\uFF1A\u9762\u677F\u4E5F\u4F1A\u53D1\u5149\uFF0C\u6539\u53D8\u5B9E\u9645\u5E73\u5747\u753B\u9762\u4EAE\u5EA6\u3002\u6D4F\u89C8\u5668\u5DE5\u5177\u680F\u4E0D\u8BA1\u5165\u9762\u79EF\uFF1B\u5168\u5C4F\u53EF\u51CF\u5C11\u5E72\u6270\u3002"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "test-surface apl-surface",
    ref: surface,
    style: {
      background: gray(background)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "apl-window",
    style: {
      ...dimensions,
      background: gray(box)
    }
  })));
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
        if (disposed || document.hidden) await next.release();else {
          lock = next;
          next.addEventListener('release', () => {
            if (lock === next) lock = null;
          });
        }
      } catch {/* Plain HTTP and power-saving modes may deny wake lock. */} finally {
        requesting = false;
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
function App() {
  const [view, setView] = useState('menu');
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const exit = () => setView('menu');
  useWakeLock(view !== 'menu');
  useEffect(() => {
    const key = e => {
      if (e.code === 'Escape') setView('menu');
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, view === 'menu' && /*#__PURE__*/React.createElement("main", {
    className: "menu"
  }, /*#__PURE__*/React.createElement("div", {
    className: "menu-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "\u624B\u673A\u5C4F\u5E55 \xB7 \u76EE\u89C6\u6D4B\u8BD5 ", /*#__PURE__*/React.createElement("span", null, "\u5C40\u57DF\u7F51 \xB7 \u79BB\u7EBF\u53EF\u7528")), /*#__PURE__*/React.createElement("h1", null, "\u88C5\u673A\u5B85OLED\u6D4B\u8BD5"), /*#__PURE__*/React.createElement("p", {
    className: "intro"
  }, "\u62D6\u5F71\u3001\u6697\u90E8\u5C42\u6B21\u4E0E\u7A97\u53E3\u4EAE\u5EA6\u3002\u6253\u5F00\u6D4B\u8BD5\uFF0C\u9690\u85CF\u63A7\u5236\uFF0C\u4E13\u6CE8\u89C2\u5BDF\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "test-cards"
  }, /*#__PURE__*/React.createElement("button", {
    className: "test-card violet",
    onClick: () => setView('smear')
  }, /*#__PURE__*/React.createElement("span", {
    className: "card-number"
  }, "01 / \u52A8\u6001\u54CD\u5E94"), /*#__PURE__*/React.createElement("h2", null, "\u62D6\u5F71\u6D4B\u8BD5 ", /*#__PURE__*/React.createElement("span", null, "\u2197")), /*#__PURE__*/React.createElement("p", null, "\u4F4E\u7070\u6587\u5B57\u4E0E\u7EAF\u8272\u65B9\u5757", /*#__PURE__*/React.createElement("br", null), "\u8C03\u6574\u901F\u5EA6\u3001\u65B9\u5411\u4E0E\u7070\u9636"), /*#__PURE__*/React.createElement("span", {
    className: "card-preview motion-preview"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null))), /*#__PURE__*/React.createElement("button", {
    className: "test-card green",
    onClick: () => setView('pattern')
  }, /*#__PURE__*/React.createElement("span", {
    className: "card-number"
  }, "02 / \u8272\u9636\u68C0\u67E5"), /*#__PURE__*/React.createElement("h2", null, "\u8272\u9636\u4E0E\u7EAF\u8272 ", /*#__PURE__*/React.createElement("span", null, "\u2197")), /*#__PURE__*/React.createElement("p", null, "\u8FD1\u9ED1\u5C42\u6B21\u3001\u516D\u8272\u6E10\u53D8", /*#__PURE__*/React.createElement("br", null), "\u68C0\u67E5\u574F\u70B9\u4E0E\u663E\u793A\u5747\u5300\u6027"), /*#__PURE__*/React.createElement("span", {
    className: "card-preview gradient-preview"
  })), /*#__PURE__*/React.createElement("button", {
    className: "test-card amber",
    onClick: () => setView('apl')
  }, /*#__PURE__*/React.createElement("span", {
    className: "card-number"
  }, "03 / \u4EAE\u5EA6\u7A97\u53E3"), /*#__PURE__*/React.createElement("h2", null, "APL \u7A97\u53E3 ", /*#__PURE__*/React.createElement("span", null, "\u2197")), /*#__PURE__*/React.createElement("p", null, "1\u2013100% \u9762\u79EF\u7A97\u53E3", /*#__PURE__*/React.createElement("br", null), "\u89C2\u5BDF\u4E0D\u540C\u9762\u79EF\u4E0B\u7684\u4EAE\u5EA6\u53D8\u5316"), /*#__PURE__*/React.createElement("span", {
    className: "card-preview window-preview"
  }, /*#__PURE__*/React.createElement("i", null)))), /*#__PURE__*/React.createElement("div", {
    className: "instructions"
  }, /*#__PURE__*/React.createElement("strong", null, "\u5F00\u59CB\u524D"), /*#__PURE__*/React.createElement("p", null, "\u56FA\u5B9A\u7CFB\u7EDF\u4EAE\u5EA6\uFF0C\u5173\u95ED\u81EA\u52A8\u4EAE\u5EA6\u3001\u62A4\u773C\u4E0E\u8272\u6E29\u81EA\u9002\u5E94\u3002\u5BF9\u6BD4\u624B\u673A\u65F6\u4F7F\u7528\u76F8\u540C\u8BBE\u7F6E\u548C\u73AF\u5883\u3002"), /*#__PURE__*/React.createElement("p", null, "\u53CC\u51FB\u6D4B\u8BD5\u753B\u9762\u6216\u6309 H \u9690\u85CF / \u6062\u590D\u63A7\u5236\uFF0CEsc \u8FD4\u56DE\u3002\u5C40\u57DF\u7F51 HTTP \u4E0B\u82E5\u4E0D\u80FD\u4FDD\u6301\u5E38\u4EAE\uFF0C\u8BF7\u5728\u624B\u673A\u4E0A\u5EF6\u957F\u81EA\u52A8\u9501\u5C4F\u65F6\u95F4\u3002")), fullscreen && /*#__PURE__*/React.createElement("button", {
    className: "quiet-button",
    onClick: () => document.exitFullscreen().catch(() => {})
  }, "\u9000\u51FA\u5168\u5C4F"), /*#__PURE__*/React.createElement("footer", null, "\u6D4F\u89C8\u5668\u76EE\u89C6\u6D4B\u8BD5\u5DE5\u5177 \xB7 \u4E0D\u76F4\u63A5\u6D4B\u91CF\u4EAE\u5EA6\u3001\u9891\u95EA\u6216\u54CD\u5E94\u65F6\u95F4"))), view === 'smear' && /*#__PURE__*/React.createElement(SmearTest, {
    onExit: exit
  }), view === 'pattern' && /*#__PURE__*/React.createElement(PatternTest, {
    onExit: exit
  }), view === 'apl' && /*#__PURE__*/React.createElement(APLTest, {
    onExit: exit
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(React.StrictMode, null, /*#__PURE__*/React.createElement(App, null)));
