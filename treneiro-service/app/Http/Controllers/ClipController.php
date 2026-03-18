<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Rating;
use App\Models\Challenge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClipController extends Controller
{
    public function index(Request $request)
    {
        $sort = $request->input('sort', 'created_at');
        $order = $request->input('order', 'desc');

        $allowedSorts = ['created_at', 'average_rating', 'difficulty', 'views', 'comments_count'];
        $allowedOrders = ['asc', 'desc'];

        if (!in_array($sort, $allowedSorts))
            $sort = 'created_at';
        if (!in_array($order, $allowedOrders))
            $order = 'desc';

        $query = Clip::withCount('comments')
            ->withCount('subclips')
            ->withCount('challenges')
            ->withCount(['challenges as completed_challenges_count' => function ($q) {
                $q->whereNotNull('finished_at');
            }]);

        $query->orderBy($sort, $order);

        if ($request->has('tag')) {

            $tagSlug = $request->input('tag');
            $query->whereHas('tags', function ($q) use ($tagSlug) {
                // Filter by slug (json column). 
                // We can use whereJsonContains if database supports it. SQLite does.
                // Or simply where('slug', 'like', ...)
                $q->where('slug->en', $tagSlug);
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Include current user rating and tags
        return $query->with(['currentUserRating', 'tags'])->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'slug' => 'nullable',
            'description' => 'required',
            'video_file' => 'required|file|mimetypes:video/mp4,video/quicktime|max:51200',
            'difficulty' => 'required|integer|min:1|max:10',
            'tags' => 'nullable',
            'category_id' => 'nullable|exists:categories,id',
            'thumbnails.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('video_file')) {
            $path = $request->file('video_file')->store('clips', 'public');
        } else {
            return response()->json(['error' => 'No video file provided'], 422);
        }

        // Handle tags
        $tags = $request->tags;
        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            if (is_array($decoded)) {
                $tags = $decoded;
            } else {
                $tags = [];
            }
        }

        // Handle translations for Name, Slug, Description
        // Frontend should send JSON strings or arrays. 
        // If sent as FormData (which it is), they come as JSON strings if they are objects.

        $name = $request->name;
        if (is_string($name) && is_array(json_decode($name, true))) {
            $name = json_decode($name, true);
        }

        $description = $request->description;
        if (is_string($description) && is_array(json_decode($description, true))) {
            $description = json_decode($description, true);
        }

        $slugInput = $request->slug;
        if (is_string($slugInput) && is_array(json_decode($slugInput, true))) {
            $slugInput = json_decode($slugInput, true);
        }

        // Auto-generate slugs if missing for specific locales?
        // For simplicity, let's assume frontend sends complete data or we fallback.
        // If slug is empty, we generate it from name (for the current locale or all).
        // If $name is array, we might want to generate slug for each key.

        $slugs = [];
        if (is_array($name)) {
            foreach ($name as $locale => $val) {
                $s = isset($slugInput[$locale]) && $slugInput[$locale] ? $slugInput[$locale] : \Illuminate\Support\Str::slug($val);
                // Uniqueness check is hard here for JSON. Let's skip strict unique check for now or rely on database constraint if any (text column won't enforce unique JSON keys).
                $slugs[$locale] = $s;
            }
        } else {
            // Fallback for single string input (backward compatibility)
            $slugs = $request->slug ?? \Illuminate\Support\Str::slug($request->name);
        }

        $clip = Clip::create([
            'name' => $name,
            'slug' => $slugs,
            'description' => $description,
            'file_path' => $path,
            'difficulty' => (int) $request->difficulty,
            'category_id' => $request->category_id,
            'password_protected' => true,
        ]);

        if (!empty($tags)) {
            $clip->tags()->sync($tags);
        }

        // Handle Thumbnails
        if ($request->hasFile('thumbnails')) {
            $thumbnailPaths = [];
            foreach ($request->file('thumbnails') as $index => $file) {
                // Store in public/thumbnails/{clip_id}/
                $path = $file->store("thumbnails/{$clip->id}", 'public');
                $thumbnailPaths[] = $path;
            }
            $clip->update(['thumbnails' => $thumbnailPaths]);
        }

        // Handle Captions (VTT)
        $captions = [];
        foreach (['en', 'pl', 'es'] as $lang) {
            if ($request->hasFile("captions_{$lang}")) {
                $captions[$lang] = $request->file("captions_{$lang}")->store("captions/clips/{$clip->id}", 'public');
            }
        }
        if (!empty($captions)) {
            $clip->update(['captions' => $captions]);
        }

        return response()->json($clip, 201);
    }

    public function show(Clip $clip)
    {
        $user = auth('sanctum')->user();

        $userRating = $user
            ? Rating::where('user_id', $user->id)->where('clip_id', $clip->id)->first()
            : null;

        // Increment view count
        $clip->increment('views');

        // Load comments count
        $clip->loadCount('comments');

        // We want to return all translations so frontend can switch.
        // spatie/laravel-translatable does not expose all translations by default when serializing.
        // We can use getTranslations() to append them or simple return the model if we configured it to cast to array?
        // Load comments count and challenges logic
        $clip->loadCount('comments');
        $clip->loadCount('challenges');
        $clip->loadCount(['challenges as completed_challenges_count' => function ($q) {
            $q->whereNotNull('finished_at');
        }]);

        // We want to return all translations so frontend can switch.
        $clipData = $clip->toArray();
        $clipData['name'] = $clip->getTranslations('name');
        $clipData['slug'] = $clip->getTranslations('slug');
        $clipData['description'] = $clip->getTranslations('description');
        // Decode captions JSON to array just in case it's stringified
        $clipData['captions'] = $clip->captions ?? [];
        $clipData['category'] = $clip->category ? $clip->category->toArray() : null;

        if ($clipData['category']) {
            $clipData['category']['name'] = $clip->category->getTranslations('name');
            $clipData['category']['slug'] = $clip->category->getTranslations('slug');
        }

        // Include full tags with translations
        $clipData['tags'] = $clip->tags->map(function ($tag) {
            $t = $tag->toArray();
            $t['name'] = $tag->getTranslations('name');
            $t['slug'] = $tag->getTranslations('slug');
            return $t;
        });

        // Include subclips with translations
        $clipData['subclips'] = $clip->subclips->map(function ($subclip) {
            $s = $subclip->toArray();
            $s['name'] = $subclip->getTranslations('name');
            $s['captions'] = $subclip->captions ?? [];
            $s['is_preview'] = (bool) $subclip->is_preview;
            return $s;
        });

        // Check subscription status
        $subscriptionActive = $user && $user->hasActiveSubscription();

        // Check for active challenge
        $activeChallenge = null;
        if ($user) {
            $challenge = Challenge::where('user_id', $user->id)
                ->where('clip_id', $clip->id)
                ->first();
            if ($challenge) {
                $activeChallenge = [
                    'id' => $challenge->id,
                    'started_at' => $challenge->started_at->toISOString(),
                    'finished_at' => $challenge->finished_at?->toISOString(),
                    'is_completed' => $challenge->isCompleted(),
                    'watched_items' => $challenge->progress()->count(),
                    'total_items' => 1 + $clip->subclips()->count(),
                    'watched_ids' => $challenge->progress()->pluck('watchable_id')->toArray(),
                ];
            }
        }

        return response()->json([
            'clip' => $clipData,
            'user_rating' => $userRating ? $userRating->rating : null,
            'subscription_active' => $subscriptionActive,
            'active_challenge' => $activeChallenge,
            'cartoon_status' => $clip->cartoon_status,
            'cartoon_file_path' => $clip->cartoon_file_path,
        ]);
    }

    public function destroy(Clip $clip)
    {
        // Delete file
        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($clip->file_path)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($clip->file_path);
        }

        // Delete thumbnails
        if ($clip->thumbnails) {
            foreach ($clip->thumbnails as $thumb) {
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($thumb)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($thumb);
                }
            }
        }

        // Delete captions
        if ($clip->captions) {
            foreach ($clip->captions as $cap) {
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($cap)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($cap);
                }
            }
        }

        $clip->delete();
        return response()->json(['message' => 'Clip deleted']);
    }

    public function rate(Request $request, Clip $clip)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:10',
        ]);

        $rating = Rating::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'clip_id' => $clip->id,
            ],
            [
                'rating' => $request->rating,
            ]
        );

        // Update average
        $avg = $clip->ratings()->avg('rating');
        $count = $clip->ratings()->count();

        $clip->update([
            'average_rating' => $avg,
            'ratings_count' => $count,
        ]);

        return response()->json([
            'rating' => $rating,
            'average_rating' => round($avg, 1),
            'ratings_count' => $count,
        ]);
    }
    public function update(Request $request, Clip $clip)
    {
        // FormData sends objects as JSON strings — decode before validation
        foreach (['name', 'slug', 'description'] as $field) {
            $val = $request->input($field);
            if (is_string($val) && is_array(json_decode($val, true))) {
                $request->merge([$field => json_decode($val, true)]);
            }
        }
        // Tags may also arrive as a JSON string
        $tagsVal = $request->input('tags');
        if (is_string($tagsVal) && is_array(json_decode($tagsVal, true))) {
            $request->merge(['tags' => json_decode($tagsVal, true)]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|array',
            'slug' => 'nullable|array',
            'description' => 'sometimes|array',
            'difficulty' => 'sometimes|integer|min:1|max:10',
            'tags' => 'nullable', // string or array
            'category_id' => 'nullable|exists:categories,id',
        ]);

        if (isset($validated['name'])) {
            $clip->setTranslations('name', $validated['name']);

            // Handle slug generation if not provided or partial
            $slugs = $clip->getTranslations('slug'); // Start with existing
            $inputSlugs = $validated['slug'] ?? [];

            foreach ($validated['name'] as $locale => $val) {
                if (!empty($inputSlugs[$locale])) {
                    $slugs[$locale] = $inputSlugs[$locale];
                } else {
                    // Only generate if not exists or if we want to auto-update? 
                    // Usually better to only generate if missing.
                    if (empty($slugs[$locale])) {
                        $slugs[$locale] = \Illuminate\Support\Str::slug($val);
                    }
                }
            }
            $clip->setTranslations('slug', $slugs);
        }

        if (isset($validated['description'])) {
            $clip->setTranslations('description', $validated['description']);
        }

        if (isset($validated['difficulty'])) {
            $clip->difficulty = $validated['difficulty'];
        }

        if (array_key_exists('category_id', $validated)) {
            $clip->category_id = $validated['category_id'];
        }

        $clip->save();

        if (isset($validated['tags'])) {
            // Expecting comma separated string of IDs or JSON? 
            // Frontend sends comma separated for upload, maybe same here?
            // Or maybe array of IDs.
            // Upload.vue sends `tags` as comma separated string of NAMES (or IDs?).
            // Let's check `TagDetail`.
            // Actually, `EditClip.vue` (to be updated) should send tags.
            // Existing `store` implementation handled `tags` as string (comma separated names?)
            // Wait, `store` implementation: `$tags = $request->tags; if (is_string($tags)) json_decode...`
            // The previous code I saw in `store` was:
            // `$tags = $request->tags; if (is_string($tags)) { $tags = json_decode($tags, true); }`
            // And then `$clip->tags()->sync($tags);`
            // `sync` expects array of IDs.
            // So frontend must be sending array of IDs.

            // I'll assume it's array of IDs, or JSON string of array of IDs.
            $tags = $validated['tags'];
            if (is_string($tags)) {
                $decoded = json_decode($tags, true);
                if (is_array($decoded)) {
                    $tags = $decoded;
                }
            }
            if (is_array($tags)) {
                $clip->tags()->sync($tags);
            }
        }

        // Handle Captions upload/update
        $captions = $clip->captions ?? [];
        foreach (['en', 'pl', 'es'] as $lang) {
            if ($request->hasFile("captions_{$lang}")) {
                if (isset($captions[$lang]) && \Illuminate\Support\Facades\Storage::disk('public')->exists($captions[$lang])) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($captions[$lang]);
                }
                $captions[$lang] = $request->file("captions_{$lang}")->store("captions/clips/{$clip->id}", 'public');
            }
        }
        $clip->captions = $captions;
        $clip->save();

        return response()->json($clip);
    }

    public function convertToCartoon(Clip $clip)
    {
        // Prevent re-queueing if already in progress
        if ($clip->cartoon_status === 'processing') {
            return response()->json(['message' => 'Conversion already in progress'], 409);
        }

        $clip->update(['cartoon_status' => 'pending', 'cartoon_error' => null]);

        \App\Jobs\ConvertToCartoonJob::dispatch($clip->id);

        return response()->json([
            'message' => 'Cartoon conversion queued',
            'cartoon_status' => 'pending',
        ]);
    }

    public function cartoonStatus(Clip $clip)
    {
        return response()->json([
            'cartoon_status' => $clip->cartoon_status,
            'cartoon_file_path' => $clip->cartoon_file_path,
            'cartoon_error' => $clip->cartoon_error,
        ]);
    }
}
