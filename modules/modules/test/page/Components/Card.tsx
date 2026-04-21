import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

export type CardPropDoc = {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
};

export const Card = ({
  title,
  subtitle,
  props,
  children,
}: {
  title: string;
  subtitle?: string;
  props?: CardPropDoc[];
  children: React.ReactNode;
}) => {
  return (
    <div className="test-card">
      <div className="test-card__header">
        <UI.Text semanticColor="textBrightAccent" variant="titleMedium">
          {title}
        </UI.Text>
        {subtitle ? (
          <UI.Text semanticColor="textSubdued" variant="bodySmall">
            {subtitle}
          </UI.Text>
        ) : null}
      </div>

      <div className="test-card__preview">{children}</div>

      {props?.length ? (
        <div className="test-card__props">
          <div className="test-card__props-title">
            <UI.Text variant="bodyMediumBold">Props</UI.Text>
          </div>
          <div className="test-card__props-list">
            {props.map((prop) => (
              <div className="test-card__prop-row" key={prop.name}>
                <div className="test-card__prop-header">
                  <UI.Text variant="bodySmallBold">{prop.name}</UI.Text>
                  <UI.Text semanticColor="textSubdued" variant="marginal">
                    {prop.type}
                  </UI.Text>
                  {prop.required ? (
                    <UI.Text semanticColor="textBrightAccent" variant="marginal">
                      required
                    </UI.Text>
                  ) : null}
                  {prop.defaultValue ? (
                    <UI.Text semanticColor="textSubdued" variant="marginal">
                      default: {prop.defaultValue}
                    </UI.Text>
                  ) : null}
                </div>
                {prop.description ? (
                  <UI.Text semanticColor="textSubdued" variant="marginal">
                    {prop.description}
                  </UI.Text>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
