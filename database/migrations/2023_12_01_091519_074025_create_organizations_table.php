<?php

use App\Enums\OrganizationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('domain')->nullable()->unique();
            $table->string('api_key', 32)->unique();
            $table->string('status')->default(OrganizationStatus::ACTIVE->value);
            $table->json('settings')->nullable();
            $table->foreignId('subscription_plan_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'subscription_expires_at']);
            $table->index('api_key');
            $table->index('subscription_plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
