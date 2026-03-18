<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::withCount('clips')
            ->with([
                'clips' => function ($q) {
                    $q->select('clips.id', 'clips.thumbnails')
                        ->limit(4);
                }
            ])
            ->get();

        // Append preview_thumbnails array to each tag
        $tags->each(function ($tag) {
            $tag->setAttribute(
                'preview_thumbnails',
                $tag->clips
                    ->pluck('thumbnails')
                    ->flatten()
                    ->filter()
                    ->unique()
                    ->take(4)
                    ->values()
                    ->toArray()
            );
            unset($tag->clips); // Don't expose full clips in listing
        });

        return $tags;
    }

    public function show(Tag $tag)
    {
        $sort = request()->input('sort', 'created_at');
        $order = request()->input('order', 'desc');

        $allowedSorts = ['created_at', 'average_rating', 'difficulty', 'views', 'comments_count'];
        $allowedOrders = ['asc', 'desc'];

        if (!in_array($sort, $allowedSorts))
            $sort = 'created_at';
        if (!in_array($order, $allowedOrders))
            $order = 'desc';

        $category_id = request()->input('category_id');

        // Load clips for this tag with sorting and filtering
        $tag->load([
            'clips' => function ($query) use ($sort, $order, $category_id) {
                $query->withCount('comments')
                      ->withCount('subclips')
                      ->withCount('challenges')
                      ->withCount(['challenges as completed_challenges_count' => function ($q) {
                          $q->whereNotNull('finished_at');
                      }]);

                if ($category_id) {
                    $query->where('category_id', $category_id);
                }

                $query->orderBy($sort, $order);
            },
            'clips.tags',
            'clips.category',
        ]);

        return $tag;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required', // array
        ]);

        $name = $request->name;
        $slugs = [];

        if (is_array($name)) {
            foreach ($name as $locale => $val) {
                $slugs[$locale] = Str::slug($val);
            }
        } else {
            // Fallback if string sent
            $slugs['en'] = Str::slug($name);
            $name = ['en' => $name];
        }

        $tag = Tag::create([
            'name' => $name,
            'slug' => $slugs,
        ]);

        return response()->json($tag, 201);
    }

    public function update(Request $request, Tag $tag)
    {
        $request->validate([
            'name' => 'required',
        ]);

        $name = $request->name;
        $slugs = $tag->slug; // keep existing slugs or update? Update.

        if (is_array($name)) {
            foreach ($name as $locale => $val) {
                $slugs[$locale] = Str::slug($val);
            }
        }

        $tag->update([
            'name' => $name,
            'slug' => $slugs,
        ]);

        return response()->json($tag);
    }

    public function destroy(Tag $tag)
    {
        // Only allow delete if no clips attached
        if ($tag->clips()->count() > 0) {
            return response()->json(['error' => 'Cannot delete tag with assigned clips.'], 422);
        }

        $tag->delete();
        return response()->json(null, 204);
    }
}
