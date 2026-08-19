const GLOBAL_KEY = Symbol.for('hok.test.app')

export async function getApp() {
  const existing = globalThis[GLOBAL_KEY]
  if (existing) return existing

  const mod = await import('../src/app.js')
  const app = mod.app
  globalThis[GLOBAL_KEY] = app
  return app
}
