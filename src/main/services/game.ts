interface GameState {
    installedVersion: string | null
    availableVersion: string | null
    releaseDate: string | null
    status: 'not-installed' | 'up-to-date' | 'update-available' | 'checking'
}

  // Mock initial
const serverStatus = {
    status: 'available' as 'available' | 'unavailable' | 'degraded',
    players: 42,
    statusPageUrl: 'https://status.dyingstar.example.com'
}