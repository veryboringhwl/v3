import { React } from "/modules/stdlib/src/expose/React.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

interface ShelfProps {
  title: string;
  children: React.ReactElement | React.ReactElement[];
}

const Shelf = ({ title, children }: ShelfProps): React.ReactElement => (
  <section className="main-shelf-shelf Shelf">
    <div className="main-shelf-header">
      <div className="main-shelf-topRow">
        <div className="main-shelf-titleWrapper">
          <UI.Type as="h2" semanticColor="textBase" variant="canon">
            {title}
          </UI.Type>
        </div>
      </div>
    </div>
    <section>{children}</section>
  </section>
);

export default React.memo(Shelf);
