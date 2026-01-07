/**
 * SoundCloud API Client with OAuth 2.1 Authentication
 * Uses Client Credentials flow for server-to-server access
 */

export class SoundCloudClient {
  constructor (clientId, clientSecret) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.baseUrl = 'https://api.soundcloud.com'
    this.apiV2Url = 'https://api-v2.soundcloud.com'
    this.tokenUrl = 'https://secure.soundcloud.com/oauth/token'
    this.accessToken = null
    this.tokenExpiry = null
  }

  /**
   * Get access token using Client Credentials flow
   * @returns {Promise<string>} Access token
   */
  async getAccessToken () {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      // Create Basic Auth header
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${error}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000)

      return this.accessToken
    } catch (error) {
      throw new Error(`Error getting access token: ${error.message}`)
    }
  }

  /**
   * Make authenticated API request
   * @param {string} url - API endpoint URL
   * @returns {Promise<Object>} Response data
   */
  async authenticatedRequest (url) {
    const token = await this.getAccessToken()

    const response = await fetch(url, {
      headers: {
        Authorization: `OAuth ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get user information by username or user ID
   * @param {string} identifier - Username or user ID
   * @returns {Promise<Object>} User data
   */
  async getUser (identifier) {
    const url = `${this.baseUrl}/users/${identifier}`

    try {
      return await this.authenticatedRequest(url)
    } catch (error) {
      throw new Error(`Error fetching user data: ${error.message}`)
    }
  }

  /**
   * Resolve a SoundCloud URL to get user or track information
   * @param {string} soundcloudUrl - SoundCloud profile or track URL
   * @returns {Promise<Object>} Resolved resource data
   */
  async resolve (soundcloudUrl) {
    const url = `${this.baseUrl}/resolve?url=${encodeURIComponent(soundcloudUrl)}`

    try {
      return await this.authenticatedRequest(url)
    } catch (error) {
      throw new Error(`Error resolving URL: ${error.message}`)
    }
  }

  /**
   * Get latest tracks from a user
   * @param {number} userId - SoundCloud user ID
   * @param {number} limit - Number of tracks to retrieve (default: 10)
   * @returns {Promise<Array>} Array of track objects
   */
  async getUserTracks (userId, limit = 10) {
    const url = `${this.baseUrl}/users/${userId}/tracks?limit=${limit}&linked_partitioning=1`

    try {
      const data = await this.authenticatedRequest(url)
      return data.collection || []
    } catch (error) {
      throw new Error(`Error fetching user tracks: ${error.message}`)
    }
  }

  /**
   * Format track information for display
   * @param {Object} track - Track object from API
   * @returns {Object} Formatted track data
   */
  formatTrack (track) {
    return {
      id: track.id,
      title: track.title,
      permalink_url: track.permalink_url,
      created_at: track.created_at,
      duration: this.formatDuration(track.duration),
      playback_count: track.playback_count || 0,
      likes_count: track.likes_count || track.favoritings_count || 0,
      comment_count: track.comment_count || 0,
      genre: track.genre || 'Unknown',
      description: track.description || '',
      artwork_url: track.artwork_url || null,
      waveform_url: track.waveform_url || null
    }
  }

  /**
   * Format duration from milliseconds to MM:SS
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration (ms) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
