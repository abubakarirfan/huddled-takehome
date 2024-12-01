import type { PageServerLoad } from "./$types";
import { DateTime } from "luxon";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db;

  // Fetch user timezone information
  const users = await db.prepare("SELECT id, timezone FROM users").all();

  // Preprocess: Map user IDs to timezone offsets
  const timezoneOffsets = {};
  for (const user of users) {
    try {
      const now = DateTime.utc().setZone(user.timezone);
      timezoneOffsets[user.id] = now.offset / 60; // Offset in hours
    } catch (error) {
      console.error(`Error processing timezone for user ${user.id}: ${error.message}`);
      timezoneOffsets[user.id] = 0; // Default to UTC
    }
  }

  // Dynamically generate CASE statement for timezone offsets
  const timezoneCaseStatement = Object.entries(timezoneOffsets)
    .map(([userId, offset]) => `WHEN e.user_id = ${userId} THEN '${offset} hours'`)
    .join(" ");

  const query = `
    WITH LocalizedEvents AS (
        SELECT 
            e.artist_id,
            e.event_type,
            e.created_at,
            CASE ${timezoneCaseStatement} ELSE '+0 hours' END AS timezone_offset,
            DATETIME(e.created_at / 1000, 'unixepoch', CASE ${timezoneCaseStatement} ELSE '+0 hours' END) AS local_time
        FROM 
            user_events e
    ),
    EventScores AS (
        SELECT 
            artist_id,
            STRFTIME('%H', local_time) AS hour,
            CASE 
                WHEN event_type = 'like_track' THEN 2
                WHEN event_type = 'add_track_to_playlist' THEN 2
                WHEN event_type = 'play_track' THEN 1
                WHEN event_type = 'share_track' THEN 3
                ELSE 0
            END AS score
        FROM 
            LocalizedEvents
    ),
    AggregatedScores AS (
        SELECT 
            artist_id,
            hour,
            SUM(score) AS total_score
        FROM 
            EventScores
        GROUP BY 
            artist_id, hour
    )
    SELECT 
        artist_id,
        hour,
        total_score
    FROM 
        AggregatedScores
    ORDER BY 
        artist_id, hour;
  `;

  const data = await db.prepare(query).all();

  return {
    data: data || [],
  };
};
