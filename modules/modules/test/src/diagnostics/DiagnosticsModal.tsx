import { React } from "/modules/stdlib/src/expose/React.ts";
import { TopNavBar } from "/modules/stdlib/lib/components/MountedNavBar.tsx";

const TEST_CATEGORIES = ["overview", "details", "settings"];

export const DiagnosticsModal = () => {
  const [selected, setSelected] = React.useState(TEST_CATEGORIES[0]);

  return (
    <div className="test-container" style={{ padding: "20px" }}>
      <TopNavBar namespace="test" categories={TEST_CATEGORIES} selectedCategory={selected} />

      <div style={{ marginTop: "60px", color: "white", display: "grid", gap: "10px" }}>
        <h3 style={{ margin: 0 }}>Stdlib Test Module</h3>
        <p style={{ margin: 0 }}>
          Selected category: {selected}. Open <strong>/test</strong> for the manual component
          playground.
        </p>

        <button
          type="button"
          onClick={() => setSelected(TEST_CATEGORIES[1])}
          style={{ color: "black", padding: "5px" }}
        >
          Switch Category
        </button>
      </div>
    </div>
  );
};
