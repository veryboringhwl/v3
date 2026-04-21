import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) => (
  <div className="test-section">
    <div className="test-section__header">
      <UI.Text variant="titleMedium">{title}</UI.Text>
      {description ? (
        <UI.Text semanticColor="textSubdued" variant="bodySmall">
          {description}
        </UI.Text>
      ) : null}
    </div>
    {children}
  </div>
);
