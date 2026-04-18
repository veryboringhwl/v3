import { TopNavBar } from "/modules/stdlib/lib/components/MountedNavBar.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { categories, selectedCategoryCtx } from "../../app.tsx";

interface PageContainerProps {
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

const PageContainer = ({ title, headerLeft, headerRight, children }: PageContainerProps) => {
  const selectedCategory = React.useContext(selectedCategoryCtx);
  return (
    <section className="contentSpacing">
      <div className="page-header">
        <div className="header-left">
          <UI.Type as="h1" semanticColor="textBase" variant="canon">
            {title}
          </UI.Type>
          {headerLeft}
          <TopNavBar
            categories={categories}
            namespace="stats"
            selectedCategory={selectedCategory}
          />
        </div>
        <div className="header-right">{headerRight}</div>
      </div>
      <div className={"page-content"}>{children}</div>
    </section>
  );
};

export default PageContainer;
