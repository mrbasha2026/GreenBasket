<script>
  let { homeScore = null, awayScore = null, homePenalty = null, awayPenalty = null, onScore = () => {} } = $props();

  let open = $state(false);
  let hScore = $state(null);
  let aScore = $state(null);
  let hPenalty = $state(null);
  let aPenalty = $state(null);

  function openDialog() {
    hScore = homeScore;
    aScore = awayScore;
    hPenalty = homePenalty;
    aPenalty = awayPenalty;
    open = true;
  }

  function save() {
    const h = hScore !== '' && hScore !== null ? parseInt(hScore) : null;
    const a = aScore !== '' && aScore !== null ? parseInt(aScore) : null;
    const hp = h !== null && a !== null && h === a && hPenalty !== '' && hPenalty !== null ? parseInt(hPenalty) : null;
    const ap = h !== null && a !== null && h === a && aPenalty !== '' && aPenalty !== null ? parseInt(aPenalty) : null;
    onScore(h, a, hp, ap);
    open = false;
  }

  function reset() {
    onScore(null, null, null, null);
    open = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') open = false;
  }

  let showPenalty = $derived(
    hScore !== null && aScore !== null && hScore !== '' && aScore !== '' && parseInt(hScore) === parseInt(aScore)
  );
</script>

<button class="score-btn" onclick={openDialog}>
  {#if homeScore !== null && awayScore !== null}
    <span class="score-display">
      {homeScore} - {awayScore}
      {#if homePenalty !== null && awayPenalty !== null}
        <small class="pen">( penalties: {homePenalty}-{awayPenalty} )</small>
      {/if}
    </span>
  {:else}
    <span class="score-placeholder">VS</span>
  {/if}
</button>

{#if open}
  <div class="overlay" role="dialog" tabindex="-1" onclick={() => open = false} onkeydown={handleKeydown}>
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <h3>أدخل النتيجة</h3>
      <div class="score-inputs">
        <div class="input-group">
          <label for="home-score">المضيف</label>
          <input id="home-score" type="number" bind:value={hScore} min="0" max="30" />
        </div>
        <span class="separator">-</span>
        <div class="input-group">
          <label for="away-score">الضيف</label>
          <input id="away-score" type="number" bind:value={aScore} min="0" max="30" />
        </div>
      </div>
      {#if showPenalty}
        <div class="penalty-section">
          <h4>ركلات الجزاء الترجيحية</h4>
          <div class="score-inputs">
            <div class="input-group">
              <input type="number" bind:value={hPenalty} min="0" max="30" placeholder="مضيف" />
            </div>
            <span class="separator">-</span>
            <div class="input-group">
              <input type="number" bind:value={aPenalty} min="0" max="30" placeholder="ضيف" />
            </div>
          </div>
        </div>
      {/if}
      <div class="actions">
        <button class="save-btn" onclick={save}>حفظ</button>
        <button class="reset-btn" onclick={reset}>مسح</button>
        <button class="cancel-btn" onclick={() => open = false}>إلغاء</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .score-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 4px 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 60px;
  }
  .score-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,215,0,0.5);
  }
  .score-display {
    color: #fff;
    font-weight: bold;
    font-size: 0.9rem;
  }
  .pen {
    color: #FFD700;
    font-size: 0.7rem;
  }
  .score-placeholder {
    color: rgba(255,255,255,0.4);
    font-size: 0.8rem;
  }
  .overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .dialog {
    background: #0a1628;
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 12px;
    padding: 24px;
    min-width: 300px;
    direction: rtl;
  }
  .dialog h3 {
    color: #FFD700;
    margin: 0 0 16px 0;
    text-align: center;
  }
  .score-inputs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  .input-group {
    text-align: center;
  }
  .input-group label {
    display: block;
    color: #aaa;
    font-size: 0.8rem;
    margin-bottom: 4px;
  }
  .input-group input {
    width: 60px;
    text-align: center;
    padding: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 1.2rem;
  }
  .separator {
    color: #FFD700;
    font-size: 1.5rem;
    font-weight: bold;
  }
  .penalty-section {
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 12px;
    margin-bottom: 16px;
  }
  .penalty-section h4 {
    color: #FFD700;
    font-size: 0.85rem;
    text-align: center;
    margin: 0 0 8px 0;
  }
  .actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .save-btn {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #001B44;
    border: none;
    border-radius: 6px;
    padding: 8px 20px;
    cursor: pointer;
    font-weight: bold;
  }
  .reset-btn {
    background: rgba(255,0,0,0.2);
    color: #ff6b6b;
    border: 1px solid rgba(255,0,0,0.3);
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
  }
  .cancel-btn {
    background: rgba(255,255,255,0.05);
    color: #aaa;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
  }
</style>
