-- Rescale distribution badge values to the requested 500-3,000,000 point range.
-- The existing relative ordering is preserved, so rarity/year weighting remains intact.
WITH point_bounds AS (
    SELECT
        min(base_points)::numeric AS min_points,
        max(base_points)::numeric AS max_points
    FROM distribution_badges
),
scaled_badges AS (
    SELECT
        b.id,
        CASE
            WHEN point_bounds.max_points = point_bounds.min_points THEN 500
            ELSE round(
                500
                + ((b.base_points::numeric - point_bounds.min_points) * (3000000 - 500))
                / (point_bounds.max_points - point_bounds.min_points)
            )::integer
        END AS next_base_points
    FROM distribution_badges b
    CROSS JOIN point_bounds
)
UPDATE distribution_badges b
SET base_points = scaled_badges.next_base_points
FROM scaled_badges
WHERE b.id = scaled_badges.id;
