import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db;

  const query = `
    SELECT 
        artists.id AS artist_id, 
        artists.name AS artist_name, 
        SUM(visits.end_time - visits.start_time) AS total_visit_duration, 
        COUNT(DISTINCT visits.session_id) AS unique_session_count
    FROM 
        artists
    JOIN 
        visits ON artists.id = visits.artist_id
    GROUP BY 
        artists.id, artists.name
    ORDER BY 
        total_visit_duration DESC;
  `;

  const data = await db.prepare(query).all();

  return {
    data,
  };
};
