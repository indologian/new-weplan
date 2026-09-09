import { ElegantGreenTheme } from './elegant-green'
import type { ThemeComponent } from './types'

const registry: Record<string, ThemeComponent> = {
	'elegant-green': ElegantGreenTheme,
}

export function getThemeRenderer(rendererKey: string): ThemeComponent | null {
	return registry[rendererKey] || null
}

