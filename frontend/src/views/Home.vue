<template>
  <div class="home-wrap panel-border">
    <h1 class="text-h1 center">广告创意生成心理学研究实验平台</h1>
    <nav class="nav-links">
      <router-link to="/pre-subject">预实验-被试版</router-link>
      <router-link to="/pre-expert">预实验-专家版</router-link>
      <router-link to="/pre-admin">预实验-主试版</router-link>
      <router-link to="/study1-subject">研究一-被试版</router-link>
      <router-link to="/study1-expert">研究一-专家版</router-link>
      <router-link to="/study1-admin">研究一-主试版</router-link>
      <router-link to="/study2-process">研究二-被试版(过程组)</router-link>
      <router-link to="/study2-result">研究二-被试版(结果组)</router-link>
      <router-link to="/study2-admin">研究二-主试版</router-link>
    </nav>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-wrap {
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  background: var(--color-input-bg);
}
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}
.nav-links a {
  color: var(--color-primary);
  font-size: 14px;
  text-decoration: none;
}
.nav-links a:hover { text-decoration: underline; }
</style>
