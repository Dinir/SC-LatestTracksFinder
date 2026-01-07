import dotenv from 'dotenv'
import { writeFile } from 'fs/promises'
import { SoundCloudClient } from './soundcloud.js'

dotenv.config()

/**
 * Generate a JSON file with latest tracks for static site consumption
 */
async function generateTracksJSON () {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET
  const username = process.env.SOUNDCLOUD_USERNAME
  const trackLimit = parseInt(process.env.TRACK_LIMIT || '5', 10)
  const outputFile = process.env.OUTPUT_FILE || 'tracks.json'

  // Embed customization options
  const embedColor = process.env.EMBED_COLOR || 'ff5500'
  const embedAutoPlay = process.env.EMBED_AUTO_PLAY === 'true'
  const embedHideRelated = process.env.EMBED_HIDE_RELATED === 'true'
  const embedShowComments = process.env.EMBED_SHOW_COMMENTS !== 'false'
  const embedShowUser = process.env.EMBED_SHOW_USER !== 'false'
  const embedShowReposts = process.env.EMBED_SHOW_REPOSTS === 'true'
  const embedShowTeaser = process.env.EMBED_SHOW_TEASER !== 'false'

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
    console.log(`Fetching SoundCloud user: ${username}`)

    let user
    if (username.startsWith('http://') || username.startsWith('https://')) {
      user = await client.resolve(username)
    } else if (!isNaN(username)) {
      user = await client.getUser(username)
    } else {
      try {
        user = await client.getUser(username)
      } catch (error) {
        const profileUrl = `https://soundcloud.com/${username}`
        console.log(`Trying to resolve: ${profileUrl}`)
        user = await client.resolve(profileUrl)
      }
    }

    console.log(`Found user: ${user.username} (ID: ${user.id})`)
    console.log(`Fetching latest tracks (requesting up to ${trackLimit * 3} to filter for ${trackLimit} public tracks)...`)

    // Fetch more tracks than needed to account for private tracks
    // Request 3x the limit to increase chances of getting enough public tracks
    const allTracks = await client.getUserTracks(user.id, trackLimit * 3)

    // Filter for public tracks only
    const publicTracks = allTracks.filter(track => track.public === true || track.sharing === 'public')

    // Take only the requested number of public tracks
    const tracks = publicTracks.slice(0, trackLimit)

    console.log(`Found ${publicTracks.length} public tracks (using ${tracks.length})`)
    if (tracks.length < trackLimit) {
      console.log(`Note: Only ${tracks.length} public tracks available, requested ${trackLimit}`)
    }

    if (tracks.length === 0) {
      console.log('No tracks found for this user.')
      const emptyData = {
        user: {
          id: user.id,
          username: user.username,
          permalink_url: user.permalink_url,
          avatar_url: user.avatar_url
        },
        tracks: [],
        generated_at: new Date().toISOString(),
        track_count: 0
      }
      await writeFile(outputFile, JSON.stringify(emptyData, null, 2))
      console.log(`Empty data written to ${outputFile}`)
      return
    }

    // Format tracks for web consumption with embed URLs
    const formattedTracks = tracks.map(track => {
      const formatted = client.formatTrack(track)

      // Generate SoundCloud embed URL with customizable parameters
      const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.permalink_url)}&color=%23${embedColor}&auto_play=${embedAutoPlay}&hide_related=${embedHideRelated}&show_comments=${embedShowComments}&show_user=${embedShowUser}&show_reposts=${embedShowReposts}&show_teaser=${embedShowTeaser}`

      return {
        ...formatted,
        embed_url: embedUrl,
        // Include original permalink for linking
        permalink: track.permalink_url
      }
    })

    const output = {
      user: {
        id: user.id,
        username: user.username,
        permalink_url: user.permalink_url,
        avatar_url: user.avatar_url,
        followers_count: user.followers_count || 0,
        track_count: user.track_count || 0
      },
      tracks: formattedTracks,
      generated_at: new Date().toISOString(),
      track_count: formattedTracks.length
    }

    await writeFile(outputFile, JSON.stringify(output, null, 2))

    console.log(`\nSuccessfully generated ${outputFile}`)
    console.log(`Tracks included: ${formattedTracks.length}`)
    console.log(`Generated at: ${output.generated_at}`)

    console.log('\nTracks:')
    formattedTracks.forEach((track, index) => {
      console.log(`  ${index + 1}. ${track.title} (${track.duration})`)
    })
  } catch (error) {
    console.error(`\nError: ${error.message}`)
    process.exit(1)
  }
}

generateTracksJSON()
