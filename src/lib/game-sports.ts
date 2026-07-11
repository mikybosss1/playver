// Individual player box scores (points/rebounds/assists/steals/blocks) only make sense for
// sports that actually track those stats. Other sports just log the final team score.
export function sportTracksBoxScore(sport: string): boolean {
  return sport === "Basketball";
}
