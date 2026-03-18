<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Clip $clip)
    {
        return $clip->comments()->with('user')->latest()->get();
    }

    public function store(Request $request, Clip $clip)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = $clip->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return $comment->load('user');
    }
}
