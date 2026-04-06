import { webpackRequire } from "../wpunpk.mix.ts";
import { matchWebpackModule } from "../wpunpk.ts";
import { fnStr } from "/hooks/util.ts";

export * from "./ReactComponents.gen.ts";

// export let Slider: React.FC<any>;
export let Toggle: React.FC<any>;
export let TracklistRow: React.FC<any>;

// postWebpackRequireHooks.push($ => {
// matchWebpackModule((id, module) => {
// 	const moduleStr = module.toString();
// 	return moduleStr.includes('"data-testid":"progress-bar"');
// }, (id, $) => {
// 	const module = webpackRequire(id);
// 	Slider = Object.values(module)[0];
// });

matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes('"_nD_jYvjV80Rf8sX"');
  },
  (id, _$) => {
    const module = webpackRequire(id);
    Toggle = Object.values(module)[0];
  },
);

matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes('"data-testid":"track-icon"');
  },
  async (id, _$) => {
    //! HACKY ALERT (this module depennds on chunks that aren't loaded yet)
    await new Promise(setTimeout);
    const module = webpackRequire(id);
    TracklistRow = Object.values(module)[0];
  },
);
// })
