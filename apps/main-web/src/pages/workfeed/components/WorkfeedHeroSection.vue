<template>
  <section class="page-card workfeed-hero">
    <div class="workfeed-hero-copy">
      <span class="page-kicker">协同工作台</span>
      <h1>统一待办与通知</h1>
      <p>先处理待办，再进入原业务页。</p>
    </div>

    <div class="workfeed-hero-metrics">
      <article class="metric-tile">
        <span>待办</span>
        <strong>{{ todoCount }}</strong>
        <small>当前聚合事项</small>
      </article>
      <article class="metric-tile">
        <span>通知</span>
        <strong>{{ notificationCount }}</strong>
        <small>最近业务消息</small>
      </article>
      <article class="metric-tile">
        <span>未读</span>
        <strong>{{ unreadCount }}</strong>
        <small>需要优先关注</small>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  todoCount: number;
  notificationCount: number;
  unreadCount: number;
}>();
</script>

<style scoped>
.workfeed-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 18px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.92));
}

.workfeed-hero-copy {
  display: grid;
  gap: 10px;
  align-content: start;
}

.workfeed-hero-copy h1 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.workfeed-hero-copy p {
  margin: 0;
  max-width: 720px;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.workfeed-hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-tile {
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 148px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.86);
}

.metric-tile span,
.metric-tile small {
  color: var(--app-text-secondary);
}

.metric-tile span {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-tile strong {
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1;
}

@media (max-width: 1080px) {
  .workfeed-hero {
    grid-template-columns: 1fr;
  }

  .workfeed-hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workfeed-hero-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
