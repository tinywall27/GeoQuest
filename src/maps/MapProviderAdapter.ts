export type MapViewport = {
  longitude: number;
  latitude: number;
  zoom: number;
};

export type MapAttribution = {
  label: string;
  url?: string;
  reviewNumber?: string;
};

export type MapFallback = {
  kind: "static-image" | "local-vector" | "local-raster";
  path: string;
  alt: string;
};

export interface MapProviderConfig {
  id: string;
  name: string;
  styleUrl?: string;
  attribution: MapAttribution[];
  fallback: MapFallback;
  reviewed: boolean;
}

export interface MapProviderAdapter {
  readonly config: MapProviderConfig;
  mount(container: HTMLElement, initialViewport: MapViewport): Promise<void>;
  setViewport(viewport: MapViewport): void;
  resize(): void;
  destroy(): void;
}

export function assertApprovedMapProvider(config: MapProviderConfig): void {
  if (!config.reviewed) {
    throw new Error(`地图提供商 ${config.id} 尚未通过发布审核`);
  }
  if (config.attribution.length === 0) {
    throw new Error(`地图提供商 ${config.id} 缺少可见署名`);
  }
}
