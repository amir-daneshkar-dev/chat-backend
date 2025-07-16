<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Console\Command;

class CheckUserOrganizations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:check-organizations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the current state of users and their organizations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking user organizations...');

        // Count total users
        $totalUsers = User::count();
        $this->info("Total users: {$totalUsers}");

        // Count users with organization
        $usersWithOrg = User::whereNotNull('organization_id')->count();
        $this->info("Users with organization: {$usersWithOrg}");

        // Count users without organization
        $usersWithoutOrg = User::whereNull('organization_id')->count();
        $this->info("Users without organization: {$usersWithoutOrg}");

        if ($usersWithoutOrg > 0) {
            $this->warn("⚠️  Found {$usersWithoutOrg} users without organization!");

            $orphanedUsers = User::whereNull('organization_id')->get(['id', 'name', 'email', 'role']);
            $this->table(['ID', 'Name', 'Email', 'Role'], $orphanedUsers->toArray());
        } else {
            $this->info("✅ All users have an organization!");
        }

        // Show organization breakdown
        $this->newLine();
        $this->info('Organization breakdown:');

        $organizations = Organization::withCount('users')->get();

        if ($organizations->count() > 0) {
            $orgData = $organizations->map(function ($org) {
                return [
                    $org->id,
                    $org->name,
                    $org->domain,
                    $org->users_count,
                    $org->subscription_plan_id ? 'Yes' : 'No'
                ];
            })->toArray();

            $this->table(['ID', 'Name', 'Domain', 'Users', 'Has Plan'], $orgData);
        } else {
            $this->warn('No organizations found!');
        }

        // Show user role breakdown
        $this->newLine();
        $this->info('User role breakdown:');

        $roleBreakdown = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->get()
            ->map(function ($item) {
                return [$item->role, $item->count];
            })
            ->toArray();

        $this->table(['Role', 'Count'], $roleBreakdown);

        return 0;
    }
}
