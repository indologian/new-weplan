import { themeConfig as elegantGreen } from "./elegant-green/config";

export interface ThemeCatalogEntry {
	name: string;
	rendererKey: string;
	slug: string;
}

const themeCatalog: readonly ThemeCatalogEntry[] = [elegantGreen];

export function getThemeBySlug(slug: string): ThemeCatalogEntry | null {
	return themeCatalog.find((theme) => theme.slug === slug) ?? null;
}
