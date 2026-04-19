import type { Metadata, Module, ModuleIdentifier, ModuleInstance, Version } from "/hooks/module.ts";

export interface MarketplaceCatalogItem {
  identifier: ModuleIdentifier;
  module: Module;
  instance: ModuleInstance;
  instances: ModuleInstance[];
  metadata: Metadata | null;
  version: Version;
}

export type MarketplaceActionKind =
  | "add"
  | "install"
  | "enable"
  | "disable"
  | "load"
  | "unload"
  | "delete"
  | "remove"
  | "none";

export interface MarketplaceActionDescriptor {
  kind: MarketplaceActionKind;
  label: string;
  disabled?: boolean;
}

export interface MarketplaceBatchResult {
  ok: boolean;
  error?: string;
  enabledCount?: number;
}
