export function getMusicProvider() {
  const provider = (process.env.MUSIC_PROVIDER || 'ai33').toLowerCase().trim()
  return provider === 'suno' ? 'suno' : 'ai33'
}

export function isSunoProvider() {
  return getMusicProvider() === 'suno'
}

export function isAi33Provider() {
  return getMusicProvider() === 'ai33'
}
