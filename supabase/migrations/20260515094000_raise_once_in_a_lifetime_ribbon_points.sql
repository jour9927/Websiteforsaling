-- Raise the Once-in-a-Lifetime Ribbon into the top badge value tier.
UPDATE distribution_badges
SET
    name = '千載難逢獎章',
    rarity = 'mythic',
    base_points = GREATEST(base_points, 2000000),
    description = 'A top-tier Generation 9 ribbon for an exceptionally rare once-in-a-lifetime trade encounter.'
WHERE category = 'ribbon'
  AND generation = 9
  AND lower(coalesce(name_en, name)) = 'once-in-a-lifetime ribbon';
