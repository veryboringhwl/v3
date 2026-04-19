import { proxy } from "/hooks/util/proxy.ts";
import { React, ReactDOM } from "/modules/stdlib/src/expose/React.ts";
import { useQuery } from "/modules/stdlib/src/webpack/ReactQuery.ts";
import { t } from "../../../shared/i18n.ts";
import { renderMarkdown } from "../services/markdownService.ts";

const isAbsoluteHttpUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

interface ShadowRootProps {
  mode: "open" | "closed";
  delegatesFocus: boolean;
  styleSheets: CSSStyleSheet[];
  children: React.ReactNode;
}

const ShadowRoot = ({ mode, delegatesFocus, styleSheets, children }: ShadowRootProps) => {
  const node = React.useRef<HTMLDivElement>(null);
  const [root, setRoot] = React.useState<ShadowRoot>(null!);

  React.useLayoutEffect(() => {
    if (!node.current) {
      return;
    }

    const shadow = node.current.attachShadow({
      mode,
      delegatesFocus,
    });

    if (styleSheets.length > 0) {
      shadow.adoptedStyleSheets = styleSheets;
    }

    setRoot(shadow);
  }, [delegatesFocus, mode, styleSheets]);

  const content = root
    ? (ReactDOM.createPortal(children as any, root as any) as unknown as React.ReactNode)
    : null;
  return <div ref={node}>{content}</div>;
};

export const RemoteMarkdown = ({
  url,
  emptyText = t("marketplace.state.noReadme"),
}: {
  url?: string;
  emptyText?: string;
}) => {
  const query = useQuery({
    queryKey: ["mkp-remote-markdown", url],
    queryFn: async () => {
      if (!url) {
        return null;
      }

      let request: RequestInfo | URL;
      if (isAbsoluteHttpUrl(url)) {
        request = proxy(url)[0];
      } else {
        request = url;
      }

      const markdown = await fetch(request).then((response) => response.text());
      return await renderMarkdown(markdown);
    },
    enabled: !!url,
  });

  if (!url) {
    return <div className="mkp-state">{emptyText}</div>;
  }

  const fixRelativeImports = (markdown: string) =>
    markdown.replace(/(src|href)="\.\//g, `$1="${url}/../`);

  switch (query.status) {
    case "pending":
      return <div className="mkp-state">{t("marketplace.state.loadingReadme")}</div>;
    case "error":
      return (
        <div className="mkp-state mkp-state--error">{t("marketplace.state.failedReadme")}</div>
      );
    case "success": {
      const html = query.data ? fixRelativeImports(query.data) : emptyText;
      return (
        <ShadowRoot delegatesFocus={true} mode="open" styleSheets={[]}>
          <style>@import "https://cdn.jsdelivr.xyz/npm/water.css@2/out/water.css";</style>
          <div
            className="select-text"
            dangerouslySetInnerHTML={{ __html: html }}
            id="module-readme"
          />
        </ShadowRoot>
      );
    }
  }
};
