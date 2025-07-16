# Factory Usage Examples

This document shows how to use the new factories for testing and seeding data.

## Organization Factory

### Basic Usage

```php
// Create a basic organization
$org = Organization::factory()->create();

// Create multiple organizations
$orgs = Organization::factory()->count(5)->create();
```

### Subscription Plans

```php
// Create organizations with specific plans
$basicOrg = Organization::factory()->basic()->create();
$premiumOrg = Organization::factory()->premium()->create();
$enterpriseOrg = Organization::factory()->enterprise()->create();
```

### Status States

```php
// Create organizations with different statuses
$activeOrg = Organization::factory()->create(); // Default: active
$inactiveOrg = Organization::factory()->inactive()->create();
$suspendedOrg = Organization::factory()->suspended()->create();
$expiredOrg = Organization::factory()->expired()->create();
```

### Combined States

```php
// Create an expired premium organization
$org = Organization::factory()
    ->premium()
    ->expired()
    ->create();
```

## Chat Factory

### Basic Usage

```php
// Create a waiting chat
$chat = Chat::factory()->create();

// Create multiple chats
$chats = Chat::factory()->count(10)->create();
```

### Chat States

```php
// Create chats with specific statuses
$waitingChat = Chat::factory()->waiting()->create();
$activeChat = Chat::factory()->active()->create();
$closedChat = Chat::factory()->closed()->create();
```

### Relationships

```php
// Create chat for specific user
$user = User::factory()->create();
$chat = Chat::factory()->forUser($user)->create();

// Create chat with specific agent
$agent = User::factory()->create(['role' => 'agent']);
$chat = Chat::factory()->withAgent($agent)->create();

// Create chat for specific organization
$org = Organization::factory()->create();
$chat = Chat::factory()->forOrganization($org)->create();
```

### Time-based States

```php
// Create recent chats
$recentChats = Chat::factory()->recent()->count(5)->create();

// Create old chats
$oldChats = Chat::factory()->old()->count(5)->create();
```

## Message Factory

### Basic Usage

```php
// Create a text message
$message = Message::factory()->create();

// Create multiple messages
$messages = Message::factory()->count(20)->create();
```

### Message Types

```php
// Create different types of messages
$textMessage = Message::factory()->text()->create();
$fileMessage = Message::factory()->file()->create();
$imageMessage = Message::factory()->image()->create();
$voiceMessage = Message::factory()->voice()->create();
$systemMessage = Message::factory()->system()->create();
```

### Relationships

```php
// Create message from specific user
$user = User::factory()->create();
$message = Message::factory()->fromUser($user)->create();

// Create message for specific chat
$chat = Chat::factory()->create();
$message = Message::factory()->forChat($chat)->create();
```

### Read Status

```php
// Create unread messages
$unreadMessages = Message::factory()->unread()->count(5)->create();

// Create read messages
$readMessages = Message::factory()->read()->count(5)->create();
```

### Time-based States

```php
// Create recent messages
$recentMessages = Message::factory()->recent()->count(10)->create();

// Create old messages
$oldMessages = Message::factory()->old()->count(10)->create();
```

## Complex Examples

### Create Complete Chat Session

```php
// Create organization with users and agents
$org = Organization::factory()->premium()->create();
$user = User::factory()->forOrganization($org)->create(['role' => 'user']);
$agent = User::factory()->forOrganization($org)->create(['role' => 'agent']);

// Create agent profile
Agent::factory()->create([
    'user_id' => $agent->id,
    'status' => AgentStatus::AVAILABLE
]);

// Create active chat
$chat = Chat::factory()
    ->forUser($user)
    ->forOrganization($org)
    ->withAgent($agent)
    ->active()
    ->create();

// Create conversation
Message::factory()->forChat($chat)->fromUser($user)->text()->create();
Message::factory()->forChat($chat)->fromUser($agent)->text()->create();
Message::factory()->forChat($chat)->fromUser($user)->image()->create();
Message::factory()->forChat($chat)->fromUser($agent)->text()->create();
```

### Create Organization with Full Data

```php
// Create enterprise organization
$org = Organization::factory()->enterprise()->create();

// Create users and agents
$users = User::factory()
    ->count(10)
    ->forOrganization($org)
    ->create(['role' => 'user']);

$agents = User::factory()
    ->count(5)
    ->forOrganization($org)
    ->create(['role' => 'agent']);

// Create agent profiles
foreach ($agents as $agent) {
    Agent::factory()->create([
        'user_id' => $agent->id,
        'status' => AgentStatus::AVAILABLE
    ]);
}

// Create chats with messages
for ($i = 0; $i < 20; $i++) {
    $user = $users->random();
    $chat = Chat::factory()
        ->forUser($user)
        ->forOrganization($org)
        ->create();

    // Add messages
    Message::factory()
        ->count(fake()->numberBetween(3, 10))
        ->forChat($chat)
        ->create();
}
```

## Testing Examples

### Feature Tests

```php
public function test_agent_can_see_only_their_organization_chats()
{
    // Create two organizations
    $org1 = Organization::factory()->create();
    $org2 = Organization::factory()->create();

    // Create agents for each organization
    $agent1 = User::factory()->forOrganization($org1)->create(['role' => 'agent']);
    $agent2 = User::factory()->forOrganization($org2)->create(['role' => 'agent']);

    // Create chats for each organization
    $chat1 = Chat::factory()->forOrganization($org1)->active()->create();
    $chat2 = Chat::factory()->forOrganization($org2)->active()->create();

    // Test that agent1 only sees org1 chats
    $this->actingAs($agent1)
        ->get('/api/agent/chats')
        ->assertJsonCount(1);
}
```

### Unit Tests

```php
public function test_chat_can_be_closed()
{
    $chat = Chat::factory()->active()->create();

    $chat->close();

    $this->assertEquals(ChatStatus::CLOSED, $chat->status);
    $this->assertNotNull($chat->ended_at);
}
```

## Running the Demo Seeder

To populate your database with realistic demo data:

```bash
php artisan db:seed --class=DemoDataSeeder
```

This will create:

-   6 organizations (3 active with different plans, 2 inactive, 1 suspended, 1 expired)
-   Users and agents for each organization
-   Chats with messages for each organization
-   Realistic conversation flows

## Factory States Summary

### Organization States

-   `basic()` - Basic subscription plan
-   `premium()` - Premium subscription plan
-   `enterprise()` - Enterprise subscription plan
-   `inactive()` - Inactive status
-   `suspended()` - Suspended status
-   `expired()` - Expired subscription

### Chat States

-   `waiting()` - Waiting for agent
-   `active()` - Active with agent
-   `closed()` - Closed chat
-   `recent()` - Created recently
-   `old()` - Created in the past

### Message States

-   `text()` - Text message
-   `file()` - File message
-   `image()` - Image message
-   `voice()` - Voice message
-   `system()` - System message
-   `unread()` - Unread message
-   `read()` - Read message
-   `recent()` - Sent recently
-   `old()` - Sent in the past
