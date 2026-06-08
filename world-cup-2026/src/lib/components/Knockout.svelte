<script>
  import { allMatches, getTeam, stageNames } from '$lib/data.js';
  import { scores } from '$lib/stores.js';
  import { resolveKnockoutTeam, getMatchResult } from '$lib/logic.js';
  import TeamBadge from './TeamBadge.svelte';
  import ScoreDialog from './ScoreDialog.svelte';

  let currentScores = $derived($scores);

  function handleScore(matchId, home, away, homePenalty, awayPenalty) {
    scores.setScore(matchId, home, away, homePenalty, awayPenalty);
  }

  let r32Matches = $derived(allMatches.filter(m => m.type === 'r32'));
  let r16Matches = $derived(allMatches.filter(m => m.type === 'r16'));
  let qfMatches = $derived(allMatches.filter(m => m.type === 'qf'));
  let sfMatches = $derived(allMatches.filter(m => m.type === 'sf'));
  let finalMatch = $derived(allMatches.find(m => m.type === 'final'));
  let thirdMatch = $derived(allMatches.find(m => m.type === 'third'));

  function resolveTeam(ref) {
    return resolveKnockoutTeam(ref, currentScores);
  }

  let r32Top = $derived(r32Matches.slice(0, 8));
  let r32Bottom = $derived(r32Matches.slice(8, 16));
  let r16Top = $derived(r16Matches.slice(0, 4));
  let r16Bottom = $derived(r16Matches.slice(4, 8));
  let qfTop = $derived(qfMatches.slice(0, 2));
  let qfBottom = $derived(qfMatches.slice(2, 4));
  let sfTop = $derived(sfMatches.slice(0, 1));
  let sfBottom = $derived(sfMatches.slice(1, 2));
</script>

<div class="knockout-page">
  <!-- Bracket layout -->
  <div class="bracket-container">
    <div class="bracket-grid">
      <!-- Top Half: R32 → R16 → QF → SF -->
      <div class="bracket-row top-row">
        <div class="round-col">
          <div class="round-label">دور الـ 32</div>
          <div class="matches-col">
            {#each r32Top as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">دور الـ 16</div>
          <div class="matches-col spaced-8">
            {#each r16Top as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">ربع النهائي</div>
          <div class="matches-col spaced-16">
            {#each qfTop as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">نصف النهائي</div>
          <div class="matches-col spaced-32">
            {#each sfTop as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card featured">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Center: Final + Logo + Third Place -->
      <div class="center-section">
        {#if finalMatch}
          {@const score = currentScores[finalMatch.id]}
          {@const homeTeam = resolveTeam(finalMatch.home)}
          {@const awayTeam = resolveTeam(finalMatch.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="final-card">
            <div class="final-label">المباراة النهائية</div>
            <div class="final-teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{finalMatch.home}</span>{/if}
              </div>
              <div class="score-mini">
                <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(finalMatch.id, h, a, hp, ap)} />
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{finalMatch.away}</span>{/if}
              </div>
            </div>
          </div>
        {/if}

        <div class="center-logo">
          <img src="wc2026-logo-white.svg" alt="FIFA World Cup 2026" />
        </div>

        {#if thirdMatch}
          {@const score = currentScores[thirdMatch.id]}
          {@const homeTeam = resolveTeam(thirdMatch.home)}
          {@const awayTeam = resolveTeam(thirdMatch.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="third-card">
            <div class="third-label">المركز الثالث</div>
            <div class="final-teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{thirdMatch.home}</span>{/if}
              </div>
              <div class="score-mini">
                <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(thirdMatch.id, h, a, hp, ap)} />
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{thirdMatch.away}</span>{/if}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Bottom Half: SF → QF → R16 → R32 -->
      <div class="bracket-row bottom-row">
        <div class="round-col">
          <div class="round-label">نصف النهائي</div>
          <div class="matches-col spaced-32">
            {#each sfBottom as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card featured">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">ربع النهائي</div>
          <div class="matches-col spaced-16">
            {#each qfBottom as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">دور الـ 16</div>
          <div class="matches-col spaced-8">
            {#each r16Bottom as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="round-col">
          <div class="round-label">دور الـ 32</div>
          <div class="matches-col">
            {#each r32Bottom as match}
              {@const score = currentScores[match.id]}
              {@const homeTeam = resolveTeam(match.home)}
              {@const awayTeam = resolveTeam(match.away)}
              {@const homeResult = getMatchResult(score, true)}
              {@const awayResult = getMatchResult(score, false)}
              <div class="match-card">
                <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                  {#if homeTeam}<TeamBadge teamId={homeTeam.id} small={true} />{:else}<span class="tbd">{match.home}</span>{/if}
                </div>
                <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                  {#if awayTeam}<TeamBadge teamId={awayTeam.id} small={true} />{:else}<span class="tbd">{match.away}</span>{/if}
                </div>
                <div class="score-mini">
                  <ScoreDialog homeScore={score?.home} awayScore={score?.away} homePenalty={score?.homePenalty} awayPenalty={score?.awayPenalty} onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)} />
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .knockout-page {
    width: 100%;
    overflow: hidden;
  }

  .bracket-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .bracket-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 800px;
    padding: 4px;
  }

  .bracket-row {
    display: flex;
    gap: 3px;
    width: 100%;
  }

  .round-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .round-label {
    text-align: center;
    color: #FFD700;
    font-size: 0.6rem;
    font-weight: bold;
    padding: 2px 0;
    background: rgba(255, 215, 0, 0.08);
    border-radius: 3px;
    white-space: nowrap;
    margin-bottom: 2px;
  }

  .matches-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    justify-content: space-around;
  }

  .spaced-8 { justify-content: space-around; }
  .spaced-16 { justify-content: space-around; }
  .spaced-32 { justify-content: center; }

  .match-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 2px 3px;
    transition: all 0.2s;
  }

  .match-card:hover {
    border-color: rgba(255, 215, 0, 0.25);
  }

  .match-card.featured {
    border-color: rgba(255, 215, 0, 0.2);
    background: rgba(255, 215, 0, 0.03);
  }

  .team-row {
    display: flex;
    align-items: center;
    padding: 1px 3px;
    border-radius: 2px;
    min-height: 20px;
    gap: 2px;
  }

  .team-row :global(.name) {
    font-size: 0.6rem !important;
  }

  .team-row :global(.flag) {
    width: 16px !important;
    height: 11px !important;
  }

  .team-row.result-win {
    background: rgba(76, 175, 80, 0.15);
    border-right: 2px solid #4CAF50;
  }

  .team-row.result-loss {
    background: rgba(244, 67, 54, 0.12);
    border-right: 2px solid #F44336;
  }

  .team-row.result-draw {
    background: rgba(255, 193, 7, 0.12);
    border-right: 2px solid #FFC107;
  }

  .score-mini {
    text-align: center;
    margin-top: 1px;
  }

  .score-mini :global(.score-btn) {
    padding: 1px 5px;
    min-width: 34px;
    font-size: 0.6rem;
  }

  .score-mini :global(.score-display) {
    font-size: 0.65rem;
  }

  .tbd {
    color: rgba(255, 255, 255, 0.25);
    font-size: 0.55rem;
    font-style: italic;
  }

  /* Center Section */
  .center-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 6px 0;
    flex-wrap: nowrap;
  }

  .final-card {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 165, 0, 0.06));
    border: 2px solid rgba(255, 215, 0, 0.4);
    border-radius: 8px;
    padding: 6px 10px;
    min-width: 130px;
  }

  .final-label {
    text-align: center;
    color: #FFD700;
    font-size: 0.7rem;
    font-weight: bold;
    margin-bottom: 3px;
  }

  .final-teams {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .third-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 6px 10px;
    min-width: 130px;
  }

  .third-label {
    text-align: center;
    color: #cd7f32;
    font-size: 0.65rem;
    font-weight: bold;
    margin-bottom: 3px;
  }

  .center-logo {
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .center-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    .bracket-grid {
      min-width: 700px;
    }

    .center-logo {
      width: 120px;
      height: 120px;
    }
  }
</style>
