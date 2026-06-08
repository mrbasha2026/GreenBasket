import { groups, teams, getTeam, allMatches } from './data.js';

// Calculate group standings from scores
export function calculateGroupStandings(groupId, scores) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];

  const standings = group.teams.map(teamId => {
    const team = getTeam(teamId);
    return {
      id: teamId,
      name: team.name,
      flag: team.flag,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };
  });

  // Get group matches from scores
  Object.entries(scores).forEach(([matchIdStr, score]) => {
    const matchId = parseInt(matchIdStr);
    if (matchId > 72) return; // Only group stage matches

    // Determine which group this match belongs to
    const matchIndex = matchId - 1;
    const groupIndex = Math.floor(matchIndex / 6);
    if (groups[groupIndex]?.id !== groupId) return;

    if (score.home === null || score.away === null) return;

    const groupMatchIndex = matchIndex % 6;
    const t = group.teams;
    const pairings = [
      [t[0], t[1]],
      [t[2], t[3]],
      [t[0], t[2]],
      [t[1], t[3]],
      [t[0], t[3]],
      [t[1], t[2]],
    ];

    const [homeId, awayId] = pairings[groupMatchIndex];
    const homeStanding = standings.find(s => s.id === homeId);
    const awayStanding = standings.find(s => s.id === awayId);

    homeStanding.played++;
    awayStanding.played++;
    homeStanding.goalsFor += score.home;
    homeStanding.goalsAgainst += score.away;
    awayStanding.goalsFor += score.away;
    awayStanding.goalsAgainst += score.home;

    if (score.home > score.away) {
      homeStanding.won++;
      homeStanding.points += 3;
      awayStanding.lost++;
    } else if (score.home < score.away) {
      awayStanding.won++;
      awayStanding.points += 3;
      homeStanding.lost++;
    } else {
      homeStanding.drawn++;
      awayStanding.drawn++;
      homeStanding.points += 1;
      awayStanding.points += 1;
    }
  });

  // Calculate goal difference
  standings.forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  // Sort: points, GD, GS
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

// Resolve knockout team reference (e.g., "1A", "2B", "W73", "L101", "3ABD")
export function resolveKnockoutTeam(ref, scores) {
  if (!ref) return null;

  // Direct team ID
  const directTeam = teams.find(t => t.id === ref);
  if (directTeam) return directTeam;

  // Group position: "1A" = 1st of group A, "2B" = 2nd of group B, "3A" = 3rd of group A
  const groupPosMatch = ref.match(/^([123])([A-L])$/);
  if (groupPosMatch) {
    const pos = parseInt(groupPosMatch[1]);
    const groupId = groupPosMatch[2];
    const standings = calculateGroupStandings(groupId, scores);
    if (standings.length >= pos && standings[pos - 1]?.played > 0) {
      return getTeam(standings[pos - 1].id);
    }
    return null;
  }

  // Best 3rd place: "3ABD", "3CEF", "3GHI", "3JKL", "3ABC", "3DEF", "3GHI2", "3JKL2"
  const thirdPlaceMatch = ref.match(/^3([A-L]+)(\d?)$/);
  if (thirdPlaceMatch) {
    const groupIds = thirdPlaceMatch[1].split('');
    const thirdPlaceTeams = [];

    groupIds.forEach(gId => {
      const standings = calculateGroupStandings(gId, scores);
      if (standings.length >= 3 && standings[2]?.played > 0) {
        thirdPlaceTeams.push(standings[2]);
      }
    });

    thirdPlaceTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    const rankOffset = ref === '3GHI2' || ref === '3JKL2' ? 1 : 0;
    if (thirdPlaceTeams.length > rankOffset && thirdPlaceTeams[rankOffset]?.played > 0) {
      return getTeam(thirdPlaceTeams[rankOffset].id);
    }
    return null;
  }

  // Winner of match: "W73"
  const winnerMatch = ref.match(/^W(\d+)$/);
  if (winnerMatch) {
    const matchId = parseInt(winnerMatch[1]);
    const score = scores[matchId];
    if (score && score.home !== null && score.away !== null) {
      const match = allMatches.find(m => m.id === matchId);
      if (!match) return null;
      const homeTeam = resolveKnockoutTeam(match.home, scores);
      const awayTeam = resolveKnockoutTeam(match.away, scores);

      if (score.home > score.away) return homeTeam;
      if (score.away > score.home) return awayTeam;
      if (score.homePenalty !== null && score.awayPenalty !== null) {
        return score.homePenalty > score.awayPenalty ? homeTeam : awayTeam;
      }
    }
    return null;
  }

  // Loser of match: "L101"
  const loserMatch = ref.match(/^L(\d+)$/);
  if (loserMatch) {
    const matchId = parseInt(loserMatch[1]);
    const score = scores[matchId];
    if (score && score.home !== null && score.away !== null) {
      const match = allMatches.find(m => m.id === matchId);
      if (!match) return null;
      const homeTeam = resolveKnockoutTeam(match.home, scores);
      const awayTeam = resolveKnockoutTeam(match.away, scores);

      if (score.home > score.away) return awayTeam;
      if (score.away > score.home) return homeTeam;
      if (score.homePenalty !== null && score.awayPenalty !== null) {
        return score.homePenalty > score.awayPenalty ? awayTeam : homeTeam;
      }
    }
    return null;
  }

  return null;
}

// Get match result status for a team
export function getMatchResult(score, isHome) {
  if (!score || score.home === null || score.away === null) return 'pending';
  if (score.home === score.away) return 'draw';
  if (isHome) return score.home > score.away ? 'win' : 'loss';
  return score.away > score.home ? 'win' : 'loss';
}

// Get all 3rd place teams ranked for best 3rd calculation
export function getBestThirdPlaceTeams(scores, groupIds) {
  const thirdPlaceTeams = [];

  groupIds.forEach(gId => {
    const standings = calculateGroupStandings(gId, scores);
    if (standings.length >= 3 && standings[2]?.played > 0) {
      thirdPlaceTeams.push(standings[2]);
    }
  });

  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return thirdPlaceTeams;
}
