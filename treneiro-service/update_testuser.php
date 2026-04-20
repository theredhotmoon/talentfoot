$u = \App\Models\User::firstOrCreate(['email'=>'testuser@talentfoot.com'], ['name'=>'E2E Test User', 'password'=>bcrypt('Password1!')]);
$u->password = bcrypt('Password1!');
$u->save();
echo "Done";
