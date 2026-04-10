import type { ModuleInstance } from "/hooks/module.ts";
import { createRegistrar } from "/modules/stdlib/mod.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { TopbarRightButton } from "/modules/stdlib/src/registers/topbarRightButton.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Dialog } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { Menu } from "./modal.tsx";

export let module: ModuleInstance;

const Icon = () => (
  <UI.Icon fill="currentcolor" height="16" viewBox="0 0 863 924" width="16">
    <g transform="translate(0,924) scale(0.1,-0.1)">
      <path d="M3725 9160 c-148 -4 -306 -10 -350 -14 -117 -11 -190 -49 -291 -150 -132 -133 -170 -234 -162 -431 7 -163 50 -255 185 -396 l64 -66 -10 -994 c-13 -1268 -15 -1302 -63 -1494 -87 -352 -263 -756 -511 -1172 -111 -186 -705 -1084 -1371 -2073 -537 -797 -585 -882 -607 -1090 -33 -317 39 -586 218 -810 114 -142 229 -235 386 -311 90 -43 116 -51 217 -65 209 -27 723 -33 2725 -33 2278 1 3098 9 3190 32 231 59 482 234 607 423 142 215 195 408 185 674 -9 241 -46 337 -240 634 -53 81 -97 156 -97 167 0 10 -6 19 -13 19 -19 0 -1264 1863 -1621 2424 -166 261 -361 668 -444 928 -42 129 -88 314 -107 428 -20 119 -34 783 -34 1683 l-1 629 80 91 c125 142 170 250 170 408 0 96 -16 162 -61 255 -74 152 -221 264 -371 284 -182 25 -1072 35 -1673 20z m1574 -388 c89 -20 141 -84 141 -172 0 -47 -5 -64 -30 -98 -16 -23 -38 -46 -50 -52 -45 -24 -311 -33 -985 -33 -764 0 -958 8 -1004 44 -42 33 -71 89 -71 138 0 56 34 127 69 145 30 16 151 35 256 40 159 7 1633 -3 1674 -12z m-116 -839 c11 -175 18 -570 27 -1378 9 -824 10 -825 70 -1066 81 -320 193 -597 398 -984 178 -337 326 -569 1065 -1663 186 -277 337 -505 335 -508 -3 -2 -1223 -3 -2712 -2 l-2707 3 82 120 c45 66 290 431 544 810 437 654 626 953 779 1233 229 416 404 893 445 1207 21 158 31 532 31 1175 0 360 3 766 7 902 l6 247 126 4 c69 1 435 4 812 5 l686 2 6 -107z" />
    </g>
  </UI.Icon>
);

export const TopbarButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Dialog
        animated={true}
        isOpen={isOpen}
        onCancel={handleClose}
        onClose={handleClose}
        unmountWhenClose={false}
      >
        <Menu onClose={handleClose} />
      </Dialog>
      <TopbarRightButton
        icon={<Icon />}
        label="Experimental Features"
        onClick={() => setIsOpen(true)}
      />
    </>
  );
};

export default function (mod: ModuleInstance) {
  module = mod;
  const registrar = createRegistrar(mod);
  registrar.register("topbarRightButton", <TopbarButton />);
}
