<script>
  import { allMatches, getTeam, stageNames } from '$lib/data.js';
  import { scores, favoriteTeams, favoriteMatches } from '$lib/stores.js';
  import { resolveKnockoutTeam, getMatchResult } from '$lib/logic.js';
  import TeamBadge from './TeamBadge.svelte';
  import ScoreDialog from './ScoreDialog.svelte';

  let currentScores = $derived($scores);
  let favTeams = $derived($favoriteTeams);
  let favMatchIds = $derived($favoriteMatches);

  // Check if a knockout match involves a favorite team by resolving the references
  function matchInvolvesFavTeam(match) {
    if (match.type === 'group') {
      return favTeams.includes(match.home) || favTeams.includes(match.away);
    }
    // For knockout matches, resolve the team references
    const homeTeam = resolveKnockoutTeam(match.home, currentScores);
    const awayTeam = resolveKnockoutTeam(match.away, currentScores);
    if (homeTeam && favTeams.includes(homeTeam.id)) return true;
    if (awayTeam && favTeams.includes(awayTeam.id)) return true;
    return false;
  }

  let favMatchesList = $derived(allMatches.filter(m => {
    if (favMatchIds.includes(m.id)) return true;
    if (matchInvolvesFavTeam(m)) return true;
    return false;
  }));

  let scoredKnockout = $derived(allMatches.filter(m => {
    if (m.type === 'group') return false;
    const s = currentScores[m.id];
    return s && s.home !== null && s.away !== null;
  }));

  let combined = $derived(
    [...new Map([...favMatchesList, ...scoredKnockout].map(m => [m.id, m])).values()]
      .sort((a, b) => a.id - b.id)
  );

  function handleScore(matchId, home, away, homePenalty, awayPenalty) {
    scores.setScore(matchId, home, away, homePenalty, awayPenalty);
  }

  function toggleFav(matchId) {
    favoriteMatches.toggle(matchId);
  }

  // Resolve display team for knockout matches
  function getDisplayTeam(match, side) {
    if (match.type === 'group') {
      return getTeam(side === 'home' ? match.home : match.away);
    }
    return resolveKnockoutTeam(side === 'home' ? match.home : match.away, currentScores);
  }
</script>

<div class="favorites-container">
  {#if combined.length === 0}
    <div class="empty">
      <p>لا توجد مباريات مفضلة بعد</p>
      <p class="hint">أضف فرقاً مفضلة أو مباريات مفضلة من المباريات والمجموعات</p>
    </div>
  {:else}
    <div class="matches-list">
      {#each combined as match (match.id)}
        {@const score = currentScores[match.id]}
        {@const homeDisplayTeam = getDisplayTeam(match, 'home')}
        {@const awayDisplayTeam = getDisplayTeam(match, 'away')}
        {@const homeResult = getMatchResult(score, true)}
        {@const awayResult = getMatchResult(score, false)}
        {@const isFav = favMatchIds.includes(match.id)}
        <div class="match-card">
          <div class="match-header">
            <span class="match-id">#{match.id}</span>
            <span class="match-stage">{stageNames[match.type]}</span>
            {#if match.group}
              <span class="match-group">المجموعة {match.group}</span>
            {/if}
            <button class="fav-btn" class:active={isFav} onclick={() => toggleFav(match.id)}>
              {isFav ? '★' : '☆'}
            </button>
          </div>
          <div class="match-body">
            <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
              {#if homeDisplayTeam}
                <TeamBadge teamId={homeDisplayTeam.id} />
              {:else}
                <span class="tbd">{match.home}</span>
              {/if}
            </div>
            <div class="score-area">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
            <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
              {#if awayDisplayTeam}
                <TeamBadge teamId={awayDisplayTeam.id} />
              {:else}
                <span class="tbd">{match.away}</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .favorites-container {
    padding: 8px;
  }
  .empty {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255,255,255,0.4);
  }
  .empty p {
    margin: 4px 0;
  }
  .hint {
    font-size: 0.8rem;
  }
  .tbd {
    color: rgba(255,255,255,0.25);
    font-size: 0.7rem;
    font-style: italic;
  }
  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .match-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .match-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.75rem;
  }
  .match-id { color: rgba(255,255,255,0.4); }
  .match-stage { color: #FFD700; font-weight: bold; }
  .match-group { color: rgba(255,255,255,0.5); }
  .fav-btn {
    margin-right: auto;
    background: none;
    border: none;
    color: rgba(255,215,0,0.3);
    cursor: pointer;
    font-size: 1rem;
  }
  .fav-btn.active { color: #FFD700; }
  .match-body {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .team-row {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .team-row.result-win {
    background: rgba(76, 175, 80, 0.15);
    border-left: 3px solid #4CAF50;
  }
  .team-row.result-loss {
    background: rgba(244, 67, 54, 0.12);
    border-left: 3px solid #F44336;
  }
  .team-row.result-draw {
    background: rgba(255, 193, 7, 0.12);
    border-left: 3px solid #FFC107;
  }
  .score-area { flex-shrink: 0; }
</style>
