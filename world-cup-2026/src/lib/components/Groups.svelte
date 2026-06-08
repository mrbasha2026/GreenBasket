<script>
  import { groups, getTeam } from '$lib/data.js';
  import { scores, favoriteTeams } from '$lib/stores.js';
  import { calculateGroupStandings } from '$lib/logic.js';
  import TeamBadge from './TeamBadge.svelte';

  let currentScores = $derived($scores);
  let favTeams = $derived($favoriteTeams);

  function toggleFav(teamId) {
    favoriteTeams.toggle(teamId);
  }
</script>

<div class="groups-container">
  {#each groups as group}
    {@const standings = calculateGroupStandings(group.id, currentScores)}
    <div class="group-card">
      <div class="group-header">
        <h3>{group.name}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>الفريق</th>
            <th>لعب</th>
            <th>فوز</th>
            <th>تعادل</th>
            <th>خسارة</th>
            <th>له</th>
            <th>عليه</th>
            <th>فرق</th>
            <th>نقاط</th>
          </tr>
        </thead>
        <tbody>
          {#each standings as team, i}
            {@const isFav = favTeams.includes(team.id)}
            {@const isQualified = i < 2}
            {@const isThird = i === 2}
            <tr class:qualified={isQualified} class:third-qual={isThird} class:fav={isFav}>
              <td class="rank">
                {i + 1}
                <button class="fav-star" class:active={isFav} onclick={() => toggleFav(team.id)}>
                  {isFav ? '★' : '☆'}
                </button>
              </td>
              <td class="team-cell">
                <TeamBadge teamId={team.id} />
              </td>
              <td>{team.played}</td>
              <td>{team.won}</td>
              <td>{team.drawn}</td>
              <td>{team.lost}</td>
              <td>{team.goalsFor}</td>
              <td>{team.goalsAgainst}</td>
              <td class:positive={team.goalDifference > 0} class:negative={team.goalDifference < 0}>
                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
              </td>
              <td class="points">{team.points}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/each}
</div>

<style>
  .groups-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 12px;
    padding: 8px;
  }
  .group-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    overflow: hidden;
  }
  .group-header {
    background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.08));
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,215,0,0.15);
  }
  .group-header h3 {
    margin: 0;
    color: #FFD700;
    font-size: 0.95rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  th {
    color: rgba(255,255,255,0.5);
    font-weight: normal;
    padding: 6px 4px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  td {
    color: #ccc;
    padding: 6px 4px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .rank {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .fav-star {
    background: none;
    border: none;
    color: rgba(255,215,0,0.2);
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0;
  }
  .fav-star.active {
    color: #FFD700;
  }
  .team-cell {
    text-align: right;
  }
  tr.qualified td {
    color: #fff;
  }
  tr.qualified {
    background: rgba(76, 175, 80, 0.08);
  }
  tr.third-qual {
    background: rgba(255, 193, 7, 0.06);
  }
  .positive {
    color: #4CAF50 !important;
  }
  .negative {
    color: #F44336 !important;
  }
  .points {
    color: #FFD700 !important;
    font-weight: bold;
  }
</style>
