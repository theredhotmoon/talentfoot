<template>
  <div>
    <!-- Welcome Tour -->
    <WelcomeTourModal v-if="showTour" @close="showTour = false" />
    <div v-if="loading" class="text-center py-16" style="color: var(--tf-text-muted);"><div class="w-8 h-8 rounded-full mx-auto mb-3 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>{{ $t('clip_detail.loading') }}</div>
    <div v-else-if="clip">
      <!-- Video + Subclips Row (side-by-side on desktop) -->
      <div :class="['mb-6', clip.subclips && clip.subclips.length > 0 ? 'lg:flex lg:gap-4 lg:items-start' : '']">
        <!-- Video Player Section -->
        <div :class="[clip.subclips && clip.subclips.length > 0 ? 'lg:flex-1 lg:min-w-0 flex flex-col lg:block' : '']">
          <!-- Video area (order-1 on mobile) -->
          <div class="card-static overflow-hidden order-1" style="border-radius: var(--tf-radius-xl);" :class="clip.subclips && clip.subclips.length > 0 ? '' : ''">
            <!-- Subscription Gated Video Player -->
            <template v-if="subscriptionActive">
              <!-- Cartoon/Original toggle -->
              <div v-if="cartoonFilePath" class="px-4 py-2 flex items-center justify-center gap-3" style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--tf-border);">
                <button
                  @click="showCartoon = false"
                  :class="['px-3 py-1 rounded-full text-sm font-medium transition']" :style="!showCartoon ? 'background: var(--tf-gradient-primary); color: #0f0e17;' : 'background: rgba(255,255,255,0.06); color: var(--tf-text-muted);'"
                >{{ $t('cartoon.view_original') }}</button>
                <button
                  @click="showCartoon = true"
                  :class="['px-3 py-1 rounded-full text-sm font-medium transition']" :style="showCartoon ? 'background: var(--tf-gradient-secondary); color: white;' : 'background: rgba(255,255,255,0.06); color: var(--tf-text-muted);'"
                >🎨 {{ $t('cartoon.view_cartoon') }}</button>
              </div>

              <!-- Now playing bar -->
              <div v-if="activeSubclip" class="px-4 py-2 flex items-center justify-between" style="background: rgba(110,231,183,0.1); border-bottom: 1px solid rgba(110,231,183,0.2);">
                <span class="text-sm font-semibold" style="color: var(--tf-accent-emerald);">
                  {{ $t('subclips.now_playing') }}: {{ getTranslated(activeSubclip.name) }}
                </span>
                <button @click="switchToMain" class="btn-ghost text-xs py-1 px-3">
                  {{ $t('subclips.back_to_main') }}
                </button>
              </div>
              <div v-else-if="clip.subclips && clip.subclips.length > 0" class="px-4 py-2 flex items-center" style="background: rgba(99,102,241,0.08); border-bottom: 1px solid rgba(99,102,241,0.15);">
                <span class="text-sm font-semibold" style="color: var(--tf-accent-violet);">
                  🎯 {{ $t('course.overview_heading') }}
                </span>
              </div>

              <div class="relative group/captions">
                <video
                  ref="videoPlayer"
                  :src="showCartoon && cartoonFilePath ? getVideoUrl(cartoonFilePath) : getVideoUrl(currentFilePath)"
                  controls
                  crossorigin="anonymous"
                  class="w-full max-h-[600px] object-contain bg-black"
                  @play="onVideoPlay"
                  @pause="onVideoPause"
                  @ended="onVideoEnded"
                >
                  <track
                    v-for="(path, lang) in currentCaptions"
                    :key="`${currentFilePath}-${lang}`"
                    :src="getCaptionUrl(path)"
                    :srclang="lang"
                    :label="getLanguageLabel(lang)"
                    :default="lang === locale"
                  />
                </video>

                <!-- Captions toggle overlay (top-right, hover only) -->
                <div v-if="currentCaptions && Object.keys(currentCaptions).length > 0"
                     class="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/captions:opacity-100 transition-opacity duration-300 z-10">
                  <select v-if="captionsEnabled" v-model="selectedCaptionLang" @change="applyCaptionLang"
                          class="text-xs py-1 px-2 rounded-lg cursor-pointer"
                          style="background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px);">
                    <option v-for="(_path, lang) in currentCaptions" :key="lang" :value="lang">{{ getLanguageLabel(String(lang)) }}</option>
                  </select>
                  <button
                    @click="toggleCaptions"
                    class="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    style="backdrop-filter: blur(8px);"
                    :style="captionsEnabled
                      ? 'background: rgba(110,231,183,0.25); color: #6ee7b7; border: 1px solid rgba(110,231,183,0.4);'
                      : 'background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15);'"
                  >
                    <span>{{ captionsEnabled ? '💬' : '🔇' }}</span>
                    {{ captionsEnabled ? $t('captions.on') : $t('captions.off') }}
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center justify-center py-16 px-6" style="background: var(--tf-bg-surface-solid);">
                <div class="text-5xl mb-4">🔒</div>
                <h2 class="text-2xl font-heading font-bold mb-2" style="color: var(--tf-text);">{{ $t('subscription.renew_title') }}</h2>
                <p class="text-center max-w-md" style="color: var(--tf-text-muted);">{{ $t('subscription.renew_message') }}</p>
              </div>
            </template>
          </div>

          <!-- Subclips (MOBILE: order-2, between video and details; DESKTOP: hidden here) -->
          <div v-if="clip.subclips && clip.subclips.length > 0" class="order-2 mt-3 lg:hidden">
            <div class="card-static p-4" style="border-radius: var(--tf-radius-xl);">
              <h2 class="text-lg font-heading font-bold mb-3" style="color: var(--tf-text);">{{ $t('subclips.title') }}</h2>
              <div class="flex gap-3 overflow-x-auto pb-2" style="scrollbar-width: thin;">
                <!-- Main clip thumbnail -->
                <div
                  @click="switchToMain"
                  :class="[
                    'flex-shrink-0 w-44 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
                    !activeSubclip ? 'border-emerald-400 shadow-lg shadow-emerald-400/20' : 'border-transparent hover:border-white/20'
                  ]"
                >
                  <div class="relative">
                    <div class="w-44 h-24 flex items-center justify-center" style="background: rgba(255,255,255,0.04);">
                      <img v-if="clip.thumbnails && clip.thumbnails.length > 0" :src="getThumbnailUrl(clip.thumbnails[0])" class="w-full h-full object-cover" alt="Main clip" />
                      <span v-else class="text-gray-400 text-xs">▶ Main</span>
                    </div>
                    <div v-if="!activeSubclip" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
                      {{ $t('subclips.now_playing') }}
                    </div>
                  </div>
                  <div class="p-2 " style="background: rgba(0,0,0,0.3);">
                    <p class="text-xs font-semibold truncate">{{ getTranslated(clip.name) }}</p>
                    <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed); mt-1">
                      <span>⭐ {{ clip.difficulty }}/10</span>
                      <span>👁 {{ clip.views }}</span>
                    </div>
                  </div>
                </div>
                <!-- Subclip thumbnails -->
                <div
                  v-for="subclip in clip.subclips"
                  :key="'mobile-' + subclip.id"
                  @click="switchToSubclip(subclip)"
                  :class="[
                    'flex-shrink-0 w-44 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
                    activeSubclip && activeSubclip.id === subclip.id ? 'border-emerald-400 shadow-lg shadow-emerald-400/20' : 'border-transparent hover:border-white/20'
                  ]"
                >
                  <div class="relative">
                    <div class="w-44 h-24 flex items-center justify-center" style="background: rgba(255,255,255,0.04);">
                      <img v-if="subclip.thumbnails && subclip.thumbnails.length > 0" :src="getThumbnailUrl(subclip.thumbnails[0])" class="w-full h-full object-cover" alt="" />
                      <span v-else class="text-gray-400 text-3xl">▶</span>
                    </div>
                    <div v-if="activeSubclip && activeSubclip.id === subclip.id" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
                      {{ $t('subclips.now_playing') }}
                    </div>
                    <!-- Watch status / Preview/Lock badge -->
                    <div v-else-if="isSubclipWatched(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                         style="background: rgba(110,231,183,0.25); color: var(--tf-accent-emerald);">
                      ✅
                    </div>
                    <div v-else-if="isSubclipStarted(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                         style="background: rgba(251,191,36,0.25); color: var(--tf-accent-amber);">
                      ▶
                    </div>
                    <div v-else class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                         :style="subclip.is_preview ? 'background: rgba(110,231,183,0.2); color: var(--tf-accent-emerald);' : 'background: rgba(255,255,255,0.15); color: var(--tf-text-muted);'">
                      {{ subclip.is_preview ? '👁' : '🔒' }}
                    </div>
                  </div>
                  <div class="p-2 " style="background: rgba(0,0,0,0.3);">
                    <p class="text-xs font-semibold truncate">{{ getTranslated(subclip.name) }}</p>
                    <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed); mt-1">
                      <span>⭐ {{ subclip.difficulty }}/10</span>
                      <span>👁 {{ subclip.views }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Details area (order-3 on mobile) -->
          <div class="card-static overflow-hidden order-3 mt-6" style="border-radius: var(--tf-radius-xl);">
            <div class="p-6">
              <div class="flex items-start gap-3 mb-2">
                <h1 class="text-3xl font-heading font-bold gradient-text">{{ getTranslated(clip.name) }}</h1>
                <!-- Challenge status badge (right-aligned) -->
                <div v-if="activeChallenge && activeChallenge.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center cursor-help" style="background: rgba(110,231,183,0.15); border: 2px solid var(--tf-accent-emerald);">
                    <span class="text-lg">🏆</span>
                  </div>
                  <!-- Tooltip -->
                  <div class="absolute right-0 top-full mt-2 px-4 py-3 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50" style="background: var(--tf-bg-surface-solid); border: 1px solid var(--tf-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                    <p class="font-bold mb-1" style="color: var(--tf-accent-emerald);">{{ $t('challenges.complete_title') }}</p>
                    <p style="color: var(--tf-text-muted);">{{ $t('challenges.finished') }}: {{ new Date(activeChallenge.finished_at!).toLocaleDateString() }}</p>
                    <p v-if="activeChallenge.duration" style="color: var(--tf-text-muted);">{{ $t('challenges.duration') }}: {{ activeChallenge.duration }}</p>
                  </div>
                </div>
                <div v-else-if="activeChallenge && !activeChallenge.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center cursor-help" style="background: rgba(251,191,36,0.15); border: 2px solid var(--tf-accent-amber);">
                    <span class="text-lg">⚡</span>
                  </div>
                  <!-- Tooltip -->
                  <div class="absolute right-0 top-full mt-2 px-4 py-3 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50" style="background: var(--tf-bg-surface-solid); border: 1px solid var(--tf-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                    <p class="font-bold mb-1" style="color: var(--tf-accent-amber);">{{ $t('challenges.in_progress') }}</p>
                    <p style="color: var(--tf-text-muted);">{{ $t('challenges.progress') }}: {{ activeChallenge.watched_items }}/{{ activeChallenge.total_items }}</p>
                    <p style="color: var(--tf-text-muted);">{{ $t('challenges.started') }}: {{ new Date(activeChallenge.started_at).toLocaleDateString() }}</p>
                  </div>
                </div>
              </div>
              <p class="mb-4" style="color: var(--tf-text-muted);">{{ getTranslated(clip.description) }}</p>

              <!-- Contextual tip: Subscribe to unlock (no subscription, tips enabled) -->
              <div v-if="clip.subclips && clip.subclips.length > 0 && !subscriptionActive && authStore.showTips && !tipDismissed" class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);">
                <IconDiamond :size="24" class="flex-shrink-0" style="color: var(--tf-accent-violet);" />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-violet);">{{ $t('tips.subscribe_title') }}</p>
                  <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.subscribe_desc') }}</p>
                </div>
                <button @click="tipDismissed = true" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
              </div>

              <!-- Contextual tip: Start challenge (subscription active, no challenge, tips enabled) -->
              <div v-else-if="clip.subclips && clip.subclips.length > 0 && subscriptionActive && !activeChallenge && authStore.showTips && !tipDismissed" class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">
                <IconLightning :size="24" class="flex-shrink-0" style="color: var(--tf-accent-amber);" />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-amber);">{{ $t('tips.start_challenge_title') }}</p>
                  <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.start_challenge_desc') }}</p>
                </div>
                <button @click="tipDismissed = true" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
              </div>

              <!-- Course Instructions Banner (tips disabled or dismissed) -->
              <div v-else-if="clip.subclips && clip.subclips.length > 0 && !activeChallenge" class="mb-4 p-4 rounded-xl" style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);">
                <p class="font-semibold text-sm mb-2 flex items-center gap-2" style="color: var(--tf-accent-violet);"><IconBook :size="16" /> {{ $t('course.how_it_works') }}</p>
                <ul class="text-xs space-y-2" style="color: var(--tf-text-muted);">
                  <li class="flex items-center gap-2"><IconPlayMovie :size="14" /> {{ $t('course.step_watch_main') }}</li>
                  <li class="flex items-center gap-2"><IconEye :size="14" /> {{ $t('course.step_preview') }}</li>
                  <li class="flex items-center gap-2"><IconLightning :size="14" /> {{ $t('course.step_start') }}</li>
                  <li class="flex items-center gap-2"><IconCheck :size="14" /> {{ $t('course.step_complete') }}</li>
                </ul>
              </div>
              <!-- Main clip required banner (active course, main not watched) -->
              <div v-else-if="activeChallenge && !activeChallenge.is_completed && !mainClipWatched" class="mb-4 p-4 rounded-xl" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">
                <p class="font-semibold text-sm mb-1 flex items-center gap-2" style="color: var(--tf-accent-amber);"><IconWarning :size="16" /> {{ $t('course.main_clip_required_title') }}</p>
                <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('course.main_clip_required_msg') }}</p>
              </div>

              <TagPills v-if="clip.tags" :tags="clip.tags" />

              <!-- Stats: show subclip stats when viewing a subclip, otherwise main clip stats -->
              <div class="flex flex-col gap-2 w-full text-sm" style="color: var(--tf-text-muted);">
                <!-- Line 1: Views, Difficulty, Comments -->
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span class="stat-badge flex items-center gap-1.5" :title="$t('clip_detail.views')"><IconEye :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-cyan);">{{ currentViews }}</span></span>
                  <span class="text-gray-600 font-bold opacity-30">•</span>
                  <span class="stat-badge flex items-center gap-1.5" :title="$t('clip_detail.difficulty')"><IconFlame :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-amber);">{{ currentDifficulty }}/10</span></span>
                  
                  <template v-if="!activeSubclip">
                    <span class="text-gray-600 font-bold opacity-30">•</span>
                    <span class="stat-badge flex items-center gap-1.5" :title="$t('sort.comments')"><IconMessage :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-violet);">{{ clip?.comments_count || comments.length }}</span></span>
                  </template>

                  <!-- Spacer for trailing action buttons -->
                  <div class="flex-1"></div>
                  <router-link v-if="authStore.isAdmin" :to="`/clips/${clip?.id}/edit`" class="btn-ghost text-xs py-1 px-3">
                      {{ $t('clip_detail.edit_clip') }}
                  </router-link>
                </div>

                <!-- Line 2: Participants, Subclips, Rating / Category -->
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <template v-if="!activeSubclip && clip?.challenges_count !== undefined">
                    <span class="stat-badge flex items-center gap-1.5 cursor-help" :title="`${clip.challenges_count} ${$t('dashboard.participants')}. ${clip.completed_challenges_count || 0} ${$t('clip_detail.completed') || 'completed'}.`">
                      <IconUsers :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-cyan);">{{ clip.challenges_count }}</span>
                    </span>
                    <span class="text-gray-600 font-bold opacity-30">•</span>
                  </template>

                  <template v-if="!activeSubclip && clip?.subclips_count !== undefined">
                    <span class="stat-badge flex items-center gap-1.5" :title="$t('dashboard.subclips')">
                      <IconBook :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-violet);">{{ clip.subclips_count }}</span>
                    </span>
                    <span class="text-gray-600 font-bold opacity-30">•</span>
                  </template>

                  <span class="stat-badge flex items-center gap-1.5" :title="$t('clip_detail.rating')"><IconStar :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-emerald);">{{ currentRating }}/10</span> <span style="opacity:0.6; font-size: 0.9em;">({{ currentRatingsCount }} {{ $t('clip_detail.votes') }})</span></span>
                  
                  <template v-if="clip?.category">
                    <span class="text-gray-600 font-bold opacity-30">•</span>
                    <span class="stat-badge flex items-center gap-1.5" :title="$t('edit_clip.category')"><IconFolder :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-orange);">{{ getTranslated(clip.category.name) }}</span></span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Subclips Gallery sidebar (DESKTOP ONLY — vertical list) -->
      <div v-if="clip.subclips && clip.subclips.length > 0" class="hidden lg:block card-static p-4 lg:w-64 lg:flex-shrink-0 subclips-sidebar" style="border-radius: var(--tf-radius-xl); position: sticky; top: 5rem; max-height: calc(100vh - 6rem); overflow-y: auto;">
        <h2 class="text-lg font-heading font-bold mb-3" style="color: var(--tf-text);">{{ $t('subclips.title') }}</h2>
        <div class="flex flex-col gap-3">
          <!-- Main clip thumbnail -->
          <div
            @click="switchToMain"
            :class="[
              'w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
              !activeSubclip ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-white/20'
            ]"
          >
            <div class="relative">
              <div class="w-full h-24 flex items-center justify-center" style="background: rgba(255,255,255,0.04);">
                <img v-if="clip.thumbnails && clip.thumbnails.length > 0" :src="getThumbnailUrl(clip.thumbnails[0])" class="w-full h-full object-cover" alt="Main clip" />
                <span v-else class="text-gray-400 text-xs">▶ Main</span>
              </div>
              <div v-if="!activeSubclip" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
                {{ $t('subclips.now_playing') }}
              </div>
            </div>
            <div class="p-2 " style="background: rgba(0,0,0,0.3);">
              <p class="text-xs font-semibold truncate">{{ getTranslated(clip.name) }}</p>
              <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed); mt-1">
                <span>⭐ {{ clip.difficulty }}/10</span>
                <span>👁 {{ clip.views }}</span>
              </div>
            </div>
          </div>

          <!-- Subclip thumbnails -->
          <div
            v-for="subclip in clip.subclips"
            :key="'desktop-' + subclip.id"
            @click="switchToSubclip(subclip)"
            :class="[
              'w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
              activeSubclip && activeSubclip.id === subclip.id ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-white/20'
            ]"
          >
            <div class="relative">
              <div class="w-full h-24 flex items-center justify-center" style="background: rgba(255,255,255,0.04);">
                <img v-if="subclip.thumbnails && subclip.thumbnails.length > 0" :src="getThumbnailUrl(subclip.thumbnails[0])" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-gray-400 text-3xl">▶</span>
              </div>
              <div v-if="activeSubclip && activeSubclip.id === subclip.id" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
                {{ $t('subclips.now_playing') }}
              </div>
              <!-- Watch status / Preview/Lock badge -->
              <div v-else-if="isSubclipWatched(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                   style="background: rgba(110,231,183,0.25); color: var(--tf-accent-emerald);">
                ✅
              </div>
              <div v-else-if="isSubclipStarted(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                   style="background: rgba(251,191,36,0.25); color: var(--tf-accent-amber);">
                ▶
              </div>
              <div v-else class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                   :style="subclip.is_preview ? 'background: rgba(110,231,183,0.2); color: var(--tf-accent-emerald);' : 'background: rgba(255,255,255,0.15); color: var(--tf-text-muted);'">
                {{ subclip.is_preview ? '👁' : '🔒' }}
              </div>
            </div>
            <div class="p-2 " style="background: rgba(0,0,0,0.3);">
              <p class="text-xs font-semibold truncate">{{ getTranslated(subclip.name) }}</p>
              <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed); mt-1">
                <span>⭐ {{ subclip.difficulty }}/10</span>
                <span>👁 {{ subclip.views }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Comments Section -->
      <div class="card-static p-6" style="border-radius: var(--tf-radius-xl);">
        <h2 class="text-2xl font-heading font-bold mb-4" style="color: var(--tf-text);">{{ $t('clip_detail.comments_title') }}</h2>

        <!-- Comment Form -->
        <form @submit.prevent="submitComment" class="mb-8">
          <div class="mb-4">
            <label class="block text-sm mb-2" style="color: var(--tf-text-muted);">{{ $t('clip_detail.leave_comment') }}</label>
            <textarea 
              v-model="newComment" 
              class="input-modern"
              rows="3"
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            class="btn-primary text-sm"
            :disabled="submitting"
          >
            {{ submitting ? $t('clip_detail.posting') : $t('clip_detail.post_comment') }}
          </button>
        </form>

        <!-- Comments List -->
        <div class="space-y-4">
          <div v-if="comments.length === 0" class="italic" style="color: var(--tf-text-dimmed);">{{ $t('clip_detail.no_comments') }}</div>
          <div v-for="comment in comments" :key="comment.id" class="p-4 rounded-xl" style="background: rgba(255,255,255,0.04); border: 1px solid var(--tf-border);">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold" style="color: var(--tf-accent-emerald);">{{ comment.user.name }}</span>
              <span class="text-xs" style="color: var(--tf-text-dimmed);">{{ new Date(comment.created_at).toLocaleString() }}</span>
            </div>
            <p style="color: var(--tf-text);">{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center mt-10">{{ $t('clip_detail.not_found') }}</div>

    <!-- Challenge Progress Bar -->
    <div v-if="activeChallenge && !activeChallenge.is_completed && clip" class="fixed bottom-0 left-0 right-0 z-40 p-3" style="background: rgba(15,14,23,0.95); backdrop-filter: blur(12px); border-top: 1px solid var(--tf-border);">
      <div class="max-w-3xl mx-auto flex items-center gap-4">
        <span class="text-sm font-semibold" style="color: var(--tf-accent-amber);">⚡ {{ $t('challenges.active') }}</span>
        <div class="flex-1 h-2 rounded-full" style="background: rgba(255,255,255,0.08);">
          <div class="h-2 rounded-full transition-all duration-500" :style="`width: ${(activeChallenge.watched_items / activeChallenge.total_items) * 100}%; background: var(--tf-gradient-warm);`"></div>
        </div>
        <span class="text-xs" style="color: var(--tf-text-muted);">{{ activeChallenge.watched_items }}/{{ activeChallenge.total_items }}</span>
      </div>
    </div>

    <!-- Start Course Modal -->
    <div v-if="showChallengeModal" class="modal-overlay">
      <div class="modal-card p-8 max-w-md text-center">
        <div class="text-5xl mb-4">⚡</div>
        <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('course.start_title') }}</h3>
        <div class="text-left mb-6 text-sm space-y-2" style="color: var(--tf-text-muted);">
          <p>{{ $t('course.start_intro') }}</p>
          <ul class="space-y-1 text-xs pl-4">
            <li>1️⃣ {{ $t('course.start_step1') }}</li>
            <li>2️⃣ {{ $t('course.start_step2') }}</li>
            <li>3️⃣ {{ $t('course.start_step3') }}</li>
          </ul>
        </div>
        <div class="flex gap-3 justify-center">
          <button @click="cancelChallenge" class="btn-ghost">{{ $t('common.cancel') }}</button>
          <button @click="startChallenge" class="btn-primary" :disabled="challengeStarting">
            {{ challengeStarting ? '...' : $t('course.start_btn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Subscription Required Modal -->
    <div v-if="showSubRequiredModal" class="modal-overlay">
      <div class="modal-card p-8 max-w-md text-center">
        <div class="text-5xl mb-4">🔒</div>
        <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('challenges.sub_required_title') }}</h3>
        <p class="mb-6 text-sm" style="color: var(--tf-text-muted);">{{ $t('challenges.sub_required_message') }}</p>
        <button @click="showSubRequiredModal = false" class="btn-primary">{{ $t('common.ok') }}</button>
      </div>
    </div>

    <!-- Challenge Completed Toast -->
    <transition name="slide-up">
      <div v-if="showChallengeCompleteToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center" style="background: var(--tf-gradient-primary); color: #0f0e17; box-shadow: 0 8px 32px rgba(16,185,129,0.4);">
        <div class="text-3xl mb-1">🏆</div>
        <p class="font-heading font-bold">{{ $t('challenges.complete_title') }}</p>
        <p class="text-xs opacity-75">{{ $t('challenges.complete_message') }}</p>
      </div>
    </transition>

    <!-- Watch Duration Error Toast -->
    <transition name="slide-up">
      <div v-if="showWatchErrorToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center" style="background: rgba(239,68,68,0.9); color: white; box-shadow: 0 8px 32px rgba(239,68,68,0.4);">
        <div class="text-3xl mb-1">⚠️</div>
        <p class="font-heading font-bold">{{ $t('challenges.watch_error_title') }}</p>
        <p class="text-xs opacity-85">{{ $t('challenges.watch_error_message') }}</p>
      </div>
    </transition>
    <!-- Main Clip Required Toast -->
    <transition name="slide-up">
      <div v-if="showMainClipRequiredToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center" style="background: rgba(251,191,36,0.9); color: #0f0e17; box-shadow: 0 8px 32px rgba(251,191,36,0.4);">
        <div class="text-3xl mb-1">🎬</div>
        <p class="font-heading font-bold">{{ $t('course.main_clip_required_title') }}</p>
        <p class="text-xs opacity-85">{{ $t('course.main_clip_required_msg') }}</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import TagPills from '../components/TagPills.vue';
import IconDiamond from '../components/icons/IconDiamond.vue';
import IconLightning from '../components/icons/IconLightning.vue';
import IconBook from '../components/icons/IconBook.vue';
import IconPlayMovie from '../components/icons/IconPlayMovie.vue';
import IconEye from '../components/icons/IconEye.vue';
import IconCheck from '../components/icons/IconCheck.vue';
import IconWarning from '../components/icons/IconWarning.vue';
import IconStar from '../components/icons/IconStar.vue';
import IconFlame from '../components/icons/IconFlame.vue';
import IconMessage from '../components/icons/IconMessage.vue';
import IconFolder from '../components/icons/IconFolder.vue';
import IconUsers from '../components/icons/IconUsers.vue';
import WelcomeTourModal from '../components/WelcomeTourModal.vue';

const { t, locale } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const id = route.params.id as string;
const { getTranslated } = useTranslation();
const { getVideoUrl, getThumbnailUrl, getCaptionUrl } = useMediaUrl();

interface User {
    id: number;
    name: string;
}

interface Comment {
    id: number;
    user_id: number;
    clip_id: number;
    content: string;
    created_at: string;
    user: User;
}

interface Subclip {
    id: string;
    clip_id: string;
    name: Record<string, string> | string;
    file_path: string;
    difficulty: number;
    views: number;
    average_rating: number;
    ratings_count: number;
    sort_order: number;
    thumbnails: string[] | null;
    captions?: Record<string, string>;
    is_preview?: boolean;
}

interface ActiveChallenge {
    id: string;
    started_at: string;
    finished_at: string | null;
    is_completed: boolean;
    watched_items: number;
    total_items: number;
    watched_ids: string[];
    duration?: string;
}

interface Clip {
    id: string;
    name: Record<string, string> | string;
    slug: Record<string, string> | string;
    description: Record<string, string> | string;
    file_path: string;
    tags?: { id: string; name: any; slug: any }[] | null;
    difficulty: number;
    views: number;
    average_rating: number;
    ratings_count: number;
    comments_count?: number;
    subclips_count?: number;
    challenges_count?: number;
    completed_challenges_count?: number;
    category?: { id: string; name: any; slug: any };
    thumbnails?: string[];
    captions?: Record<string, string>;
    subclips: Subclip[];
    current_user_rating?: { rating: number } | null;
}

const clip = ref<Clip | null>(null);
const comments = ref<Comment[]>([]);
const newComment = ref('');
const loading = ref(true);
const submitting = ref(false);
const activeSubclip = ref<Subclip | null>(null);
const viewedSubclips = ref<Set<string>>(new Set());
const videoPlayer = ref<HTMLVideoElement | null>(null);
const subscriptionActive = ref(false);
const tipDismissed = ref(false);
const showTour = ref(false);
const cartoonFilePath = ref<string | null>(null);
const showCartoon = ref(false);
const captionsEnabled = ref(true);
const selectedCaptionLang = ref('');

// Challenge state
const activeChallenge = ref<ActiveChallenge | null>(null);
const showChallengeModal = ref(false);
const showSubRequiredModal = ref(false);
const showChallengeCompleteToast = ref(false);
const showWatchErrorToast = ref(false);
const showMainClipRequiredToast = ref(false);
const pendingSubclip = ref<Subclip | null>(null);
const challengeStarting = ref(false);

// Watch timing state
const watchStartedAt = ref<number | null>(null);
const accumulatedWatchTime = ref(0);
const startedSubclips = ref<Set<string>>(new Set());

const mainClipWatched = computed(() => {
    if (!activeChallenge.value || !clip.value) return false;
    return (activeChallenge.value.watched_ids || []).includes(clip.value.id);
});

// Helper: is subclip fully watched (in challenge)?
const isSubclipWatched = (id: string) => {
    return (activeChallenge.value?.watched_ids || []).includes(id);
};

// Helper: is subclip started but not finished watching?
const isSubclipStarted = (id: string) => {
    return startedSubclips.value.has(id) && !isSubclipWatched(id);
};

const currentFilePath = computed(() => {
    if (activeSubclip.value) return activeSubclip.value.file_path;
    return clip.value?.file_path || '';
});

const currentCaptions = computed(() => {
    if (activeSubclip.value) return activeSubclip.value.captions || {};
    return clip.value?.captions || {};
});

const currentDifficulty = computed(() => {
    if (activeSubclip.value) return activeSubclip.value.difficulty;
    return clip.value?.difficulty || 0;
});

const currentViews = computed(() => {
    if (activeSubclip.value) return activeSubclip.value.views;
    return clip.value?.views || 0;
});

const currentRating = computed(() => {
    if (activeSubclip.value) {
        return activeSubclip.value.average_rating ? Number(activeSubclip.value.average_rating).toFixed(1) : '-';
    }
    return clip.value?.average_rating ? Number(clip.value.average_rating).toFixed(1) : '-';
});

const currentRatingsCount = computed(() => {
    if (activeSubclip.value) return activeSubclip.value.ratings_count;
    return clip.value?.ratings_count || 0;
});

const getLanguageLabel = (lang: string | number) => {
    const labels: Record<string, string> = { en: 'English', pl: 'Polski', es: 'Español' };
    return labels[String(lang)] || String(lang).toUpperCase();
};

const toggleCaptions = () => {
    captionsEnabled.value = !captionsEnabled.value;
    if (!videoPlayer.value) return;
    const tracks = videoPlayer.value.textTracks;
    for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (t) t.mode = captionsEnabled.value
            ? (t.language === selectedCaptionLang.value ? 'showing' : 'hidden')
            : 'disabled';
    }
};

const applyCaptionLang = () => {
    if (!videoPlayer.value || !captionsEnabled.value) return;
    const tracks = videoPlayer.value.textTracks;
    for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (t) t.mode = t.language === selectedCaptionLang.value ? 'showing' : 'hidden';
    }
};

// Initialize selected caption lang from locale
watch(() => locale.value, (val: string) => {
    if (!selectedCaptionLang.value) selectedCaptionLang.value = val;
}, { immediate: true });

const switchToSubclip = (subclip: Subclip) => {
    // Preview subclips are always accessible
    if (subclip.is_preview) {
        doSwitchSubclip(subclip);
        return;
    }
    // Challenge already active (in progress)
    if (activeChallenge.value && !activeChallenge.value.is_completed) {
        // Must watch main clip first before non-preview subclips
        if (!mainClipWatched.value) {
            showMainClipRequiredToast.value = true;
            setTimeout(() => { showMainClipRequiredToast.value = false; }, 5000);
            return;
        }
        doSwitchSubclip(subclip);
        return;
    }
    // Challenge completed + subscription active → free access
    if (activeChallenge.value && activeChallenge.value.is_completed && subscriptionActive.value) {
        doSwitchSubclip(subclip);
        return;
    }
    // No subscription → show subscription required
    if (!subscriptionActive.value) {
        showSubRequiredModal.value = true;
        return;
    }
    // Has subscription but no challenge → prompt to start
    pendingSubclip.value = subclip;
    showChallengeModal.value = true;
};

const resetWatchTiming = () => {
    watchStartedAt.value = null;
    accumulatedWatchTime.value = 0;
};

const doSwitchSubclip = (subclip: Subclip) => {
    activeSubclip.value = subclip;
    resetWatchTiming();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const switchToMain = () => {
    activeSubclip.value = null;
    resetWatchTiming();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const startChallenge = async () => {
    if (!clip.value) return;
    challengeStarting.value = true;
    try {
        const res = await axios.post('/api/challenges', { clip_id: clip.value.id });
        activeChallenge.value = res.data.challenge;
        showChallengeModal.value = false;
        // Now switch to the pending subclip
        if (pendingSubclip.value) {
            doSwitchSubclip(pendingSubclip.value);
            pendingSubclip.value = null;
        }
    } catch (e: any) {
        console.error('Failed to start challenge', e);
        if (e.response?.data?.challenge) {
            activeChallenge.value = e.response.data.challenge;
        }
    } finally {
        challengeStarting.value = false;
    }
};

const cancelChallenge = () => {
    showChallengeModal.value = false;
    pendingSubclip.value = null;
};

const onVideoPlay = () => {
    // Record subclip view count (analytics)
    if (activeSubclip.value && !viewedSubclips.value.has(activeSubclip.value.id)) {
        viewedSubclips.value.add(activeSubclip.value.id);
        recordSubclipView(activeSubclip.value.id);
    }
    // Record watch start time for duration validation (only on first play, not resume)
    if (watchStartedAt.value === null) {
        watchStartedAt.value = Date.now();
    }
    // Mark as "started" for visual indicator
    const currentId = activeSubclip.value ? activeSubclip.value.id : clip.value?.id;
    if (currentId) {
        startedSubclips.value.add(currentId);
    }
};

const onVideoPause = () => {
    // Accumulate elapsed time from the current play segment
    if (watchStartedAt.value !== null) {
        accumulatedWatchTime.value += (Date.now() - watchStartedAt.value) / 1000;
        watchStartedAt.value = null;
    }
};

const onVideoEnded = () => {
    // Challenge watch tracking — only on video end
    if (!activeChallenge.value || activeChallenge.value.is_completed) return;

    const type = activeSubclip.value ? 'subclip' : 'clip';
    const wId = activeSubclip.value ? activeSubclip.value.id : clip.value?.id;
    const watchedIds = activeChallenge.value.watched_ids || [];

    if (!wId || watchedIds.includes(wId)) return;

    // Subclip progress only counts if main clip has been watched
    if (type === 'subclip' && !mainClipWatched.value) {
        showMainClipRequiredToast.value = true;
        setTimeout(() => { showMainClipRequiredToast.value = false; }, 5000);
        return;
    }

    // Validate watch duration >= video duration (accumulated across pause/resume cycles)
    if (videoPlayer.value) {
        const currentSegment = watchStartedAt.value ? (Date.now() - watchStartedAt.value) / 1000 : 0;
        const totalWatchedSeconds = accumulatedWatchTime.value + currentSegment;
        const videoDuration = videoPlayer.value.duration;
        if (videoDuration && totalWatchedSeconds < videoDuration * 0.95) {
            // Watch time too short — show error
            showWatchErrorToast.value = true;
            setTimeout(() => { showWatchErrorToast.value = false; }, 5000);
            return;
        }
    }

    // Reset timing state after successful recording
    resetWatchTiming();
    recordChallengeWatch(type, wId);
};

const recordChallengeWatch = async (type: string, watchableId: string) => {
    if (!activeChallenge.value) return;
    try {
        const res = await axios.post(`/api/challenges/${activeChallenge.value.id}/watch`, {
            watchable_type: type,
            watchable_id: watchableId,
        });
        activeChallenge.value = res.data.challenge;
        // Show completion toast
        if (res.data.challenge.is_completed) {
            showChallengeCompleteToast.value = true;
            setTimeout(() => { showChallengeCompleteToast.value = false; }, 6000);
        }
    } catch (e) {
        console.error('Failed to record challenge watch', e);
    }
};

const recordSubclipView = async (subclipId: string) => {
    try {
        const response = await axios.post(`/api/subclips/${subclipId}/view`);
        if (clip.value) {
            const sc = clip.value.subclips.find(s => s.id === subclipId);
            if (sc) sc.views = response.data.views;
        }
    } catch (e) {
        console.error("Failed to record subclip view", e);
    }
};

const fetchClip = async () => {
    try {
        const response = await axios.get(`/api/clips/${id}`);
        clip.value = response.data.clip;
        subscriptionActive.value = response.data.subscription_active;
        cartoonFilePath.value = response.data.cartoon_file_path || null;
        activeChallenge.value = response.data.active_challenge || null;
    } catch (e) {
        console.error("Failed to fetch clip", e);
    }
};

const fetchComments = async () => {
    try {
        const response = await axios.get(`/api/clips/${id}/comments`);
        comments.value = response.data;
    } catch (e) {
        console.error("Failed to fetch comments", e);
    }
};

const submitComment = async () => {
    if (!newComment.value.trim()) return;
    
    submitting.value = true;
    try {
        const response = await axios.post(`/api/clips/${id}/comments`, {
            content: newComment.value
        });
        comments.value.unshift(response.data);
        newComment.value = '';
    } catch (e) {
        alert(t('clip_detail.comment_error'));
    } finally {
        submitting.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([fetchClip(), fetchComments()]);
    loading.value = false;

    // Auto-play video if redirected from Start Challenge
    if (route.query.autoplay) {
        await nextTick();
        if (videoPlayer.value) {
            videoPlayer.value.play().catch(() => { /* browser may block autoplay */ });
        }
    }

    // Show welcome tour if user has tips enabled
    if (authStore.isAuthenticated && authStore.showTips) {
        showTour.value = true;
    }
});
</script>
