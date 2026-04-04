use crate::config::PluginConfig;
use swc_core::ecma::ast::{
    CallExpr, Callee, ExportAll, Expr, ExprOrSpread, ImportDecl, Lit, NamedExport, Str,
};
use swc_core::ecma::visit::{VisitMut, VisitMutWith};

pub struct TransformVisitor {
    pub config: PluginConfig,
}

impl TransformVisitor {
    fn value_to_string(value: &swc_core::atoms::Wtf8Atom) -> String {
        value
            .as_str()
            .map_or_else(|| value.to_string_lossy().into_owned(), ToString::to_string)
    }

    fn rewrite_import_path(&self, path: String) -> String {
        self.config.rules.iter().fold(path, |path, (regex, repl)| {
            regex.replace_all(&path, repl).into_owned()
        })
    }

    fn rewrite_import_specifier(&self, specifier: &str) -> Option<String> {
        let source_specifier = specifier;

        if specifier.starts_with("http://") || specifier.starts_with("https://") {
            return None;
        }

        let new_specifier = self.rewrite_import_path(specifier.to_string());

        if new_specifier == source_specifier {
            return None;
        }

        Some(new_specifier)
    }
}

impl VisitMut for TransformVisitor {
    fn visit_mut_import_decl(&mut self, n: &mut ImportDecl) {
        n.visit_mut_children_with(self);

        let specifier = Self::value_to_string(&n.src.value);
        if let Some(remapped) = self.rewrite_import_specifier(&specifier) {
            n.src = Box::new(remapped.into());
        }
    }

    fn visit_mut_named_export(&mut self, n: &mut NamedExport) {
        n.visit_mut_children_with(self);

        if let Some(src) = &n.src {
            let specifier = Self::value_to_string(&src.value);
            if let Some(remapped) = self.rewrite_import_specifier(&specifier) {
                n.src = Some(Box::new(remapped.into()));
            }
        }
    }

    fn visit_mut_export_all(&mut self, n: &mut ExportAll) {
        n.visit_mut_children_with(self);

        let specifier = Self::value_to_string(&n.src.value);
        if let Some(remapped) = self.rewrite_import_specifier(&specifier) {
            n.src = Box::new(remapped.into());
        }
    }

    fn visit_mut_call_expr(&mut self, n: &mut CallExpr) {
        n.visit_mut_children_with(self);

        if let Callee::Import(_) = n.callee {
            if let Some(arg) = n.args.first() {
                if let Expr::Lit(Lit::Str(lit_str)) = *arg.expr.clone() {
                    let maybe_rewritten =
                        self.rewrite_import_specifier(&Self::value_to_string(&lit_str.value));
                    if let Some(rewritten) = maybe_rewritten {
                        let replacer = Expr::Lit(Lit::Str(Str {
                            span: lit_str.span,
                            value: rewritten.into(),
                            raw: None,
                        }));
                        n.args[0] = ExprOrSpread {
                            spread: None,
                            expr: Box::new(replacer),
                        };
                    }
                }
            }
        }
    }
}
