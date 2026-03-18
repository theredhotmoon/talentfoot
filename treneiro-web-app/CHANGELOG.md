# Changelog

All notable changes to the Trenejro frontend are documented here.

---

## 2026-03-03 — I18n Translation Completeness

### Fixed
- Added all 30 missing translation keys across English (`en.json`), Polish (`pl.json`), and Spanish (`es.json`) locales. Affected areas include:
  - Navigation (`nav.dashboard`, `nav.tags`)
  - User profile management (`profile.*`)
  - Edit clip modal (`edit_clip.*`)
  - Sorting options (`sort.*`)
  - Common actions (`common.*`)
  - Login/Register Google buttons (`login.*`, `register.*`)
  - Dashboard & Upload actions (`dashboard.*`, `upload.*`)

---

## 2026-03-02 — Google Login & Registration

### Added
- **Backend:** `laravel/socialite` installed for Google OAuth
- **Backend:** Migration `add_auth_provider_to_users_table` — adds `auth_provider` and `google_id` columns, makes `password` nullable
- **Backend:** `AuthController` — `redirectToGoogle()` and `handleGoogleCallback()` methods (find-or-create user from Google, issue Sanctum token)
- **Backend:** `.env` — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL` placeholders
- **Frontend:** `GoogleCallback.vue` — receives token from Google redirect and stores it
- Google Sign-In/Sign-Up buttons on `Login.vue` and `Register.vue` with official Google logo SVG

### Changed
- `Login.vue` — redesigned with error display, loading states, "or" divider, Google button; removed hardcoded default credentials
- `Register.vue` — redesigned with validation error display, loading states, Google button
- `auth.ts` — added `setTokenAndFetchUser()` action and `auth_provider` to `User` interface
- `router/index.ts` — added `/auth/google/callback` route
- `api.php` — added `/auth/google/redirect` and `/auth/google/callback` public routes
- `User.php` — added `auth_provider`, `google_id` to `$fillable`
- `config/services.php` — added `google` service config
- `AuthController.register()` — sets `auth_provider: 'email'` on normal registration

> **⚠️ Action required:** Set your Google OAuth credentials in `backend/.env` (see `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

---

## 2026-03-02 — User Avatar Menu & Profile Management

### Added
- **Backend:** `ProfileController.php` — self-service `PUT /api/profile` (name/email) and `PUT /api/profile/password` (with current password verification)
- **Frontend:** `UserAvatarMenu.vue` — initials avatar circle with animated dropdown (user info, role badge, edit profile, change password, logout)
- **Frontend:** `EditProfileModal.vue` — modal for editing own name and email
- **Frontend:** `ChangePasswordModal.vue` — modal for changing password (current + new + confirm)

### Changed
- `App.vue` — replaced Logout button with `UserAvatarMenu` component
- `api.php` — registered `/profile` and `/profile/password` routes under `auth:sanctum`

> **Note:** Role changes are admin-only (existing `UserController.update`).

---

## 2026-03-02 — Subclips Layout Improvements

### Changed
- `ClipDetail.vue` — **Desktop (lg+):** subclips gallery appears as a vertical scrollable sidebar to the right of the video player.
- `ClipDetail.vue` — **Mobile:** subclips now appear directly below the video, *before* the clip details section (title, description, tags, stats). Previously they appeared after the details.

---

## 2026-03-02 — DRY/KISS Refactoring & Componentization

### Added
- **Composables** (`src/composables/`)
  - `useTranslation.ts` — shared `getTranslated()` helper (was duplicated in 6 files)
  - `useMediaUrl.ts` — shared `getVideoUrl`, `getThumbnailUrl`, `getCaptionUrl` (was in 4 files)
  - `useThumbnailPreview.ts` — shared thumbnail hover preview logic (was in 3 files)
  - `useExtractThumbnails.ts` — client-side video thumbnail extraction (was in 2 files)
- **Shared Components** (`src/components/`)
  - `LanguageTabs.vue` — reusable EN/PL/ES tab bar with `v-model` and size variants
  - `TagPills.vue` — clickable tag pill list
  - `ClipCard.vue` — full video card (thumbnail preview + tags + stats + slot)
  - `ClipStatsGrid.vue` — difficulty/views/comments/rating stats grid
  - `SortFilterBar.vue` — category + sort-by + sort-order dropdowns

### Changed
- `Dashboard.vue` — uses `ClipCard`, `SortFilterBar`; removed ~60 lines of duplicates
- `ClipDetail.vue` — uses `useTranslation`, `useMediaUrl`, `TagPills`
- `EditClip.vue` — uses `LanguageTabs` (×3), `useTranslation`, `useExtractThumbnails`
- `Upload.vue` — uses `LanguageTabs`, `useTranslation`, `useExtractThumbnails`
- `TagDetail.vue` — uses `ClipCard`, `SortFilterBar`; removed ~90 lines of duplicates
- `TagClips.vue` — uses `useMediaUrl`
- `TagsView.vue` — uses `useTranslation`
- `CategoriesList.vue` — uses `useTranslation`
- `router/index.ts` — renamed unused `from` → `_from` (TS6133 fix)

### Removed
- `HelloWorld.vue` — unused scaffold component

> **No logic changes.** Purely structural refactoring following DRY/KISS principles.
