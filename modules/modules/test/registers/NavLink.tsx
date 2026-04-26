import { NavLink } from "/modules/stdlib/src/registers/navlink.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

const Icon = () => (
  <UI.Icon size="medium" viewBox="0 0 24 24">
    <path
      d="M3 3h2l.5 3m0 0L7 15h11l3-9H5.5z"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <circle
      cx="8"
      cy="20"
      r="1"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <circle
      cx="17"
      cy="20"
      r="1"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </UI.Icon>
);

const ActiveIcon = () => (
  <UI.Icon size="medium" viewBox="0 0 24 24">
    <path d="M18 15H7L5.5 6H21l-3 9z" fill="currentColor" />
    <path
      d="M3 3h2l.5 3m0 0L7 15h11l3-9H5.5z"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <circle
      cx="8"
      cy="20"
      r="1"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <circle
      cx="17"
      cy="20"
      r="1"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </UI.Icon>
);

export const TestNavLink = () => (
  <NavLink
    activeIcon={<ActiveIcon />}
    appRoutePath="/spicetify/test/"
    icon={<Icon />}
    localizedApp="Stdlib Test"
  />
);
