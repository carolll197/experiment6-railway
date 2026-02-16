<template>
  <div class="home-wrap">
    <h1 class="text-h1" style="margin-bottom: 32px;">广告创意生成心理学研究实验平台</h1>
    <div class="link-grid">
      <div class="link-section">
        <h2 class="text-h2 center" style="margin-bottom: 12px;">预实验</h2>
        <router-link to="/pre-subject" class="link-card panel-border">
          <span class="link-title">被试版</span>
          <span class="link-desc text-hint">被试创作入口</span>
        </router-link>
        <router-link to="/pre-expert" class="link-card panel-border">
          <span class="link-title">专家版</span>
          <span class="link-desc text-hint">专家评分入口</span>
        </router-link>
        <router-link to="/pre-admin" class="link-card panel-border">
          <span class="link-title">主试版</span>
          <span class="link-desc text-hint">数据管理入口</span>
        </router-link>
      </div>
      <div class="link-section">
        <h2 class="text-h2 center" style="margin-bottom: 12px;">研究一</h2>
        <router-link to="/study1-subject" class="link-card panel-border">
          <span class="link-title">被试版</span>
          <span class="link-desc text-hint">被试创作入口</span>
        </router-link>
        <router-link to="/study1-admin" class="link-card panel-border">
          <span class="link-title">主试版</span>
          <span class="link-desc text-hint">数据管理入口</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.link-grid {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
}
.link-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}
.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  text-decoration: none;
  transition: background 0.2s;
  cursor: pointer;
}
.link-card:hover {
  background: var(--color-active-bg);
}
.link-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
}
.link-desc {
  font-size: 13px;
}
</style>
