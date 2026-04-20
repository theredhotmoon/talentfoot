<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::withCount('clips')
            ->withSum('clips', 'views')
            ->get()
            ->map(function ($category) {
                // Count subclips across all clips in this category
                $category->total_subclips_count = \App\Models\Clip::where('category_id', $category->id)
                    ->withCount('subclips')
                    ->get()
                    ->sum('subclips_count');
                
                // Fetch up to 4 popular clips for this specific category
                // (Done inside map to avoid the Laravel eager-loading limit gotcha)
                $category->popular_clips = \App\Models\Clip::where('category_id', $category->id)
                    ->orderBy('views', 'desc')
                    ->limit(4)
                    ->get();

                return $category;
            });
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
        ]);

        $name = $request->name;
        $slugs = [];

        if (is_array($name)) {
            foreach ($name as $locale => $val) {
                $slugs[$locale] = Str::slug($val);
            }
        } else {
            $slugs['en'] = Str::slug($name);
            $name = ['en' => $name];
        }

        $category = Category::create([
            'name' => $name,
            'slug' => $slugs, // Assuming slug is translatable
        ]);

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        $sort = request()->input('sort', 'created_at');
        $order = request()->input('order', 'desc');

        $allowedSorts = ['created_at', 'average_rating', 'difficulty', 'views', 'comments_count'];
        $allowedOrders = ['asc', 'desc'];

        if (!in_array($sort, $allowedSorts))
            $sort = 'created_at';
        if (!in_array($order, $allowedOrders))
            $order = 'desc';

        $category->load([
            'clips' => function ($query) use ($sort, $order) {
                $query->withCount('comments')
                      ->withCount('subclips')
                      ->withCount('challenges')
                      ->withCount(['challenges as completed_challenges_count' => function ($q) {
                          $q->whereNotNull('finished_at');
                      }])
                      ->orderBy($sort, $order);
            },
            'clips.tags',
            'clips.category',
        ]);

        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required',
        ]);

        $name = $request->name;
        $requestSlugs = $request->slug;
        $slugs = $category->getTranslations('slug') ?: [];

        if (is_array($name)) {
            foreach ($name as $locale => $val) {
                // Use explicit slug if provided, otherwise auto-generate from name
                if (is_array($requestSlugs) && !empty($requestSlugs[$locale])) {
                    $slugs[$locale] = Str::slug($requestSlugs[$locale]);
                } else {
                    $slugs[$locale] = Str::slug($val);
                }
            }
        }

        $category->update([
            'name' => $name,
            'slug' => $slugs,
        ]);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        if ($category->clips()->count() > 0) {
            return response()->json(['error' => 'Cannot delete category with associated clips.'], 422);
        }

        $category->delete();
        return response()->json(null, 204);
    }
}
