import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INJECTED_BACKEND_SCRIPT = `
  (function() {
    if (window.__EXT_DEVTOOLS__) return;
    window.__EXT_DEVTOOLS__ = {
      nextId: 1,
      nodeToId: new Map(),
      idToNode: new Map(),
      mutations: false,
      observer: null,

      init() {
        if (!this.observer) {
          this.observer = new MutationObserver(() => { this.mutations = true; });
          this.observer.observe(document.documentElement, {
            childList: true, attributes: true, subtree: true, characterData: true
          });
        }
      },

      getId(node) {
        if (this.nodeToId.has(node)) return this.nodeToId.get(node);
        const id = this.nextId++;
        this.nodeToId.set(node, id);
        this.idToNode.set(id, node);
        return id;
      },

      serializeAttributes(el) {
        const attrs = {};
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      },

      serializeNode(node) {
        if (node.nodeType === 3) {
          const text = node.nodeValue?.trim();
          if (!text) return null;
          return { type: "text", val: text, id: this.getId(node) };
        }
        if (node.nodeType === 8) {
          return { type: "comment", val: node.nodeValue, id: this.getId(node) };
        }
        if (node.nodeType === 10) {
          return { type: "doctype", name: node.name, id: this.getId(node) };
        }
        if (node.nodeType === 1 || node.nodeType === 9 || node.nodeType === 11) {
          const rawChildren = Array.from(node.childNodes || []);
          if (node.shadowRoot) rawChildren.push(node.shadowRoot);
          if (node.contentDocument) rawChildren.push(node.contentDocument);

          return {
            type: "element",
            tag: (node.nodeName || "DOCUMENT").toLowerCase(),
            attrs: node.nodeType === 1 ? this.serializeAttributes(node) : {},
            children: rawChildren.map(c => this.serializeNode(c)).filter(Boolean),
            id: this.getId(node)
          };
        }
        return null;
      },

      getDOM() {
        this.init();
        this.mutations = false;
        return this.serializeNode(document);
      },

      checkMutations() {
        if (this.mutations) {
          this.mutations = false;
          return true;
        }
        return false;
      },

      highlightNode(id) {
        this.clearHighlight();
        const node = this.idToNode.get(id);
        if (!node || node.nodeType !== 1) return;

        const rect = node.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.id = '__ext_devtools_overlay__';
        overlay.style.position = 'fixed';
        overlay.style.top = rect.top + 'px';
        overlay.style.left = rect.left + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.backgroundColor = 'rgba(111, 168, 220, 0.5)';
        overlay.style.outline = '2px solid rgba(147, 196, 125, 0.8)';
        overlay.style.zIndex = '2147483647';
        overlay.style.pointerEvents = 'none';

        document.body.appendChild(overlay);
      },

      clearHighlight() {
        const existing = document.getElementById('__ext_devtools_overlay__');
        if (existing) existing.remove();
      }
    };
  })();
`;

const ChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    width={size}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    width={size}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const RefreshCw = ({ size = 18 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const Settings = ({ size = 18 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const X = ({ size = 18 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
  >
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

const Save = ({ size = 18 }: { size?: number }) => (
  <svg
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export function DevToolsPanel() {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const [domData, setDomData] = useState(null);
  const [jsonStr, setJsonStr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const nodeMap = useRef<Map<number, any>>(new Map());
  const selectedIdRef = useRef<number | null>(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const refreshDOM = useCallback(() => {
    chrome.devtools.inspectedWindow.eval(
      `window.__EXT_DEVTOOLS__ ? window.__EXT_DEVTOOLS__.getDOM() : null`,
      (result, isException) => {
        if (isException || !result) return;

        nodeMap.current.clear();
        const mapTree = (node) => {
          nodeMap.current.set(node.id, node);
          if (node.children) node.children.forEach(mapTree);
        };

        mapTree(result);
        setDomData(result);
      },
    );
  }, []);

  const injectBackend = useCallback((callback) => {
    chrome.devtools.inspectedWindow.eval(INJECTED_BACKEND_SCRIPT, (_res, isException) => {
      if (!isException && callback) callback();
    });
  }, []);

  useEffect(() => {
    if (!tabId) return;

    // Inject our script into the page and perform the initial load
    injectBackend(() => refreshDOM());

    // Poll the page quietly to see if DOM mutations occurred
    const intervalId = setInterval(() => {
      chrome.devtools.inspectedWindow.eval(
        `window.__EXT_DEVTOOLS__ && window.__EXT_DEVTOOLS__.checkMutations()`,
        (hasMutations, isException) => {
          if (hasMutations && !isException) {
            refreshDOM();
          }
        },
      );
    }, 500);

    // Refresh instantly when the user navigates inside the same tab
    const onNavigated = () => injectBackend(() => refreshDOM());
    chrome.devtools.network.onNavigated.addListener(onNavigated);

    return () => {
      clearInterval(intervalId);
      chrome.devtools.network.onNavigated.removeListener(onNavigated);
    };
  }, [tabId, injectBackend, refreshDOM]);

  // Sync with native Chrome DevTools Inspect Element button
  useEffect(() => {
    if (chrome.devtools?.panels?.elements) {
      const handleNativeSelectionChange = () => {
        chrome.devtools.inspectedWindow.eval(
          `window.__EXT_DEVTOOLS__ ? window.__EXT_DEVTOOLS__.getId($0) : null`,
          (id, isException) => {
            if (!isException && id) {
              setSelectedId(id);
            }
          },
        );
      };

      // Set listener for future selections
      chrome.devtools.panels.elements.onSelectionChanged.addListener(handleNativeSelectionChange);

      // Auto trigger once on load to catch whatever is currently selected
      handleNativeSelectionChange();

      return () => {
        chrome.devtools.panels.elements.onSelectionChanged.removeListener(
          handleNativeSelectionChange,
        );
      };
    }
  }, []);

  const highlightNode = useCallback((nodeId) => {
    chrome.devtools.inspectedWindow.eval(
      `window.__EXT_DEVTOOLS__ && window.__EXT_DEVTOOLS__.highlightNode(${nodeId})`,
    );
  }, []);

  const clearHighlight = useCallback(() => {
    chrome.devtools.inspectedWindow.eval(
      `window.__EXT_DEVTOOLS__ && window.__EXT_DEVTOOLS__.clearHighlight()`,
    );
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["classmapJson"], (res) => {
      if (res.classmapJson) setJsonStr(res.classmapJson);
    });
  }, []);

  const classMapper = useMemo(() => {
    try {
      const rawMap = JSON.parse(jsonStr || "{}");
      if (!rawMap || typeof rawMap !== "object") throw new Error("Invalid format");

      const flatMap = {};
      const traverse = (obj, path = []) => {
        for (const [key, val] of Object.entries(obj)) {
          if (val && typeof val === "object") traverse(val, [...path, key]);
          else flatMap[val] = [...path, key].map((s) => s.replaceAll("_", "-")).join("__");
        }
      };
      traverse(rawMap);

      return (className) => {
        if (!className || typeof className !== "string")
          return { displayStr: className || "", tokens: [] };

        const tokens = className
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => {
            if (flatMap[p]) {
              return { original: p, mapped: `MAP__${flatMap[p]}`, isMapped: true };
            }
            return { original: p, mapped: p, isMapped: false };
          });

        return {
          displayStr: tokens.map((t) => t.mapped).join(" "),
          tokens,
        };
      };
    } catch (_e) {
      return (className) => {
        const tokens = (className || "")
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => ({ original: p, mapped: p, isMapped: false }));
        return { displayStr: className || "", tokens };
      };
    }
  }, [jsonStr]);

  const nextSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    setSearchIndex((idx) => {
      const nextIdx = (idx + 1) % searchResults.length;
      setSelectedId(searchResults[nextIdx]);
      return nextIdx;
    });
  }, [searchResults]);

  const prevSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    setSearchIndex((idx) => {
      const nextIdx = (idx - 1 + searchResults.length) % searchResults.length;
      setSelectedId(searchResults[nextIdx]);
      return nextIdx;
    });
  }, [searchResults]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.source !== "devtools-command") return;
      const { action, query } = event.data;
      if (action === "performSearch") setSearchQuery(query || "");
      if (action === "nextSearchResult") nextSearch();
      if (action === "previousSearchResult") prevSearch();
      if (action === "cancelSearch") {
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [nextSearch, prevSearch]);

  useEffect(() => {
    if (!searchQuery || !domData) {
      setSearchResults([]);
      return;
    }
    const matches = [];
    const lowerQuery = searchQuery.toLowerCase();

    const walk = (node) => {
      let isMatch = false;

      if (node.type === "text" && node.val?.toLowerCase().includes(lowerQuery)) isMatch = true;
      if (node.type === "comment" && node.val?.toLowerCase().includes(lowerQuery)) isMatch = true;
      if (node.type === "doctype" && node.name?.toLowerCase().includes(lowerQuery)) isMatch = true;
      if (node.type === "pseudo" && node.pseudoType?.toLowerCase().includes(lowerQuery))
        isMatch = true;

      if (node.tag?.toLowerCase().includes(lowerQuery)) isMatch = true;
      if (node.attrs) {
        for (const [k, v] of Object.entries(node.attrs)) {
          const val = k === "class" ? classMapper(v).displayStr : v;
          if (String(val).toLowerCase().includes(lowerQuery)) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) matches.push(node.id);
      if (node.children) node.children.forEach(walk);
    };

    walk(domData);
    setSearchResults(matches);

    const currSelected = selectedIdRef.current;
    if (matches.length > 0) {
      const idx = matches.indexOf(currSelected);
      if (idx !== -1) {
        setSearchIndex(idx);
      } else {
        setSearchIndex(0);
        setSelectedId(matches[0]);
      }
    } else {
      setSearchIndex(0);
      setSelectedId(null);
    }
  }, [searchQuery, domData, classMapper]);

  return (
    <div
      className="relative flex flex-col h-screen bg-[#282828] text-[#bdc1c6] font-mono text-[12px] overflow-hidden"
      onMouseLeave={clearHighlight}
    >
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #282828; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>

      {/* Instant Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[99999] px-2 py-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-[#444] pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 pb-20">
        {domData && (
          <ul className="list-none m-0 p-0">
            <TreeNode
              mapClass={classMapper}
              node={domData}
              onHideTooltip={() => setTooltip(null)}
              onHoverNode={highlightNode}
              onSelect={setSelectedId}
              onShowTooltip={setTooltip}
              searchIndex={searchIndex}
              searchQuery={searchQuery}
              searchResults={searchResults}
              selectedId={selectedId}
            />
          </ul>
        )}
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-50">
        {!showSettings && (
          <button
            className="w-12 h-12 bg-[#3c4043] hover:bg-[#505457] text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border border-white/10"
            onClick={refreshDOM}
            title="Force Refresh DOM"
          >
            <RefreshCw size={20} />
          </button>
        )}

        <button
          className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border border-blue-400/20"
          onClick={() => setShowSettings(!showSettings)}
          title={showSettings ? "Close Settings" : "Settings"}
        >
          {showSettings ? <X size={24} /> : <Settings size={24} />}
        </button>
      </div>

      {showSettings && (
        <div className="absolute inset-0 bg-[#282828]/98 z-40 p-6 flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="flex justify-between items-center border-b border-[#3c4043] pb-3">
            <h2 className="text-white font-bold text-sm tracking-wide">CLASSMAP CONFIGURATION</h2>
            <button
              className="p-1.5 hover:bg-[#3c4043] rounded text-gray-400 transition-colors"
              onClick={refreshDOM}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <textarea
            className="flex-1 bg-[#1e1e1e] border border-[#3c4043] rounded p-4 text-blue-300 text-[11px] resize-none outline-none focus:ring-1 focus:ring-blue-500 font-mono shadow-inner"
            onChange={(e) => setJsonStr(e.target.value)}
            placeholder='{ "original-class": "mapped-class" }'
            value={jsonStr}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 py-3 rounded text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
            onClick={() => {
              chrome.storage.local.set({ classmapJson: jsonStr });
              setShowSettings(false);
              refreshDOM();
            }}
          >
            <Save size={20} /> Update Mappings
          </button>
        </div>
      )}
    </div>
  );
}

const HighlightText = ({ text, query }: { text: string | undefined; query: string }) => {
  if (!query || !text) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span className="bg-[#5c4300] text-white px-0.5 rounded-sm" key={i}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
};

interface HighlightTextProps {
  text: string;
  query: string;
}

interface Node {
  id: number;
  type: string;
  tag?: string;
  val?: string;
  name?: string;
  pseudoType?: string;
  attrs?: Record<string, string>;
  children?: Node[];
}

interface Token {
  original: string;
  mapped: string;
  isMapped: boolean;
}

interface MapResult {
  displayStr: string;
  tokens: Token[];
}

interface TreeNodeProps {
  node: Node;
  mapClass: (className: string) => MapResult;
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchResults: number[];
  searchIndex: number;
  searchQuery: string;
  onHoverNode: (id: number) => void;
  onShowTooltip: (tooltip: { text: string; x: number; y: number }) => void;
  onHideTooltip: () => void;
}

export const TreeNode = ({
  node,
  mapClass,
  selectedId,
  onSelect,
  searchResults,
  searchIndex,
  searchQuery,
  onHoverNode,
  onShowTooltip,
  onHideTooltip,
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false); // Closed by default
  const elementRef = useRef<any>(null);

  const isSelected = selectedId === node.id;
  const isSearchResult = searchResults?.includes(node.id);
  const isCurrentMatch = isSearchResult && searchResults[searchIndex] === node.id;
  const hasChildren = node.children && node.children.length > 0;

  // Check if a child deeply nested inside this node is currently selected
  const hasDescendantSelected = useMemo(() => {
    const check = (children) => {
      if (!children) return false;
      for (const c of children) {
        if (c.id === selectedId) return true;
        if (check(c.children)) return true;
      }
      return false;
    };
    return check(node.children);
  }, [selectedId, node.children]);

  // Expand parent hierarchy automatically if a descendant is selected
  useEffect(() => {
    if (hasDescendantSelected) {
      setIsExpanded(true);
    }
  }, [hasDescendantSelected]);

  // Smooth scroll exact element into middle of view when selected
  useEffect(() => {
    if (isSelected && elementRef.current) {
      // Tiny delay ensures parent components have expanded and DOM has reflowed
      const timer = setTimeout(() => {
        elementRef.current?.scrollIntoView({
          block: "center",
          behavior: "auto",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasChildren) return;

    // If collapsing parent and descendant is selected, re-select the parent!
    if (isExpanded && hasDescendantSelected) {
      onSelect(node.id);
    }

    setIsExpanded(!isExpanded);
  };

  const getRowClass = (_isClosingTag = false) => {
    let classes =
      "flex items-start group cursor-default rounded-sm transition-colors duration-75 max-w-full min-w-0 ";
    if (isSelected) classes += "bg-[#004a77] text-white ";
    else if (isCurrentMatch) classes += "bg-[#3d3d3d] ring-1 ring-inset ring-gray-500 ";
    else if (isSearchResult) classes += "bg-[#35363a] ";
    else classes += "hover:bg-[#3d3d3d] ";

    return classes;
  };

  if (node.type === "text") {
    return (
      <li
        className={`${getRowClass()} pl-8 break-all whitespace-normal`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverNode(node.id);
        }}
        ref={elementRef}
      >
        <span className={isSelected ? "text-white" : "text-[#eeeeee]"}>
          "<HighlightText query={searchQuery} text={node.val} />"
        </span>
      </li>
    );
  }

  if (node.type === "comment") {
    return (
      <li
        className={`${getRowClass()} pl-8`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverNode(node.id);
        }}
        ref={elementRef}
      >
        <span className={isSelected ? "text-white" : "text-[#89b482]"}>
          &lt;!-- <HighlightText query={searchQuery} text={node.val} /> --&gt;
        </span>
      </li>
    );
  }

  if (node.type === "doctype") {
    return (
      <li
        className={`${getRowClass()} pl-8`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverNode(node.id);
        }}
        ref={elementRef}
      >
        <span className={isSelected ? "text-white" : "text-gray-400"}>
          &lt;!DOCTYPE <HighlightText query={searchQuery} text={node.name} />
          &gt;
        </span>
      </li>
    );
  }

  if (node.type === "pseudo") {
    return (
      <li
        className={`${getRowClass()} pl-8`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverNode(node.id);
        }}
        ref={elementRef}
      >
        <span className={isSelected ? "text-white" : "text-[#e293ca]"}>
          ::
          <HighlightText query={searchQuery} text={node.pseudoType} />
        </span>
      </li>
    );
  }

  const renderAttributes = () => {
    if (!node.attrs) return null;
    return Object.entries(node.attrs).map(([key, val]) => {
      if (key === "class") {
        const mapResult = mapClass(val);
        return (
          <span className="ml-1.5 inline-block" key={key}>
            <span className="text-[#a8c7fa]">
              <HighlightText query={searchQuery} text={key} />
            </span>
            <span className="text-gray-400">=</span>
            <span className="text-[#fe8d59]">
              "
              {mapResult.tokens.map((token: Token, idx: number) => (
                <React.Fragment key={idx}>
                  {token.isMapped ? (
                    <span
                      onMouseEnter={(e: React.MouseEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        // Position tooltip above the element to avoid covering the cursor
                        onShowTooltip({
                          text: token.original,
                          x: rect.left,
                          y: rect.top - 24,
                        });
                      }}
                      onMouseLeave={onHideTooltip}
                    >
                      <HighlightText query={searchQuery} text={token.mapped} />
                    </span>
                  ) : (
                    <HighlightText query={searchQuery} text={token.mapped} />
                  )}
                  {idx < mapResult.tokens.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
              "
            </span>
          </span>
        );
      }

      return (
        <span className="ml-1.5 inline-block" key={key}>
          <span className="text-[#a8c7fa]">
            <HighlightText query={searchQuery} text={key} />
          </span>
          <span className="text-gray-400">=</span>
          <span className="text-[#fe8d59]">
            "<HighlightText query={searchQuery} text={val} />"
          </span>
        </span>
      );
    });
  };

  return (
    <li className="list-none max-w-full min-w-0">
      <div
        className={getRowClass()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverNode(node.id);
        }}
        ref={elementRef}
      >
        <div
          className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer select-none"
          onClick={handleToggle}
        >
          {hasChildren && (
            <span className={isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-200"}>
              {isExpanded ? (
                <ChevronDown size={14} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={14} strokeWidth={2.5} />
              )}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center min-w-0 pr-2 leading-5 whitespace-normal break-all">
          <span className="text-[#7cacf8] shrink-0 select-none">{"<"}</span>
          <span className="text-[#7cacf8] font-semibold">
            <HighlightText query={searchQuery} text={node.tag} />
          </span>
          {renderAttributes()}
          <span className="text-[#7cacf8] shrink-0 select-none">{">"}</span>

          {!isExpanded && hasChildren && (
            <>
              <span className="mx-1 px-1 bg-[#444] text-gray-300 rounded-sm text-[9px] border border-white/10 shrink-0 select-none">
                ...
              </span>
              <span className="text-[#7cacf8] shrink-0 select-none">{"</"}</span>
              <span className="text-[#7cacf8] font-semibold">
                <HighlightText query={searchQuery} text={node.tag} />
              </span>
              <span className="text-[#7cacf8] shrink-0 select-none">{">"}</span>
            </>
          )}

          {!hasChildren && (
            <>
              <span className="text-[#7cacf8] shrink-0 select-none">{"</"}</span>
              <span className="text-[#7cacf8] font-semibold">
                <HighlightText query={searchQuery} text={node.tag} />
              </span>
              <span className="text-[#7cacf8] shrink-0 select-none">{">"}</span>
            </>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <>
          <ul className="ml-[10px] border-l border-white/10 min-w-0 overflow-hidden">
            {node.children?.map((child: Node) => (
              <TreeNode
                key={child.id}
                mapClass={mapClass}
                node={child}
                onHideTooltip={onHideTooltip}
                onHoverNode={onHoverNode}
                onSelect={onSelect}
                onShowTooltip={onShowTooltip}
                searchIndex={searchIndex}
                searchQuery={searchQuery}
                searchResults={searchResults}
                selectedId={selectedId}
              />
            ))}
          </ul>

          <div
            className={getRowClass(true)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.id);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              onHoverNode(node.id);
            }}
          >
            <div className="w-5 h-5 shrink-0 select-none" />
            <div className="flex items-center leading-5">
              <span className="text-[#7cacf8] select-none">{"</"}</span>
              <span className="text-[#7cacf8] font-semibold">
                <HighlightText query={searchQuery} text={node.tag} />
              </span>
              <span className="text-[#7cacf8] select-none">{">"}</span>
            </div>
          </div>
        </>
      )}
    </li>
  );
};
