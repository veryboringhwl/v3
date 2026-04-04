// @deno-types="./module.ts"
import { RootModule } from "./module.js";
// @deno-types="./protocol.ts"
import { handleProtocol } from "./protocol.js";
// @deno-types="./transform.ts"
import { SourceFile, type Transformer } from "./transform.js";

type CHUNKS = Record<string, PromiseWithResolvers<void>>;

declare global {
	var __applyTransforms: typeof applyTransforms;
	var __interceptNavigationControlMessage: typeof interceptNavigationControlMessage;
	var __onScriptLoaded: (path: string) => void;
	var CHUNKS: CHUNKS;
}

export const applyTransforms = (path: string) => {
	const source = SourceFile.from(path);
	console.debug("loadResource", source);
	return source.getObjectURL();
};
globalThis.__applyTransforms = applyTransforms;

const spotifyAppScheme = "spotify:app:";
function interceptNavigationControlMessage(e: Event): boolean {
	const uri: string = (e as any).data.data;
	if (!uri.startsWith(spotifyAppScheme)) {
		return false;
	}

	const url = new URL(uri.slice(spotifyAppScheme.length));
	if (url.protocol !== "rpc:") {
		return false;
	}

	if (url.pathname.startsWith("reload")) {
		const modules = url.searchParams.getAll("module");
		if (modules.length === 0) {
			document.location.reload();
		} else {
			(async () => {
				for (const identifier of modules) {
					const instance =
						RootModule.INSTANCE.getDescendant(identifier)?.getEnabledInstance();
					if (!instance) {
						continue;
					}

					if (await instance.unload()) {
						await instance.load();
					}
				}
			})();
		}
	} else if (url.pathname.startsWith("spicetify")) {
		handleProtocol(url.pathname);
	}

	return true;
}

globalThis.__interceptNavigationControlMessage =
	interceptNavigationControlMessage;

globalThis.CHUNKS = {};

export const CHUNKS: CHUNKS = globalThis.CHUNKS as CHUNKS;
globalThis.__onScriptLoaded = (path: string) => {
	CHUNKS[path] ??= Promise.withResolvers();
	setTimeout(CHUNKS[path].resolve);
};

export default async function (transformer: Transformer) {
	// 1.2.86
	// transformer(
	// 	(emit) => (str) => {
	// 		emit();

	// 		// JS: make the chunk loader async
	// 		str = str.replace(
	// 			/(=)(function\([\w$,]+\)\{)(?=(?:(?!function\()[\s\S])*?[\w$]+=Error\(\))/,
	// 			"$1async $2",
	// 		);

	// 		// JS: wrap URL — only place a concat expr sits beside Error()
	// 		str = str.replace(
	// 			/(?<=[\w$]+=)([\w$.]+\+[\w$.]+\([^)]+\))(?=,[\w$]+=Error\(\))/,
	// 			"await __applyTransforms($1)",
	// 		);

	// 		// CSS: make the Promise executor async
	// 		str = str.replace(
	// 			/new Promise\(function(\([\w$,]+\)\{var [\w$]+=[\w$]+\.miniCssF\()/,
	// 			"new Promise(async function$1",
	// 		);

	// 		// CSS: wrap URL — was missing . in character class so u.p wouldn't match
	// 		str = str.replace(
	// 			/(?<=\.miniCssF\([^)]+\),[\w$]+=)([\w$.]+\+[\w$]+)/,
	// 			"await __applyTransforms($1)",
	// 		);
	// 		return str;
	// 	},
	// 	{
	// 		glob: /^\/xpui-snapshot\.js/,
	// 	},
	// );

	transformer(
		(emit) => (str) => {
			emit();

			str = str.replace(
				/(([a-zA-Z_$][\w$]*)=([a-zA-Z_$][\w$]*)\.p\+\3\.u\([a-zA-Z_$][\w$]*\))/,
				"$1,$2=await __applyTransforms($2)",
			);

			const i = str.search('"Loading chunk "');
			if (i !== -1) {
				const head = str.slice(0, i);
				const matches = [...head.matchAll(/=\(([a-zA-Z_$][\w$]*,?)*\)=>\{/g)];
				if (matches.length > 0) {
					const lastMatch = matches[matches.length - 1];
					const index = lastMatch.index;
					// index + 1 places "async" right after the "=" (e.g., o.f.j=async(t,n)=>{)
					str = `${str.slice(0, index + 1)}async${str.slice(index + 1)}`;
				}
			}

			str = str.replace(
				/(new Promise\()(\((?:[a-zA-Z_$][\w$]*,?)*\)=>\{(?:var )?([a-zA-Z_$][\w$]*)=([a-zA-Z_$][\w$]*)\.miniCssF\([a-zA-Z_$][\w$]*\),([a-zA-Z_$][\w$]*)=\4\.p\+\3)/,
				"$1async$2,$5=await __applyTransforms($5)",
			);

			return str;
		},
		{
			glob: /^\/xpui-snapshot\.js/,
		},
	);

	//  Fixes some components' displayNames not being available as they're forwarded by the React profiler.
	//  This patch assigns the displayName to the exported function, while still allowing the React profiler to function properly.
	// transformer(
	// 	(emit) => (str) => {
	// 		emit();

	// 		str = str.replace(
	// 			/return (\w+)\.displayName=`profiler\(/,
	// 			"$1.toString=arguments[0].toString.bind(arguments[0]);$&",
	// 		);

	// 		return str;
	// 	},
	// 	{
	// 		glob: /^\/xpui-modules\.js/,
	// 	},
	// );

	// sentry works if spotif ver is <30 days so make it never
	transformer(
		(emit) => (str) => {
			emit();

			str = str.replace("/864e5<30", "<0");

			return str;
		},
		{
			glob: /^\/xpui-snapshot\.js/,
		},
	);

	// transformer(
	//   (emit) => (str) => {
	//     emit();

	//     str = str.replace(
	//       /("incognito-enabled":[a-zA-Z_\$][\w\$]*)/,
	//       '$1,employee:"1"',
	//     );
	//     str = str.replace(
	//       /([a-zA-Z_\$][\w\$]*)\("app\.enable-developer-mode",([a-zA-Z_\$][\w\$]*)\)/,
	//       '$1("app.enable-developer-mode",$2);$1("app-developer",$2?2:0)',
	//     );

	//     return str;
	//   },
	//   {
	//     glob: /^\/xpui\.js/,
	//   },
	// );

	transformer(
		(emit) => (str) => {
			emit();

			str = str.replace(
				/(([a-zA-Z_$][\w$]*)\.data\.type===(?:[a-zA-Z_$][\w$]*\.){2}NAVIGATION)\s*\?/,
				"$1&&!__interceptNavigationControlMessage($2)?",
			);

			return str;
		},
		{
			glob: /^\/xpui-snapshot\.js/,
		},
	);

	transformer(
		(emit) => (str, path) => {
			emit();

			str += `;\n__onScriptLoaded("${path}");`;

			return str;
		},
		{
			glob: /\.js$/,
			wait: false,
		},
	);
}
