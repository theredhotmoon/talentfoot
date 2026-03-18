<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Models\Clip;
use App\Models\Subclip;
use App\Models\Category;
use App\Models\Tag;

class CourseSeeder extends Seeder
{
    /**
     * Seed 20 football training courses with subclips, captions, and metadata.
     */
    public function run(): void
    {
        // Ensure categories exist
        $categories = $this->ensureCategories();
        $tags = $this->ensureTags();

        $courses = [
            ['en' => 'Beginner Ball Control', 'pl' => 'Kontrola piłki - Początek', 'es' => 'Control de balón para principiantes', 'desc_en' => 'Master the fundamentals of ball control with simple touch exercises.', 'desc_pl' => 'Opanuj podstawy kontroli piłki prostymi ćwiczeniami.', 'desc_es' => 'Domina los fundamentos del control del balón.', 'diff' => 2, 'subs' => 3, 'cat' => 'Technique', 'tags' => ['Ball Control', 'Beginner']],
            ['en' => 'Advanced Dribbling Moves', 'pl' => 'Zaawansowane dryblingi', 'es' => 'Movimientos avanzados de regate', 'desc_en' => 'Take your dribbling to the next level with advanced feints and body movements.', 'desc_pl' => 'Podnieś drybling na wyższy poziom zaawansowanymi zwodami.', 'desc_es' => 'Lleva tu regate al siguiente nivel con fintas avanzadas.', 'diff' => 7, 'subs' => 5, 'cat' => 'Technique', 'tags' => ['Dribbling', 'Advanced']],
            ['en' => 'Speed & Agility Training', 'pl' => 'Trening szybkości i zwinności', 'es' => 'Entrenamiento de velocidad y agilidad', 'desc_en' => 'Improve your on-field speed with ladder drills and cone exercises.', 'desc_pl' => 'Popraw szybkość na boisku ćwiczeniami z drabiną i pachołkami.', 'desc_es' => 'Mejora tu velocidad en el campo con ejercicios de escalera.', 'diff' => 5, 'subs' => 4, 'cat' => 'Fitness', 'tags' => ['Speed', 'Agility']],
            ['en' => 'Passing Accuracy Drills', 'pl' => 'Ćwiczenia dokładności podań', 'es' => 'Ejercicios de precisión en pases', 'desc_en' => 'Develop pinpoint passing accuracy with progressive target exercises.', 'desc_pl' => 'Rozwijaj precyzję podań progresywnymi ćwiczeniami z celami.', 'desc_es' => 'Desarrolla precisión milimétrica en los pases.', 'diff' => 4, 'subs' => 3, 'cat' => 'Technique', 'tags' => ['Passing', 'Accuracy']],
            ['en' => 'Shooting Masterclass', 'pl' => 'Mistrzowskie strzały', 'es' => 'Masterclass de tiro', 'desc_en' => 'Perfect your shooting technique from various angles and distances.', 'desc_pl' => 'Dopracuj technikę strzałów z różnych kątów i odległości.', 'desc_es' => 'Perfecciona tu técnica de tiro desde varios ángulos.', 'diff' => 6, 'subs' => 6, 'cat' => 'Technique', 'tags' => ['Shooting', 'Goals']],
            ['en' => 'Defensive Positioning', 'pl' => 'Pozycjonowanie w obronie', 'es' => 'Posicionamiento defensivo', 'desc_en' => 'Learn how to read the game and position yourself to intercept attacks.', 'desc_pl' => 'Naucz się czytać grę i ustawiać się do przechwytywania ataków.', 'desc_es' => 'Aprende a leer el juego y posicionarte para interceptar ataques.', 'diff' => 5, 'subs' => 4, 'cat' => 'Tactics', 'tags' => ['Defense', 'Positioning']],
            ['en' => 'Goalkeeper Reflexes', 'pl' => 'Refleks bramkarza', 'es' => 'Reflejos del portero', 'desc_en' => 'Sharpen your reaction time with rapid-fire save drills.', 'desc_pl' => 'Wyostrz czas reakcji szybkimi ćwiczeniami interwencji.', 'desc_es' => 'Agudiza tu tiempo de reacción con ejercicios de paradas rápidas.', 'diff' => 8, 'subs' => 5, 'cat' => 'Goalkeeper', 'tags' => ['Goalkeeper', 'Reflexes']],
            ['en' => 'Free Kick Techniques', 'pl' => 'Techniki rzutów wolnych', 'es' => 'Técnicas de tiro libre', 'desc_en' => 'Master different free kick techniques including curve, knuckleball, and power shots.', 'desc_pl' => 'Opanuj różne techniki rzutów wolnych: kręcone, knuckleball i uderzenia z mocą.', 'desc_es' => 'Domina diferentes técnicas de tiro libre: curva, knuckleball y potencia.', 'diff' => 7, 'subs' => 4, 'cat' => 'Technique', 'tags' => ['Free Kicks', 'Shooting']],
            ['en' => 'First Touch Mastery', 'pl' => 'Mistrzowskie pierwsze podanie', 'es' => 'Dominio del primer toque', 'desc_en' => 'Perfect your first touch to gain an advantage in every situation.', 'desc_pl' => 'Udoskonal pierwsze przyjęcie, aby zyskać przewagę w każdej sytuacji.', 'desc_es' => 'Perfecciona tu primer toque para ganar ventaja en cada situación.', 'diff' => 3, 'subs' => 3, 'cat' => 'Technique', 'tags' => ['Ball Control', 'First Touch']],
            ['en' => 'Counter-Attack Tactics', 'pl' => 'Taktyka kontrataku', 'es' => 'Tácticas de contraataque', 'desc_en' => 'Learn how to execute devastating counter-attacks with speed and precision.', 'desc_pl' => 'Naucz się przeprowadzać niszczycielskie kontrataki z szybkością i precyzją.', 'desc_es' => 'Aprende a ejecutar contraataques devastadores con velocidad y precisión.', 'diff' => 6, 'subs' => 3, 'cat' => 'Tactics', 'tags' => ['Tactics', 'Counter-Attack']],
            ['en' => 'Heading & Aerial Duels', 'pl' => 'Główki i walka w powietrzu', 'es' => 'Cabezazos y duelos aéreos', 'desc_en' => 'Dominate aerial battles with proper heading technique and timing.', 'desc_pl' => 'Dominuj w powietrznych pojedynkach właściwą techniką główkowania.', 'desc_es' => 'Domina las batallas aéreas con técnica y timing adecuados.', 'diff' => 5, 'subs' => 3, 'cat' => 'Technique', 'tags' => ['Heading', 'Aerial']],
            ['en' => 'Core Strength for Footballers', 'pl' => 'Siła rdzeniowa dla piłkarzy', 'es' => 'Fuerza central para futbolistas', 'desc_en' => 'Build a strong core to improve balance, stability, and injury prevention.', 'desc_pl' => 'Zbuduj silny rdzeń dla lepszej równowagi i zapobiegania kontuzjom.', 'desc_es' => 'Construye un core fuerte para mejorar el equilibrio y prevenir lesiones.', 'diff' => 4, 'subs' => 6, 'cat' => 'Fitness', 'tags' => ['Fitness', 'Strength']],
            ['en' => 'Wing Play & Crossing', 'pl' => 'Gra skrzydłem i dośrodkowania', 'es' => 'Juego por banda y centros', 'desc_en' => 'Master wing play with effective crossing and 1v1 situations.', 'desc_pl' => 'Opanuj grę na skrzydle z efektywnymi dośrodkowaniami i sytuacjami 1v1.', 'desc_es' => 'Domina el juego por banda con centros efectivos y situaciones 1v1.', 'diff' => 6, 'subs' => 4, 'cat' => 'Tactics', 'tags' => ['Wing Play', 'Crossing']],
            ['en' => 'Penalty Kick Psychology', 'pl' => 'Psychologia rzutów karnych', 'es' => 'Psicología de los penaltis', 'desc_en' => 'Learn the mental game behind penalty kicks and how to stay composed.', 'desc_pl' => 'Naucz się mentalnej strony rzutów karnych i zachowania spokoju.', 'desc_es' => 'Aprende el juego mental detrás de los penaltis y cómo mantener la compostura.', 'diff' => 4, 'subs' => 2, 'cat' => 'Mental', 'tags' => ['Penalties', 'Mental']],
            ['en' => 'Small-Sided Games', 'pl' => 'Gry na małej przestrzeni', 'es' => 'Juegos en espacios reducidos', 'desc_en' => 'Improve decision-making and technical skills with small-sided game scenarios.', 'desc_pl' => 'Popraw podejmowanie decyzji i umiejętności techniczne w grach na małej przestrzeni.', 'desc_es' => 'Mejora la toma de decisiones y habilidades técnicas en juegos reducidos.', 'diff' => 5, 'subs' => 3, 'cat' => 'Tactics', 'tags' => ['Small-Sided', 'Decision Making']],
            ['en' => 'Stretching & Recovery', 'pl' => 'Rozciąganie i regeneracja', 'es' => 'Estiramientos y recuperación', 'desc_en' => 'Essential stretching routines for pre-match warmup and post-training recovery.', 'desc_pl' => 'Niezbędne ćwiczenia rozciągające do rozgrzewki i regeneracji po treningu.', 'desc_es' => 'Rutinas esenciales de estiramiento para calentamiento y recuperación.', 'diff' => 2, 'subs' => 5, 'cat' => 'Fitness', 'tags' => ['Recovery', 'Stretching']],
            ['en' => 'Midfield Domination', 'pl' => 'Dominacja w środku pola', 'es' => 'Dominio del mediocampo', 'desc_en' => 'Control the tempo of the game with midfield positioning and vision drills.', 'desc_pl' => 'Kontroluj tempo gry pozycjonowaniem i ćwiczeniami wizji w środku pola.', 'desc_es' => 'Controla el tempo del juego con posicionamiento y visión de mediocampo.', 'diff' => 7, 'subs' => 5, 'cat' => 'Tactics', 'tags' => ['Midfield', 'Vision']],
            ['en' => 'Skill Moves Encyclopedia', 'pl' => 'Encyklopedia trików', 'es' => 'Enciclopedia de trucos', 'desc_en' => 'A comprehensive collection of skill moves from basic to world-class level.', 'desc_pl' => 'Kompletna kolekcja trików od podstawowych do światowej klasy.', 'desc_es' => 'Una colección completa de trucos desde básicos hasta nivel mundial.', 'diff' => 8, 'subs' => 9, 'cat' => 'Technique', 'tags' => ['Skills', 'Tricks']],
            ['en' => 'Match Day Preparation', 'pl' => 'Przygotowanie do meczu', 'es' => 'Preparación para el partido', 'desc_en' => 'Complete pre-match routine including warmup, mental preparation, and nutrition tips.', 'desc_pl' => 'Kompletna rutyna przedmeczowa: rozgrzewka, przygotowanie mentalne i porady żywieniowe.', 'desc_es' => 'Rutina completa previa al partido: calentamiento, preparación mental y nutrición.', 'diff' => 3, 'subs' => 4, 'cat' => 'Mental', 'tags' => ['Match Prep', 'Warmup']],
            ['en' => 'Tackling & Ball Recovery', 'pl' => 'Odbiory i odzyskiwanie piłki', 'es' => 'Entradas y recuperación del balón', 'desc_en' => 'Clean and effective tackling techniques to win the ball without fouling.', 'desc_pl' => 'Czyste i efektywne techniki odbiorów piłki bez fauli.', 'desc_es' => 'Técnicas de entrada limpias y efectivas para ganar el balón sin cometer falta.', 'diff' => 6, 'subs' => 4, 'cat' => 'Technique', 'tags' => ['Defense', 'Tackling']],
        ];

        $subclipTemplates = [
            'Warm-up Drill',
            'Basic Technique',
            'Progressive Exercise',
            'Full Speed Practice',
            'Advanced Variation',
            'Match Situation',
            'Cool Down',
            'Challenge Mode',
            'Partner Drill',
            'Solo Practice',
            'Game Simulation',
            'Recovery Phase',
        ];

        $subclipTemplatesPl = [
            'Ćwiczenie rozgrzewkowe',
            'Podstawowa technika',
            'Ćwiczenie progresywne',
            'Praktyka z pełną szybkością',
            'Zaawansowana wariacja',
            'Sytuacja meczowa',
            'Schładzanie',
            'Tryb wyzwania',
            'Ćwiczenie z partnerem',
            'Praktyka solo',
            'Symulacja gry',
            'Faza regeneracji',
        ];

        $subclipTemplatesEs = [
            'Ejercicio de calentamiento',
            'Técnica básica',
            'Ejercicio progresivo',
            'Práctica a máxima velocidad',
            'Variación avanzada',
            'Situación de partido',
            'Enfriamiento',
            'Modo desafío',
            'Ejercicio con compañero',
            'Práctica individual',
            'Simulación de juego',
            'Fase de recuperación',
        ];

        // Color palette for videos (each course gets a unique color)
        $colors = [
            '228B22',
            'DC143C',
            '4169E1',
            'FF8C00',
            '9932CC',
            '20B2AA',
            'FF1493',
            '00CED1',
            'DAA520',
            '8B4513',
            '2E8B57',
            'CD5C5C',
            '6A5ACD',
            'FF6347',
            '708090',
            '3CB371',
            'DB7093',
            '4682B4',
            'D2691E',
            '556B2F',
        ];

        $this->command->info('Creating 20 football training courses...');
        $bar = $this->command->getOutput()->createProgressBar(count($courses));

        foreach ($courses as $i => $course) {
            $clipId = (string) Str::uuid();
            $color = $colors[$i];

            // Generate main video file
            $videoPath = "clips/course_{$i}.mp4";
            $this->createPlaceholderVideo($videoPath, $course['en'], $color);

            // Generate thumbnail
            $thumbPath = "thumbnails/{$clipId}/thumb.jpg";
            $this->createPlaceholderThumbnail($thumbPath, $course['en'], $color);

            // Generate captions
            $captionPaths = [];
            foreach (['en' => $course['desc_en'], 'pl' => $course['desc_pl'], 'es' => $course['desc_es']] as $lang => $desc) {
                $captionPath = "captions/clips/{$clipId}/{$lang}.vtt";
                $this->createVttCaption($captionPath, $course[$lang], $desc, $lang);
                $captionPaths[$lang] = $captionPath;
            }

            // Find category
            $categoryId = null;
            foreach ($categories as $cat) {
                $catName = is_array($cat->name) ? ($cat->name['en'] ?? '') : $cat->name;
                if ($catName === $course['cat']) {
                    $categoryId = $cat->id;
                    break;
                }
            }

            // Create clip
            $clip = Clip::create([
                'id' => $clipId,
                'name' => ['en' => $course['en'], 'pl' => $course['pl'], 'es' => $course['es']],
                'slug' => ['en' => Str::slug($course['en']), 'pl' => Str::slug($course['pl']), 'es' => Str::slug($course['es'])],
                'description' => ['en' => $course['desc_en'], 'pl' => $course['desc_pl'], 'es' => $course['desc_es']],
                'file_path' => $videoPath,
                'difficulty' => $course['diff'],
                'category_id' => $categoryId,
                'password_protected' => true,
                'views' => rand(50, 2000),
                'average_rating' => round(rand(50, 95) / 10, 1),
                'ratings_count' => rand(5, 150),
                'thumbnails' => [$thumbPath],
                'captions' => $captionPaths,
            ]);

            // Attach tags
            $tagIds = [];
            foreach ($course['tags'] as $tagName) {
                foreach ($tags as $tag) {
                    $tName = is_array($tag->name) ? ($tag->name['en'] ?? '') : $tag->name;
                    if ($tName === $tagName) {
                        $tagIds[] = $tag->id;
                        break;
                    }
                }
            }
            if (!empty($tagIds)) {
                $clip->tags()->sync($tagIds);
            }

            // Create subclips
            for ($s = 0; $s < $course['subs']; $s++) {
                $subId = (string) Str::uuid();
                $subVideoPath = "subclips/course_{$i}_sub_{$s}.mp4";
                $subName = $subclipTemplates[$s % count($subclipTemplates)] . ' ' . ($s + 1);
                $subNamePl = $subclipTemplatesPl[$s % count($subclipTemplatesPl)] . ' ' . ($s + 1);
                $subNameEs = $subclipTemplatesEs[$s % count($subclipTemplatesEs)] . ' ' . ($s + 1);

                // Slightly varied color for subclips
                $subColor = dechex(hexdec($color) + ($s * 111111) % 0xFFFFFF);
                $subColor = str_pad(substr($subColor, 0, 6), 6, '0', STR_PAD_LEFT);

                $this->createPlaceholderVideo($subVideoPath, $subName, $subColor);

                $subThumbPath = "thumbnails/{$clipId}/sub_{$s}.jpg";
                $this->createPlaceholderThumbnail($subThumbPath, $subName, $subColor);

                // Subclip captions
                $subCaptionPaths = [];
                foreach (['en' => $subName, 'pl' => $subNamePl, 'es' => $subNameEs] as $lang => $name) {
                    $subCaptionPath = "captions/subclips/{$subId}/{$lang}.vtt";
                    $this->createVttCaption($subCaptionPath, $name, "Practice this step carefully. Focus on your technique and body position.", $lang);
                    $subCaptionPaths[$lang] = $subCaptionPath;
                }

                Subclip::create([
                    'id' => $subId,
                    'clip_id' => $clipId,
                    'name' => ['en' => $subName, 'pl' => $subNamePl, 'es' => $subNameEs],
                    'file_path' => $subVideoPath,
                    'difficulty' => max(1, min(10, $course['diff'] + rand(-1, 2))),
                    'sort_order' => $s + 1,
                    'views' => rand(10, 500),
                    'average_rating' => round(rand(40, 95) / 10, 1),
                    'ratings_count' => rand(1, 50),
                    'thumbnails' => [$subThumbPath],
                    'captions' => $subCaptionPaths,
                    'is_preview' => $s === 0, // First subclip is always preview
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->command->newLine();
        $this->command->info('✅ 20 courses seeded successfully!');
    }

    private function ensureCategories(): array
    {
        $defaultCategories = [
            ['en' => 'Technique', 'pl' => 'Technika', 'es' => 'Técnica'],
            ['en' => 'Fitness', 'pl' => 'Kondycja', 'es' => 'Fitness'],
            ['en' => 'Tactics', 'pl' => 'Taktyka', 'es' => 'Táctica'],
            ['en' => 'Goalkeeper', 'pl' => 'Bramkarz', 'es' => 'Portero'],
            ['en' => 'Mental', 'pl' => 'Mentalność', 'es' => 'Mental'],
        ];

        foreach ($defaultCategories as $cat) {
            $existing = Category::all()->first(function ($c) use ($cat) {
                $name = is_array($c->name) ? ($c->name['en'] ?? '') : $c->name;
                return $name === $cat['en'];
            });

            if (!$existing) {
                Category::create([
                    'name' => $cat,
                    'slug' => ['en' => Str::slug($cat['en']), 'pl' => Str::slug($cat['pl']), 'es' => Str::slug($cat['es'])],
                ]);
            }
        }

        return Category::all()->toArray() ? Category::all()->all() : [];
    }

    private function ensureTags(): array
    {
        $allTagNames = [
            ['en' => 'Ball Control', 'pl' => 'Kontrola piłki', 'es' => 'Control de balón'],
            ['en' => 'Beginner', 'pl' => 'Początkujący', 'es' => 'Principiante'],
            ['en' => 'Dribbling', 'pl' => 'Drybling', 'es' => 'Regate'],
            ['en' => 'Advanced', 'pl' => 'Zaawansowany', 'es' => 'Avanzado'],
            ['en' => 'Speed', 'pl' => 'Szybkość', 'es' => 'Velocidad'],
            ['en' => 'Agility', 'pl' => 'Zwinność', 'es' => 'Agilidad'],
            ['en' => 'Passing', 'pl' => 'Podania', 'es' => 'Pases'],
            ['en' => 'Accuracy', 'pl' => 'Dokładność', 'es' => 'Precisión'],
            ['en' => 'Shooting', 'pl' => 'Strzały', 'es' => 'Disparos'],
            ['en' => 'Goals', 'pl' => 'Bramki', 'es' => 'Goles'],
            ['en' => 'Defense', 'pl' => 'Obrona', 'es' => 'Defensa'],
            ['en' => 'Positioning', 'pl' => 'Ustawianie', 'es' => 'Posicionamiento'],
            ['en' => 'Goalkeeper', 'pl' => 'Bramkarz', 'es' => 'Portero'],
            ['en' => 'Reflexes', 'pl' => 'Refleks', 'es' => 'Reflejos'],
            ['en' => 'Free Kicks', 'pl' => 'Rzuty wolne', 'es' => 'Tiros libres'],
            ['en' => 'First Touch', 'pl' => 'Pierwsze podanie', 'es' => 'Primer toque'],
            ['en' => 'Tactics', 'pl' => 'Taktyka', 'es' => 'Táctica'],
            ['en' => 'Counter-Attack', 'pl' => 'Kontratak', 'es' => 'Contraataque'],
            ['en' => 'Heading', 'pl' => 'Główki', 'es' => 'Cabezazos'],
            ['en' => 'Aerial', 'pl' => 'Powietrzne', 'es' => 'Aéreo'],
            ['en' => 'Fitness', 'pl' => 'Kondycja', 'es' => 'Fitness'],
            ['en' => 'Strength', 'pl' => 'Siła', 'es' => 'Fuerza'],
            ['en' => 'Wing Play', 'pl' => 'Gra skrzydłem', 'es' => 'Juego por banda'],
            ['en' => 'Crossing', 'pl' => 'Dośrodkowania', 'es' => 'Centros'],
            ['en' => 'Penalties', 'pl' => 'Karne', 'es' => 'Penaltis'],
            ['en' => 'Mental', 'pl' => 'Mentalność', 'es' => 'Mental'],
            ['en' => 'Small-Sided', 'pl' => 'Małe gry', 'es' => 'Juegos reducidos'],
            ['en' => 'Decision Making', 'pl' => 'Podejmowanie decyzji', 'es' => 'Toma de decisiones'],
            ['en' => 'Recovery', 'pl' => 'Regeneracja', 'es' => 'Recuperación'],
            ['en' => 'Stretching', 'pl' => 'Rozciąganie', 'es' => 'Estiramiento'],
            ['en' => 'Midfield', 'pl' => 'Środek pola', 'es' => 'Mediocampo'],
            ['en' => 'Vision', 'pl' => 'Wizja gry', 'es' => 'Visión'],
            ['en' => 'Skills', 'pl' => 'Umiejętności', 'es' => 'Habilidades'],
            ['en' => 'Tricks', 'pl' => 'Triki', 'es' => 'Trucos'],
            ['en' => 'Match Prep', 'pl' => 'Przygotowanie', 'es' => 'Preparación'],
            ['en' => 'Warmup', 'pl' => 'Rozgrzewka', 'es' => 'Calentamiento'],
            ['en' => 'Tackling', 'pl' => 'Odbiory', 'es' => 'Entradas'],
        ];

        foreach ($allTagNames as $tagName) {
            $existing = Tag::all()->first(function ($t) use ($tagName) {
                $name = is_array($t->name) ? ($t->name['en'] ?? '') : $t->name;
                return $name === $tagName['en'];
            });

            if (!$existing) {
                Tag::create([
                    'name' => $tagName,
                    'slug' => ['en' => Str::slug($tagName['en']), 'pl' => Str::slug($tagName['pl']), 'es' => Str::slug($tagName['es'])],
                ]);
            }
        }

        return Tag::all()->all();
    }

    /**
     * Create a minimal valid MP4 placeholder video using an SVG-based approach.
     * Actually creates a tiny valid MP4 with just the container atoms.
     */
    private function createPlaceholderVideo(string $path, string $title, string $color): void
    {
        // Create a minimal valid MP4 file (ftyp + moov + mdat atoms)
        // This is a bare-minimum MP4 that video players can open
        $mp4 = $this->generateMinimalMp4();
        Storage::disk('public')->put($path, $mp4);
    }

    /**
     * Create a placeholder thumbnail as a simple colored JPEG-like image.
     */
    private function createPlaceholderThumbnail(string $path, string $title, string $color): void
    {
        // Create image with GD if available, otherwise use a minimal JPEG
        if (function_exists('imagecreatetruecolor')) {
            $img = imagecreatetruecolor(640, 360);
            $r = hexdec(substr($color, 0, 2));
            $g = hexdec(substr($color, 2, 2));
            $b = hexdec(substr($color, 4, 2));
            $bg = imagecolorallocate($img, $r, $g, $b);
            $darkBg = imagecolorallocate($img, max(0, $r - 40), max(0, $g - 40), max(0, $b - 40));
            $white = imagecolorallocate($img, 255, 255, 255);
            $lightGray = imagecolorallocate($img, 200, 200, 200);

            // Gradient-ish background
            imagefilledrectangle($img, 0, 0, 640, 180, $bg);
            imagefilledrectangle($img, 0, 180, 640, 360, $darkBg);

            // Football emoji placeholder (circle)
            imagefilledellipse($img, 320, 140, 80, 80, $white);
            imageellipse($img, 320, 140, 80, 80, $darkBg);

            // Title text
            $shortTitle = strlen($title) > 30 ? substr($title, 0, 27) . '...' : $title;
            $fontSize = 4; // GD built-in font size
            $textWidth = imagefontwidth($fontSize) * strlen($shortTitle);
            $x = (640 - $textWidth) / 2;
            imagestring($img, $fontSize, max(10, $x), 240, $shortTitle, $white);

            // "TalentFoot" watermark
            imagestring($img, 2, 10, 340, 'TalentFoot', $lightGray);

            ob_start();
            imagejpeg($img, null, 85);
            $jpegData = ob_get_clean();
            imagedestroy($img);
            Storage::disk('public')->put($path, $jpegData);
        } else {
            // Fallback: 1x1 pixel JPEG
            $jpeg = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAIIAAQABAAMBAAAAAAAAAAAAAAAAAAABAAMB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAU//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AH//2Q==');
            Storage::disk('public')->put($path, $jpeg);
        }
    }

    /**
     * Create a VTT caption file with sample dialogue.
     */
    private function createVttCaption(string $path, string $title, string $description, string $lang): void
    {
        $intros = [
            'en' => ['Welcome to', 'In this lesson, we will cover', 'Focus on your technique', 'Remember to warm up first', 'Practice this at your own pace', 'Great work! Keep it up'],
            'pl' => ['Witamy w', 'W tej lekcji omówimy', 'Skup się na technice', 'Pamiętaj o rozgrzewce', 'Ćwicz we własnym tempie', 'Świetna robota! Tak trzymaj'],
            'es' => ['Bienvenido a', 'En esta lección cubriremos', 'Enfócate en tu técnica', 'Recuerda calentar primero', 'Practica a tu propio ritmo', 'Gran trabajo! Sigue así'],
        ];

        $phrases = $intros[$lang] ?? $intros['en'];

        $vtt = "WEBVTT\n\n";
        $vtt .= "1\n00:00:00.000 --> 00:00:03.000\n{$phrases[0]} {$title}\n\n";
        $vtt .= "2\n00:00:03.000 --> 00:00:06.000\n{$phrases[1]}\n\n";
        $vtt .= "3\n00:00:06.000 --> 00:00:09.000\n{$phrases[2]}\n\n";
        $vtt .= "4\n00:00:09.000 --> 00:00:12.000\n{$phrases[3]}\n\n";
        $vtt .= "5\n00:00:12.000 --> 00:00:15.000\n{$phrases[4]}\n\n";
        $vtt .= "6\n00:00:15.000 --> 00:00:18.000\n{$phrases[5]}\n\n";

        Storage::disk('public')->put($path, $vtt);
    }

    /**
     * Generate a minimal valid MP4 file (about 1KB).
     * Creates the minimum atoms needed for a valid MP4: ftyp + moov + mdat
     */
    private function generateMinimalMp4(): string
    {
        // Minimal MP4 with ftyp box + free box
        // This is enough for browsers to recognize it as video/mp4
        $ftyp = $this->mp4Box('ftyp', "isom\x00\x00\x00\x00" . "isom" . "iso2" . "mp41");

        // Create a very minimal moov atom
        $mvhd = $this->createMvhd();
        $trak = $this->createVideoTrak();
        $moov = $this->mp4Box('moov', $mvhd . $trak);

        // Empty media data
        $mdat = $this->mp4Box('mdat', '');

        return $ftyp . $moov . $mdat;
    }

    private function mp4Box(string $type, string $content): string
    {
        $size = 8 + strlen($content);
        return pack('N', $size) . $type . $content;
    }

    private function createMvhd(): string
    {
        // Movie header (version 0)
        $data = pack('C', 0);          // version
        $data .= "\x00\x00\x00";       // flags
        $data .= pack('N', 0);         // creation_time
        $data .= pack('N', 0);         // modification_time
        $data .= pack('N', 1000);      // timescale
        $data .= pack('N', 1000);      // duration (1 second)
        $data .= pack('N', 0x00010000); // rate (1.0)
        $data .= pack('n', 0x0100);    // volume (1.0)
        $data .= str_repeat("\x00", 10); // reserved
        // Matrix (identity)
        $data .= pack('N', 0x00010000) . pack('N', 0) . pack('N', 0);
        $data .= pack('N', 0) . pack('N', 0x00010000) . pack('N', 0);
        $data .= pack('N', 0) . pack('N', 0) . pack('N', 0x40000000);
        $data .= str_repeat("\x00", 24); // pre_defined
        $data .= pack('N', 2);          // next_track_ID

        return $this->mp4Box('mvhd', $data);
    }

    private function createVideoTrak(): string
    {
        // Track header
        $tkhd = $this->createTkhd();
        // Media
        $mdia = $this->createMdia();

        return $this->mp4Box('trak', $tkhd . $mdia);
    }

    private function createTkhd(): string
    {
        $data = pack('C', 0);           // version
        $data .= "\x00\x00\x03";        // flags (track_enabled | track_in_movie)
        $data .= pack('N', 0);          // creation_time
        $data .= pack('N', 0);          // modification_time
        $data .= pack('N', 1);          // track_ID
        $data .= pack('N', 0);          // reserved
        $data .= pack('N', 1000);       // duration
        $data .= str_repeat("\x00", 8); // reserved
        $data .= pack('n', 0);          // layer
        $data .= pack('n', 0);          // alternate_group
        $data .= pack('n', 0);          // volume (0 for video)
        $data .= "\x00\x00";            // reserved
        // Matrix
        $data .= pack('N', 0x00010000) . pack('N', 0) . pack('N', 0);
        $data .= pack('N', 0) . pack('N', 0x00010000) . pack('N', 0);
        $data .= pack('N', 0) . pack('N', 0) . pack('N', 0x40000000);
        $data .= pack('N', 640 << 16);  // width (640.0)
        $data .= pack('N', 360 << 16);  // height (360.0)

        return $this->mp4Box('tkhd', $data);
    }

    private function createMdia(): string
    {
        $mdhd = $this->createMdhd();
        $hdlr = $this->createHdlr();
        $minf = $this->createMinf();

        return $this->mp4Box('mdia', $mdhd . $hdlr . $minf);
    }

    private function createMdhd(): string
    {
        $data = pack('C', 0);          // version
        $data .= "\x00\x00\x00";       // flags
        $data .= pack('N', 0);         // creation_time
        $data .= pack('N', 0);         // modification_time
        $data .= pack('N', 1000);      // timescale
        $data .= pack('N', 1000);      // duration
        $data .= pack('n', 0x55C4);    // language (undetermined)
        $data .= pack('n', 0);         // pre_defined

        return $this->mp4Box('mdhd', $data);
    }

    private function createHdlr(): string
    {
        $data = pack('C', 0);          // version
        $data .= "\x00\x00\x00";       // flags
        $data .= pack('N', 0);         // pre_defined
        $data .= "vide";               // handler_type
        $data .= str_repeat("\x00", 12); // reserved
        $data .= "VideoHandler\x00";   // name

        return $this->mp4Box('hdlr', $data);
    }

    private function createMinf(): string
    {
        // Video media header
        $vmhd = $this->mp4Box('vmhd', pack('C', 0) . "\x00\x00\x01" . str_repeat("\x00", 8));
        // Data info
        $dref = $this->mp4Box('dref', pack('C', 0) . "\x00\x00\x00" . pack('N', 1) . $this->mp4Box('url ', pack('C', 0) . "\x00\x00\x01"));
        $dinf = $this->mp4Box('dinf', $dref);
        // Sample table
        $stbl = $this->createStbl();

        return $this->mp4Box('minf', $vmhd . $dinf . $stbl);
    }

    private function createStbl(): string
    {
        // Sample description
        $avc1 = "\x00\x00\x00\x00\x00\x00" // reserved
            . pack('n', 1)                   // data_reference_index
            . str_repeat("\x00", 16)         // pre_defined + reserved
            . pack('n', 640)                 // width
            . pack('n', 360)                 // height
            . pack('N', 0x00480000)          // horizresolution
            . pack('N', 0x00480000)          // vertresolution
            . pack('N', 0)                   // reserved
            . pack('n', 1)                   // frame_count
            . str_repeat("\x00", 32)         // compressorname
            . pack('n', 0x0018)              // depth
            . pack('n', 0xFFFF);             // pre_defined

        $stsd = $this->mp4Box('stsd', pack('C', 0) . "\x00\x00\x00" . pack('N', 1) . $this->mp4Box('avc1', $avc1));

        // Empty tables
        $stts = $this->mp4Box('stts', pack('C', 0) . "\x00\x00\x00" . pack('N', 0));
        $stsc = $this->mp4Box('stsc', pack('C', 0) . "\x00\x00\x00" . pack('N', 0));
        $stsz = $this->mp4Box('stsz', pack('C', 0) . "\x00\x00\x00" . pack('N', 0) . pack('N', 0));
        $stco = $this->mp4Box('stco', pack('C', 0) . "\x00\x00\x00" . pack('N', 0));

        return $this->mp4Box('stbl', $stsd . $stts . $stsc . $stsz . $stco);
    }
}
