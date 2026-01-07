import dotenv from 'dotenv'
import { SoundCloudClient } from './soundcloud.js'

dotenv.config()

/**
 * Main function to retrieve and display latest tracks from a SoundCloud account
 */
async function main () {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET
  const username = process.env.SOUNDCLOUD_USERNAME
  const trackLimit = parseInt(process.env.TRACK_LIMIT || '10', 10)

  if (!clientId || !clientSecret) {
    console.error('Error: SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET must be set in .env file')
    process.exit(1)
  }

  if (!username) {
    console.error('Error: SOUNDCLOUD_USERNAME must be set in .env file')
    process.exit(1)
  }

  const client = new SoundCloudClient(clientId, clientSecret)

  try {
    console.log(`\nFetching SoundCloud user information for: ${username}\n`)

    let user
    if (username.startsWith('http://') || username.startsWith('https://')) {
      console.log('Resolving SoundCloud URL...')
      user = await client.resolve(username)
    } else if (!isNaN(username)) {
      user = await client.getUser(username)
    } else {
      try {
        user = await client.getUser(username)
      } catch (error) {
        const profileUrl = `https://soundcloud.com/${username}`
        console.log(`Failed to fetch by username, trying to resolve: ${profileUrl}`)
        user = await client.resolve(profileUrl)
      }
    }

    console.log(`User: ${user.username} (ID: ${user.id})`)
    console.log(`Followers: ${user.followers_count || 0}`)
    console.log(`Tracks: ${user.track_count || 0}`)
    console.log(`Profile: ${user.permalink_url}\n`)

    console.log(`Fetching ${trackLimit} latest tracks...\n`)

    const tracks = await client.getUserTracks(user.id, trackLimit)

    if (tracks.length === 0) {
      console.log('No tracks found for this user.')
      return
    }

    console.log(`Found ${tracks.length} tracks:\n`)
    console.log('='.repeat(80))

    tracks.forEach((track, index) => {
      const formatted = client.formatTrack(track)

      console.log(`\n[${index + 1}] ${formatted.title}`)
      console.log('-'.repeat(80))
      console.log(`URL:        ${formatted.permalink_url}`)
      console.log(`Duration:   ${formatted.duration}`)
      console.log(`Genre:      ${formatted.genre}`)
      console.log(`Created:    ${new Date(formatted.created_at).toLocaleDateString()}`)
      console.log(`Plays:      ${formatted.playback_count.toLocaleString()}`)
      console.log(`Likes:      ${formatted.likes_count.toLocaleString()}`)
      console.log(`Comments:   ${formatted.comment_count.toLocaleString()}`)

      if (formatted.description) {
        const shortDesc = formatted.description.length > 100
          ? formatted.description.substring(0, 100) + '...'
          : formatted.description
        console.log(`Description: ${shortDesc}`)
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\nTotal tracks retrieved: ${tracks.length}`)
  } catch (error) {
    console.error(`\nError: ${error.message}`)
    process.exit(1)
  }
}

main()
