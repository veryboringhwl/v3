import { NavLink } from "/modules/stdlib/src/registers/navlink.tsx";
import { MarketplaceActiveIcon, MarketplaceIcon } from "../icons/MarketplaceIcon.tsx";

export const MarketplaceNavLink = () => {
  return (
    <NavLink
      activeIcon={<MarketplaceActiveIcon />}
      appRoutePath="/spicetify/marketplace/"
      icon={<MarketplaceIcon />}
      localizedApp="Marketplace"
    />
  );
};
