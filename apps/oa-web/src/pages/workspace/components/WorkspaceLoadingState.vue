<template>
  <div class="loading-stack">
    <section class="hero-card page-card workspace-skeleton-card">
      <div class="skeleton-stack">
        <span class="ui-skeleton ui-skeleton-pill" />
        <span class="ui-skeleton ui-skeleton-line long skeleton-heading" />
        <span class="ui-skeleton ui-skeleton-line medium" />
        <div class="skeleton-pill-row">
          <span v-for="item in 3" :key="item" class="ui-skeleton ui-skeleton-pill" />
        </div>
      </div>
      <div class="skeleton-side">
        <span class="ui-skeleton ui-skeleton-line medium" />
        <span class="ui-skeleton ui-skeleton-line long" />
        <div class="skeleton-card-block">
          <span class="ui-skeleton ui-skeleton-line short" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line medium" />
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="item in 4" :key="item" class="page-card metric-card metric-skeleton-card">
        <span class="ui-skeleton ui-skeleton-line short" />
        <span class="ui-skeleton ui-skeleton-line medium skeleton-metric-value" />
        <span class="ui-skeleton ui-skeleton-line long" />
      </article>
    </section>

    <div class="content-grid">
      <section class="page-card focus-card skeleton-panel">
        <div class="section-head">
          <div class="skeleton-stack">
            <span class="ui-skeleton ui-skeleton-pill" />
            <span class="ui-skeleton ui-skeleton-line medium" />
          </div>
        </div>
        <div class="focus-list">
          <article v-for="item in 3" :key="item" class="focus-item">
            <div class="focus-item-top">
              <span class="ui-skeleton ui-skeleton-line medium" />
              <span class="ui-skeleton ui-skeleton-pill" />
            </div>
            <span class="ui-skeleton ui-skeleton-line long" />
          </article>
        </div>
      </section>

      <section class="page-card bulletin-card skeleton-panel">
        <div class="section-head">
          <div class="skeleton-stack">
            <span class="ui-skeleton ui-skeleton-pill" />
            <span class="ui-skeleton ui-skeleton-line medium" />
          </div>
        </div>
        <div class="announcement-list">
          <div v-for="item in 2" :key="item" class="announcement-item announcement-skeleton-item">
            <span class="ui-skeleton ui-skeleton-line long" />
            <span class="ui-skeleton ui-skeleton-line medium" />
            <span class="ui-skeleton ui-skeleton-line short" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.loading-stack {
  display: grid;
  gap: 18px;
}

.workspace-skeleton-card,
.skeleton-panel,
.metric-skeleton-card {
  overflow: hidden;
}

.skeleton-stack,
.skeleton-side,
.skeleton-card-block {
  display: grid;
  gap: 12px;
}

.skeleton-side {
  align-content: start;
}

.skeleton-heading {
  height: 34px;
  border-radius: 18px;
}

.skeleton-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.skeleton-metric-value {
  height: 28px;
  width: 44%;
  border-radius: 14px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.focus-card,
.bulletin-card {
  display: grid;
  gap: 16px;
  align-content: start;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  min-height: 20px;
}

.focus-list,
.announcement-list {
  display: grid;
  gap: 12px;
  align-content: start;
  justify-items: stretch;
}

.focus-item {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.64);
}

.focus-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.announcement-item {
  display: grid;
  gap: 10px;
  width: 100%;
  align-content: start;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.74);
}

.announcement-skeleton-item {
  pointer-events: none;
}

@media (max-width: 1240px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .focus-item-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
