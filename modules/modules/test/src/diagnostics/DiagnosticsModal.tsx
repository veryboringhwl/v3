import { TopNavBar } from "/modules/stdlib/lib/components/MountedNavBar.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";

const TEST_CATEGORIES = ["overview", "details", "settings"];

export const DiagnosticsModal = () => {
  const [selected, setSelected] = React.useState(TEST_CATEGORIES[0]);

  return (
    <div className="test-container" style={{ padding: "20px" }}>
      <TopNavBar categories={TEST_CATEGORIES} namespace="test" selectedCategory={selected} />

      <div style={{ marginTop: "60px", color: "white", display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0 }}>Stdlib Test Module</h3>
        <p style={{ margin: 0 }}>
          Selected category: {selected}. Open <strong>/test</strong> for the manual component
          playground.
        </p>

        <button
          onClick={() => setSelected(TEST_CATEGORIES[1])}
          style={{ color: "black", padding: "5px" }}
          type="button"
        >
          Switch Category
        </button>
      </div>
    </div>
  );
};
