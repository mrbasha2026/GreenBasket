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

<div class="bracket-container">
  <div class="bracket">
    <!-- Right side (top half of bracket) - R32 outermost -->
    <div class="bracket-half bracket-right">
      <div class="round round-r32">
        <div class="round-label">دور الـ 32</div>
        {#each r32Top as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-r16">
        <div class="round-label">دور الـ 16</div>
        {#each r16Top as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-qf">
        <div class="round-label">ربع النهائي</div>
        {#each qfTop as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-sf">
        <div class="round-label">نصف النهائي</div>
        {#each sfTop as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card featured">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Center: Final, Logo, Third Place -->
    <div class="bracket-center">
      {#if finalMatch}
        {@const score = currentScores[finalMatch.id]}
        {@const homeTeam = resolveTeam(finalMatch.home)}
        {@const awayTeam = resolveTeam(finalMatch.away)}
        {@const homeResult = getMatchResult(score, true)}
        {@const awayResult = getMatchResult(score, false)}
        <div class="final-card">
          <div class="final-label">🏆 المباراة النهائية</div>
          <div class="teams">
            <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
              {#if homeTeam}
                <TeamBadge teamId={homeTeam.id} small={true} />
              {:else}
                <span class="tbd">{finalMatch.home}</span>
              {/if}
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(finalMatch.id, h, a, hp, ap)}
              />
            </div>
            <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
              {#if awayTeam}
                <TeamBadge teamId={awayTeam.id} small={true} />
              {:else}
                <span class="tbd">{finalMatch.away}</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <div class="center-logo">
        <img src="/wc2026-logo-official.svg" alt="FIFA World Cup 2026" />
      </div>

      {#if thirdMatch}
        {@const score = currentScores[thirdMatch.id]}
        {@const homeTeam = resolveTeam(thirdMatch.home)}
        {@const awayTeam = resolveTeam(thirdMatch.away)}
        {@const homeResult = getMatchResult(score, true)}
        {@const awayResult = getMatchResult(score, false)}
        <div class="third-card">
          <div class="third-label">🥉 المركز الثالث</div>
          <div class="teams">
            <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
              {#if homeTeam}
                <TeamBadge teamId={homeTeam.id} small={true} />
              {:else}
                <span class="tbd">{thirdMatch.home}</span>
              {/if}
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(thirdMatch.id, h, a, hp, ap)}
              />
            </div>
            <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
              {#if awayTeam}
                <TeamBadge teamId={awayTeam.id} small={true} />
              {:else}
                <span class="tbd">{thirdMatch.away}</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Left side (bottom half of bracket) -->
    <div class="bracket-half bracket-left">
      <div class="round round-sf">
        <div class="round-label">نصف النهائي</div>
        {#each sfBottom as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card featured">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-qf">
        <div class="round-label">ربع النهائي</div>
        {#each qfBottom as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-r16">
        <div class="round-label">دور الـ 16</div>
        {#each r16Bottom as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="round round-r32">
        <div class="round-label">دور الـ 32</div>
        {#each r32Bottom as match}
          {@const score = currentScores[match.id]}
          {@const homeTeam = resolveTeam(match.home)}
          {@const awayTeam = resolveTeam(match.away)}
          {@const homeResult = getMatchResult(score, true)}
          {@const awayResult = getMatchResult(score, false)}
          <div class="match-card">
            <div class="match-num">#{match.id}</div>
            <div class="teams">
              <div class="team-row" class:result-win={homeResult === 'win'} class:result-loss={homeResult === 'loss'} class:result-draw={homeResult === 'draw'}>
                {#if homeTeam}
                  <TeamBadge teamId={homeTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.home}</span>
                {/if}
              </div>
              <div class="team-row" class:result-win={awayResult === 'win'} class:result-loss={awayResult === 'loss'} class:result-draw={awayResult === 'draw'}>
                {#if awayTeam}
                  <TeamBadge teamId={awayTeam.id} small={true} />
                {:else}
                  <span class="tbd">{match.away}</span>
                {/if}
              </div>
            </div>
            <div class="score-mini">
              <ScoreDialog
                homeScore={score?.home}
                awayScore={score?.away}
                homePenalty={score?.homePenalty}
                awayPenalty={score?.awayPenalty}
                onScore={(h, a, hp, ap) => handleScore(match.id, h, a, hp, ap)}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .bracket-container {
    width: 100%;
    overflow-x: auto;
    padding: 8px;
  }

  .bracket {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: fit-content;
    direction: rtl;
  }

  .bracket-half {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bracket-right {
    flex-direction: row;
  }

  .bracket-left {
    flex-direction: row;
  }

  .bracket-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 160px;
    flex-shrink: 0;
  }

  .round {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 130px;
  }

  .round-label {
    text-align: center;
    color: #FFD700;
    font-size: 0.7rem;
    font-weight: bold;
    padding: 4px 0;
    background: rgba(255, 215, 0, 0.08);
    border-radius: 4px;
    margin-bottom: 2px;
    white-space: nowrap;
  }

  .match-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 4px 6px;
    transition: all 0.2s;
  }

  .match-card:hover {
    border-color: rgba(255, 215, 0, 0.25);
  }

  .match-card.featured {
    border-color: rgba(255, 215, 0, 0.2);
    background: rgba(255, 215, 0, 0.03);
  }

  .match-num {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    margin-bottom: 2px;
  }

  .teams {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .team-row {
    display: flex;
    align-items: center;
    padding: 2px 4px;
    border-radius: 3px;
    min-height: 24px;
    gap: 4px;
  }

  .team-row :global(.name) {
    font-size: 0.7rem !important;
  }

  .team-row.result-win {
    background: rgba(76, 175, 80, 0.15);
    border-left: 2px solid #4CAF50;
  }

  .team-row.result-loss {
    background: rgba(244, 67, 54, 0.12);
    border-left: 2px solid #F44336;
  }

  .team-row.result-draw {
    background: rgba(255, 193, 7, 0.12);
    border-left: 2px solid #FFC107;
  }

  .score-mini {
    text-align: center;
    margin-top: 2px;
  }

  .score-mini :global(.score-btn) {
    padding: 2px 8px;
    min-width: 45px;
    font-size: 0.7rem;
  }

  .score-mini :global(.score-display) {
    font-size: 0.75rem;
  }

  .tbd {
    color: rgba(255, 255, 255, 0.25);
    font-size: 0.65rem;
    font-style: italic;
  }

  .final-card {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 165, 0, 0.06));
    border: 2px solid rgba(255, 215, 0, 0.4);
    border-radius: 10px;
    padding: 10px;
    width: 160px;
  }

  .final-label {
    text-align: center;
    color: #FFD700;
    font-size: 0.8rem;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .third-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 8px;
    width: 160px;
  }

  .third-label {
    text-align: center;
    color: #cd7f32;
    font-size: 0.75rem;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .center-logo {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .center-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .round-r32 .match-card { margin: 6px 0; }
  .round-r16 .match-card { margin: 20px 0; }
  .round-qf .match-card { margin: 48px 0; }
  .round-sf .match-card { margin: 100px 0; }

  .round-r32 { min-width: 140px; }
  .round-r16 { min-width: 135px; }
  .round-qf { min-width: 130px; }
  .round-sf { min-width: 130px; }
</style>
