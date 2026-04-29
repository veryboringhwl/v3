import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.xpui.ts";

// this entire thing is ai generated
// hope it works

const { useEffect, useMemo, useState } = React;
const RemoteConfigDebugAPI = Platform.getRemoteConfigDebugAPI();
const SOURCE_FILTERS = ["all", "web", "native"] as const;

const PropertyRow = ({ property, onOverride }) => {
  // Normalize types from the JSON (e.g. "boolean", "enum", "number")
  const propType = (property.type || "").toLowerCase();

  const isBool = propType === "boolean";
  const isEnum = propType === "enum";
  const isNumber = propType === "number";

  // Use the spec's defaultValue if the local or remote value is null
  const displayLocalValue = property.localValue ?? property.spec?.defaultValue;
  const displayRemoteValue = property.remoteValue ?? property.spec?.defaultValue;

  // An item is overridden if localValue is explicitly different from remoteValue
  const isOverridden = property.localValue !== property.remoteValue;

  const sourceName = property.source ? property.source.toString().toLowerCase() : "unknown";

  let control: React.ReactNode;
  if (isBool) {
    control = (
      <select
        onChange={(e) => onOverride(property, e.target.value === "true")}
        style={styles.select}
        value={String(displayLocalValue)}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  } else if (isEnum) {
    const options = property.spec?.values || [];
    control = (
      <select
        onChange={(e) => onOverride(property, e.target.value)}
        style={styles.select}
        value={String(displayLocalValue)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  } else if (isNumber) {
    control = (
      <input
        max={property.spec?.upper}
        min={property.spec?.lower}
        onChange={(e) => onOverride(property, parseFloat(e.target.value))}
        style={styles.input}
        type="number"
        value={displayLocalValue ?? ""}
      />
    );
  } else {
    control = (
      <input
        onChange={(e) => onOverride(property, e.target.value)}
        style={styles.input}
        type="text"
        value={displayLocalValue || ""}
      />
    );
  }

  return (
    <div
      style={{
        ...styles.row,
        backgroundColor: isOverridden ? "rgba(255, 255, 255, 0.05)" : "transparent",
      }}
    >
      <div style={styles.colMain}>
        <UI.Text
          semanticColor={isOverridden ? "textBrightAccent" : "textBase"}
          variant="bodyMediumBold"
        >
          {property.name}
        </UI.Text>
        <UI.Text semanticColor="textSubdued" variant="bodySmall">
          {property.description || "No description provided."}
        </UI.Text>
        <div style={{ marginTop: 4 }}>
          <UI.Text semanticColor="textSubdued" variant="marginal">
            Source: {sourceName} {property.component ? `(${property.component})` : ""}
          </UI.Text>
        </div>
      </div>
      <div style={styles.colValue}>
        <UI.Text semanticColor="textSubdued" variant="bodySmall">
          {String(displayRemoteValue)}
        </UI.Text>
      </div>
      <div style={styles.colControl}>{control}</div>
    </div>
  );
};

export const Menu = ({ onClose }) => {
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("web");
  const [needsRestart, setNeedsRestart] = useState(false);

  const loadProperties = async () => {
    try {
      const props = await RemoteConfigDebugAPI.getProperties();
      setProperties(props || []);
    } catch (err) {
      console.error("Failed to fetch Remote Config Properties:", err);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Handle overrides
  const handleOverride = async (property, newValue) => {
    try {
      await RemoteConfigDebugAPI.setOverride(property, newValue);

      const isNative = property.source?.toString().toLowerCase() === "native";
      if (isNative) {
        setNeedsRestart(true);
      }

      await loadProperties(); // Refresh UI to reflect changes
    } catch (err) {
      console.error(`Failed to override ${property.name}:`, err);
    }
  };

  const handleClearAll = async () => {
    try {
      await RemoteConfigDebugAPI.clearOverrides();
      setNeedsRestart(true);
      await loadProperties();
    } catch (err) {
      console.error("Failed to clear overrides:", err);
    }
  };

  // Filter and Sort properties
  const filteredProperties = useMemo(() => {
    let filtered = properties;

    // 1. Source Filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((p) => p.source?.toString().toLowerCase() === sourceFilter);
    }

    // 2. Text Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.component?.toLowerCase().includes(q),
      );
    }

    // 3. Sort (Overridden items first, then alphabetical)
    return [...filtered].sort((a, b) => {
      const aOverridden = a.localValue !== a.remoteValue;
      const bOverridden = b.localValue !== b.remoteValue;

      if (aOverridden && !bOverridden) return -1;
      if (!aOverridden && bOverridden) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [properties, searchQuery, sourceFilter]);

  return (
    <div className={MAP.modal.widget_generator.container} style={styles.container}>
      <div className={MAP.modal.widget_generator.header.container} style={styles.header}>
        <UI.Text as="h1" variant="titleSmall">
          Experimental Features
        </UI.Text>
        <button
          className={MAP.modal.widget_generator.header.close}
          onClick={onClose}
          style={styles.closeBtn}
        >
          <UI.Icon fill="currentcolor" height="16" viewBox="0 0 16 16" width="16">
            <path d="M2.47 2.47a.75.75 0 0 1 1.06 0L8 6.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L9.06 8l4.47 4.47a.75.75 0 1 1-1.06 1.06L8 9.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L6.94 8 2.47 3.53a.75.75 0 0 1 0-1.06Z" />
          </UI.Icon>
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.chipContainer}>
          {SOURCE_FILTERS.map((opt) => (
            <UI.Chip
              aria-checked={sourceFilter === opt}
              key={opt}
              onClick={() => setSourceFilter(opt)}
              role="radio"
              selected={sourceFilter === opt}
              selectedColorSet="invertedLight"
              size="sm"
              variant={sourceFilter === opt ? "contrasting" : "tinted"}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </UI.Chip>
          ))}
        </div>

        {/* Search Input */}
        <input
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter features..."
          style={styles.searchInput}
          type="text"
          value={searchQuery}
        />

        {/* Clear Overrides Button */}
        <button onClick={handleClearAll} style={styles.clearBtn}>
          Clear All Overrides
        </button>
      </div>

      {needsRestart && (
        <div style={styles.warningBanner}>
          <UI.Text variant="bodySmallBold">
            Restart required for some native overrides to take effect.
          </UI.Text>
          <button onClick={() => location.reload()} style={styles.reloadBtn}>
            Reload Now
          </button>
        </div>
      )}

      <div className={MAP.modal.widget_generator.content.container} style={styles.content}>
        <div style={styles.tableHeader}>
          <div style={styles.colMain}>
            <UI.Text variant="marginalBold">Feature</UI.Text>
          </div>
          <div style={styles.colValue}>
            <UI.Text variant="marginalBold">Default / Remote</UI.Text>
          </div>
          <div style={styles.colControl}>
            <UI.Text variant="marginalBold">Local Override</UI.Text>
          </div>
        </div>

        <div style={styles.list}>
          {filteredProperties.length > 0 ? (
            filteredProperties.map((prop) => (
              <PropertyRow key={prop.name} onOverride={handleOverride} property={prop} />
            ))
          ) : (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <UI.Text semanticColor="textSubdued" variant="bodyMedium">
                No features found.
              </UI.Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Internal inline styles
const styles = {
  container: {
    width: "75vw",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background-base, #121212)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-subdued)",
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    padding: "16px 24px",
    gap: "12px",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  chipContainer: {
    display: "flex",
    gap: "8px",
  },
  searchInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "var(--text-base)",
    fontSize: "14px",
  },
  clearBtn: {
    padding: "8px 16px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "var(--text-base)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  warningBanner: {
    backgroundColor: "rgba(233, 20, 41, 0.2)",
    padding: "10px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#f15e6c",
  },
  reloadBtn: {
    background: "#f15e6c",
    color: "#fff",
    border: "none",
    padding: "4px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    padding: "8px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "0 12px",
  },
  row: {
    display: "flex",
    padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    alignItems: "center",
    borderRadius: "4px",
  },
  colMain: {
    flex: 1,
    paddingRight: "16px",
  },
  colValue: {
    width: "150px",
    paddingRight: "16px",
  },
  colControl: {
    width: "150px",
  },
  select: {
    width: "100%",
    padding: "6px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "none",
    borderRadius: "4px",
  },
  input: {
    width: "100%",
    padding: "6px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "none",
    borderRadius: "4px",
  },
};
