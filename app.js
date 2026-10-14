function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useLayoutEffect,
  useRef
} = React;
const gray = value => `rgb(${value}, ${value}, ${value})`;
const PRESETS = [['极低灰阶', 0, 15], ['低灰阶', 0, 25], ['中低灰阶', 0, 50], ['夜间模式', 18, 220], ['白底黑字', 255, 0]];
const AREAS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const TEXTS = ['The quick brown fox jumps over the lazy dog. 0123456789', '天地玄黄 宇宙洪荒 日月盈昃 辰宿列张', 'OLED BLACK SMEAR / 灰阶响应观察'];
const PATTERNS = [['gradient', '全灰阶渐变', 'G0 → G255'], ['dark', '近黑渐变', 'G0 → G64'], ['expanded', '暗部展开渐变', '非线性分布'], ['steps', '近黑分档', 'G0 · 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48'], ['spectrum', '六色渐变', 'RGBCMY → 黑'], ['solid', '纯色检查', '坏点 / 色斑 / 均匀性']];
const SOLIDS = [['黑', '#000000'], ['白', '#ffffff'], ['红', '#ff0000'], ['绿', '#00ff00'], ['蓝', '#0000ff'], ['灰', '#808080']];
function Icon({
  name
}) {
  const shapes = {
    settings: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 6h4m4 0h8M4 12h10m4 0h2M4 18h2m4 0h10"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "10",
      cy: "6",
      r: "2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "16",
      cy: "12",
      r: "2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "18",
      r: "2"
    })),
    text: /*#__PURE__*/React.createElement("path", {
      d: "M5 7V4h14v3M12 4v16m-4 0h8"
    }),
    block: /*#__PURE__*/React.createElement("rect", {
      x: "4",
      y: "5",
      width: "16",
      height: "14",
      rx: "2"
    }),
    back: /*#__PURE__*/React.createElement("path", {
      d: "m14 6-6 6 6 6M8 12h13"
    }),
    right: /*#__PURE__*/React.createElement("path", {
      d: "M3 12h17m-6-6 6 6-6 6"
    }),
    up: /*#__PURE__*/React.createElement("path", {
      d: "M12 21V4m-6 6 6-6 6 6"
    }),
    down: /*#__PURE__*/React.createElement("path", {
      d: "M12 3v17m-6-6 6 6 6-6"
    }),
    next: /*#__PURE__*/React.createElement("path", {
      d: "m9 5 7 7-7 7"
    }),
    close: /*#__PURE__*/React.createElement("path", {
      d: "m6 6 12 12M6 18 18 6"
    }),
    move: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M8 8h.01M16 8h.01M8 16h.01M16 16h.01",
      strokeWidth: "3"
    })),
    expand: /*#__PURE__*/React.createElement("path", {
      d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"
    }),
    collapse: /*#__PURE__*/React.createElement("path", {
      d: "M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"
    })
  };
  return /*#__PURE__*/React.createElement("svg", {
    className: "ui-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
  }, shapes[name]);
}
const MENU_TESTS = [{
  id: 'smear',
  title: '拖影测试',
  position: '0%'
}, {
  id: 'pattern',
  title: '色阶与纯色',
  position: '50%'
}, {
  id: 'apl',
  title: 'APL 窗口',
  position: '100%'
}];
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
  }, /*#__PURE__*/React.createElement("div", {
    className: "level-heading"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    "aria-label": `${label}数值`,
    min: "0",
    max: "255",
    step: "1",
    value: value,
    onChange: e => {
      if (e.target.value !== '') onChange(Math.max(0, Math.min(255, Math.round(Number(e.target.value)))));
    }
  })), /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "range",
    min: "0",
    max: "255",
    step: "1",
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}

// Double-tap opens the complete floating panel; its visibility controls motion.
function TestShell({
  title,
  tone,
  onExit,
  children,
  controls,
  help
}) {
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
    const shell = shellRef.current,
      panel = panelRef.current;
    return {
      x: Math.max(12, Math.min(position.x, shell.clientWidth - panel.offsetWidth - 12)),
      y: Math.max(12, Math.min(position.y, shell.clientHeight - panel.offsetHeight - 12))
    };
  };
  useLayoutEffect(() => {
    if (!visible) return;
    const fit = () => setPanelPosition(previous => {
      const next = clampPosition(previous || {
        x: shellRef.current.clientWidth,
        y: 16
      });
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
      if (e.code === 'KeyH') {
        setVisible(v => !v);
        document.activeElement?.blur();
      }
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();else {
        setNotice('浏览器不支持全屏，可添加到主屏幕后打开。');
        return;
      }
      setNotice('');
    } catch {
      setNotice('暂时无法全屏，可继续测试。');
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
      // A compatibility mouse event must not focus or activate a newly shown control.
      suppressClick.current = true;
      setVisible(v => !v);
      lastTap.current = null;
    } else lastTap.current = {
      x: e.clientX,
      y: e.clientY,
      time: now
    };
  };
  const startDrag = e => {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      left: panelRef.current.offsetLeft,
      top: panelRef.current.offsetTop
    };
  };
  const moveDrag = e => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    setPanelPosition(clampPosition({
      x: drag.left + e.clientX - drag.x,
      y: drag.top + e.clientY - drag.y
    }));
  };
  const moveByKey = e => {
    const offsets = {
      ArrowLeft: [-20, 0],
      ArrowRight: [20, 0],
      ArrowUp: [0, -20],
      ArrowDown: [0, 20]
    };
    if (!offsets[e.key]) return;
    e.preventDefault();
    const [dx, dy] = offsets[e.key];
    setPanelPosition(clampPosition({
      x: panelRef.current.offsetLeft + dx,
      y: panelRef.current.offsetTop + dy
    }));
  };
  return /*#__PURE__*/React.createElement("main", {
    className: `test-shell tone-${tone}`,
    ref: shellRef,
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
  }, typeof children === 'function' ? children(visible) : children, visible && /*#__PURE__*/React.createElement("aside", {
    className: "panel",
    "data-controls": "true",
    ref: panelRef,
    "aria-label": `${title}控制台`,
    style: panelPosition ? {
      left: panelPosition.x,
      top: panelPosition.y,
      right: 'auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("header", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "panel-drag",
    "aria-label": `拖动${title}面板`,
    title: "\u62D6\u52A8\u9762\u677F\uFF0C\u6216\u7528\u65B9\u5411\u952E\u79FB\u52A8",
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: () => {
      dragRef.current = null;
    },
    onPointerCancel: () => {
      dragRef.current = null;
    },
    onLostPointerCapture: () => {
      dragRef.current = null;
    },
    onKeyDown: moveByKey
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings"
  }), /*#__PURE__*/React.createElement("span", null, title)), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    onClick: onExit,
    "aria-label": "\u8FD4\u56DE\u83DC\u5355"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "back"
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "\u6536\u8D77\u9762\u677F",
    onClick: () => {
      setVisible(false);
      document.activeElement?.blur();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "panel-content"
  }, controls, /*#__PURE__*/React.createElement("div", {
    className: "test-tools"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleFullscreen
  }, /*#__PURE__*/React.createElement(Icon, {
    name: fullscreen ? 'collapse' : 'expand'
  }), fullscreen ? '退出全屏' : '全屏')), notice && /*#__PURE__*/React.createElement("p", {
    role: "status",
    className: "hint"
  }, notice), /*#__PURE__*/React.createElement("details", {
    className: "help"
  }, /*#__PURE__*/React.createElement("summary", null, "\u4F7F\u7528\u5E2E\u52A9"), /*#__PURE__*/React.createElement("p", null, "\u53CC\u51FB\u7A7A\u767D\u5904\u6253\u5F00\u6216\u6536\u8D77\u9762\u677F\uFF1B\u6253\u5F00\u65F6\u6EDA\u52A8\u81EA\u52A8\u6682\u505C\uFF0C\u6536\u8D77\u540E\u7EE7\u7EED\u3002\u62D6\u52A8\u6807\u9898\u53EF\u79FB\u52A8\u9762\u677F\u3002"), help, /*#__PURE__*/React.createElement("p", null, "\u5BF9\u6BD4\u65F6\u56FA\u5B9A\u7CFB\u7EDF\u4EAE\u5EA6\u4E0E\u8272\u6E29\u3002H \u663E\u793A\u63A7\u5236\uFF0CEsc \u8FD4\u56DE\u3002")))));
}
function SmearRunner({
  state
}) {
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
  }, [state.isPlaying, state.speed, state.reverse, size, vertical]);
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
  const [vertical, setVertical] = useState(() => !window.matchMedia('(orientation: landscape)').matches);
  useEffect(() => {
    const orientation = window.matchMedia('(orientation: landscape)');
    const changed = () => setVertical(!orientation.matches);
    changed();
    orientation.addEventListener('change', changed);
    return () => orientation.removeEventListener('change', changed);
  }, []);
  const [state, setState] = useState({
    speed: 480,
    mode: 'text',
    reverse: false,
    bg: 0,
    fg: 25,
    fontSize: 40
  });
  const update = patch => setState(s => ({
    ...s,
    ...patch
  }));
  return /*#__PURE__*/React.createElement(TestShell, {
    tone: "smear",
    title: "\u62D6\u5F71\u6D4B\u8BD5",
    onExit: onExit,
    help: /*#__PURE__*/React.createElement("p", null, "\u7AD6\u5C4F\u4E0A\u4E0B\u6EDA\u52A8\uFF0C\u6A2A\u5C4F\u5DE6\u53F3\u6EDA\u52A8\u3002\u901F\u5EA6\u5355\u4F4D\u4E3A CSS \u50CF\u7D20 / \u79D2\u3002\u6B64\u9875\u9762\u7528\u4E8E\u76EE\u89C6\u89C2\u5BDF\uFF0C\u4E0D\u76F4\u63A5\u6D4B\u91CF\u54CD\u5E94\u65F6\u95F4\u6216\u5237\u65B0\u7387\u3002"),
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u6EDA\u52A8\u901F\u5EA6 \xB7 px/s"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, [[240, '慢速'], [480, '中速'], [960, '高速'], [1920, '极速']].map(([speed, label]) => /*#__PURE__*/React.createElement(Choice, {
      key: speed,
      active: speed === state.speed,
      onClick: () => update({
        speed
      })
    }, label, " (", speed, ")")))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u6EDA\u52A8\u65B9\u5411"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, /*#__PURE__*/React.createElement(Choice, {
      active: !state.reverse,
      onClick: () => update({
        reverse: false
      })
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon-label"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: vertical ? 'down' : 'right'
    }), vertical ? '向下' : '向右')), /*#__PURE__*/React.createElement(Choice, {
      active: state.reverse,
      onClick: () => update({
        reverse: true
      })
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon-label"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: vertical ? 'up' : 'back'
    }), vertical ? '向上' : '向左')))), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u5185\u5BB9"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, /*#__PURE__*/React.createElement(Choice, {
      active: state.mode === 'text',
      onClick: () => update({
        mode: 'text'
      })
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon-label"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "text"
    }), "\u6587\u5B57")), /*#__PURE__*/React.createElement(Choice, {
      active: state.mode === 'block',
      onClick: () => update({
        mode: 'block'
      })
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon-label"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "block"
    }), "\u7EAF\u8272\u65B9\u5757")))), state.mode === 'text' && /*#__PURE__*/React.createElement("label", {
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
      className: "choices preset-choices"
    }, PRESETS.map(([label, bg, fg]) => /*#__PURE__*/React.createElement(Choice, {
      key: label,
      active: state.bg === bg && state.fg === fg,
      onClick: () => update({
        bg,
        fg
      })
    }, /*#__PURE__*/React.createElement("span", null, label, " ", /*#__PURE__*/React.createElement("span", {
      className: "preset-values"
    }, "(G", bg, "/G", fg, ")")), /*#__PURE__*/React.createElement("span", {
      className: "swatches",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        background: gray(bg)
      }
    }), /*#__PURE__*/React.createElement("i", {
      style: {
        background: gray(fg)
      }
    })))))), /*#__PURE__*/React.createElement("section", {
      className: "manual-levels",
      "aria-label": "\u624B\u52A8\u5FAE\u8C03"
    }, /*#__PURE__*/React.createElement("p", {
      className: "section-label"
    }, "\u624B\u52A8\u5FAE\u8C03 \xB7 0\u2013255"), /*#__PURE__*/React.createElement(Level, {
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
    })), state.bg === state.fg && /*#__PURE__*/React.createElement("p", {
      className: "hint"
    }, "\u524D\u666F\u4E0E\u80CC\u666F\u76F8\u540C\uFF0C\u5F53\u524D\u6CA1\u6709\u53EF\u89C1\u8FB9\u7F18\u3002"))
  }, panelOpen => /*#__PURE__*/React.createElement(SmearRunner, {
    state: {
      ...state,
      vertical,
      isPlaying: !panelOpen
    }
  }));
}
function PatternTest({
  onExit
}) {
  const [pattern, setPattern] = useState('gradient');
  const [solid, setSolid] = useState('#000000');
  const backgrounds = {
    gradient: 'linear-gradient(to bottom, #000, #fff)',
    dark: 'linear-gradient(to bottom, #000, #404040)',
    expanded: 'linear-gradient(to bottom, #000 0%, #050505 10%, #0f0f0f 20%, #1e1e1e 30%, #333 40%, #4d4d4d 50%, #707070 60%, #909090 70%, #b0b0b0 80%, #d0d0d0 90%, #fff 100%)',
    solid
  };
  return /*#__PURE__*/React.createElement(TestShell, {
    tone: "pattern",
    title: "\u8272\u9636\u4E0E\u7EAF\u8272",
    onExit: onExit,
    help: /*#__PURE__*/React.createElement("p", null, "\u8FD1\u9ED1\u5206\u6863\u4ECE\u4E0A\u5230\u4E0B\uFF1AG0\u30011\u30012\u30013\u30014\u30016\u30018\u300112\u300116\u300124\u300132\u300148\u3002\u9690\u85CF\u9762\u677F\u540E\u89C2\u5BDF\u3002"),
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u56FE\u6848"), /*#__PURE__*/React.createElement("div", {
      className: "choices two"
    }, PATTERNS.map(([id, title]) => /*#__PURE__*/React.createElement(Choice, {
      key: id,
      active: pattern === id,
      onClick: () => setPattern(id)
    }, /*#__PURE__*/React.createElement("span", null, title))))), pattern === 'solid' && /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u7EAF\u8272"), /*#__PURE__*/React.createElement("div", {
      className: "choices three"
    }, SOLIDS.map(([name, value]) => /*#__PURE__*/React.createElement(Choice, {
      key: name,
      active: solid === value,
      onClick: () => setSolid(value)
    }, /*#__PURE__*/React.createElement("span", {
      className: "solid-label"
    }, /*#__PURE__*/React.createElement("i", {
      className: "color-dot",
      style: {
        background: value
      },
      "aria-hidden": "true"
    }), name)))), /*#__PURE__*/React.createElement("label", {
      className: "select-label"
    }, "\u81EA\u5B9A\u4E49\u989C\u8272", /*#__PURE__*/React.createElement("input", {
      "aria-label": "\u81EA\u5B9A\u4E49\u989C\u8272",
      type: "color",
      value: solid,
      onChange: e => setSolid(e.target.value)
    }))))
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
      background: `linear-gradient(to bottom, ${color}, #000)`
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
    tone: "apl",
    title: "APL \u7A97\u53E3",
    onExit: onExit,
    help: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, "\u9762\u79EF\u4EE5\u5F53\u524D\u7F51\u9875\u533A\u57DF\u4E3A\u5206\u6BCD\u3002\u6D4B\u91CF\u524D\u6536\u8D77\u9762\u677F\uFF0C\u907F\u514D\u9762\u677F\u81EA\u8EAB\u53D1\u5149\u5F71\u54CD\u8BFB\u6570\u3002"), /*#__PURE__*/React.createElement("p", null, "\u5E73\u5747\u4FE1\u53F7\u7535\u5E73\u6309 8 \u4F4D\u7801\u503C\u4E0E\u9762\u79EF\u52A0\u6743\uFF0C\u4E0D\u662F\u5B9E\u6D4B\u4EAE\u5EA6\u6216\u7EBF\u6027\u5149 APL\u3002")),
    controls: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", null, "\u7A97\u53E3\u9762\u79EF\u6BD4\u4F8B"), /*#__PURE__*/React.createElement("div", {
      className: "choices area-choices"
    }, AREAS.map(value => /*#__PURE__*/React.createElement(Choice, {
      key: value,
      active: value === area,
      onClick: () => setArea(value)
    }, value, "%")))), /*#__PURE__*/React.createElement("section", {
      className: "manual-levels",
      "aria-label": "\u7070\u9636\u8C03\u6574"
    }, /*#__PURE__*/React.createElement(Level, {
      label: "\u7A97\u53E3\u7070\u9636",
      value: box,
      onChange: setBox
    }), /*#__PURE__*/React.createElement(Level, {
      label: "\u5E95\u8272\u7070\u9636",
      value: background,
      onChange: setBackground
    })), /*#__PURE__*/React.createElement("div", {
      className: "metric"
    }, /*#__PURE__*/React.createElement("span", null, "\u5E73\u5747\u4FE1\u53F7\u7535\u5E73"), /*#__PURE__*/React.createElement("output", null, signalMean.toFixed(2), "%")))
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
    const key = e => {
      if (e.code === 'Escape') exit();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, view === 'menu' && /*#__PURE__*/React.createElement("main", {
    className: "menu"
  }, /*#__PURE__*/React.createElement("div", {
    className: "menu-inner"
  }, /*#__PURE__*/React.createElement("h1", null, "\u88C5\u673A\u5B85OLED\u6D4B\u8BD5"), /*#__PURE__*/React.createElement("div", {
    className: "test-cards"
  }, MENU_TESTS.map(test => /*#__PURE__*/React.createElement("button", {
    key: test.id,
    className: `test-card tone-${test.id}`,
    onClick: () => enter(test.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "test-art",
    "aria-hidden": "true",
    style: {
      backgroundPosition: `${test.position} center`
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "card-title"
  }, test.title), /*#__PURE__*/React.createElement(Icon, {
    name: "next"
  })))), /*#__PURE__*/React.createElement("p", {
    className: "gesture-hint"
  }, "\u53CC\u51FB\u753B\u9762\uFF0C\u8C03\u51FA\u63A7\u5236\u9762\u677F"))), view === 'smear' && /*#__PURE__*/React.createElement(SmearTest, {
    onExit: exit
  }), view === 'pattern' && /*#__PURE__*/React.createElement(PatternTest, {
    onExit: exit
  }), view === 'apl' && /*#__PURE__*/React.createElement(APLTest, {
    onExit: exit
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(React.StrictMode, null, /*#__PURE__*/React.createElement(App, null)));
