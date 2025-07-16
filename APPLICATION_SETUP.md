# Application Setup

This document explains how to set up the initial application with an organization, admin user, and agent user.

## Configuration

The setup values are configured in `config/setup.php` and can be overridden using environment variables.

### Default Configuration

```php
// config/setup.php
return [
    'organization' => [
        'name' => env('SETUP_ORG_NAME', 'Demo Organization'),
        'domain' => env('SETUP_ORG_DOMAIN', 'demo.example.com'),
    ],

    'admin' => [
        'name' => env('SETUP_ADMIN_NAME', 'Admin User'),
        'email' => env('SETUP_ADMIN_EMAIL', 'admin@example.com'),
        'password' => env('SETUP_ADMIN_PASSWORD', 'password'),
    ],

    'agent' => [
        'name' => env('SETUP_AGENT_NAME', 'Support Agent'),
        'email' => env('SETUP_AGENT_EMAIL', 'agent@example.com'),
        'password' => env('SETUP_AGENT_PASSWORD', 'password'),
    ],


];
```

### Environment Variables

You can override the default values by setting these environment variables in your `.env` file:

```env
# Organization
SETUP_ORG_NAME="My Company"
SETUP_ORG_DOMAIN="mycompany.com"

# Admin User
SETUP_ADMIN_NAME="John Admin"
SETUP_ADMIN_EMAIL="admin@mycompany.com"
SETUP_ADMIN_PASSWORD="secure_password_123"

# Agent User
SETUP_AGENT_NAME="Jane Agent"
SETUP_AGENT_EMAIL="agent@mycompany.com"
SETUP_AGENT_PASSWORD="agent_password_123"


```

## Running the Setup

### Option 1: Run the entire database seeder

```bash
php artisan db:seed
```

This will run all seeders including:

1. `ApplicationSetupSeeder` - Creates organization, admin, and agent
2. `ChatSeeder` - Creates sample chats
3. `DemoDataSeeder` - Creates additional demo data

### Option 2: Run only the ApplicationSetupSeeder

```bash
php artisan db:seed --class=ApplicationSetupSeeder
```

### Option 3: Run with fresh database

```bash
php artisan migrate:fresh --seed
```

## What Gets Created

The `ApplicationSetupSeeder` creates:

1. **Organization**

    - Name and domain from configuration
    - Active status
    - API key (auto-generated)
    - Default settings with unlimited features

2. **Admin User**

    - Name, email, and password from configuration
    - Admin role
    - Associated with the organization
    - Offline status

3. **Agent User**

    - Name, email, and password from configuration
    - Agent role
    - Associated with the organization
    - Offline status

4. **Agent Record**
    - Available status
    - 0 active chats
    - Max chats based on subscription plan
    - General support skills

## Output

When the seeder runs successfully, you'll see output like:

```
Setting up initial application...
Organization 'My Company' created/updated.
Admin user 'John Admin' created/updated.
Agent user 'Jane Agent' created/updated.
Agent record for 'Jane Agent' created/updated.
Application setup completed successfully!

Created:
- Organization: My Company (mycompany.com)
- Admin: John Admin (admin@mycompany.com)
- Agent: Jane Agent (agent@mycompany.com)

You can now log in with these credentials.
```

## Security Notes

-   **Always change default passwords** after first login
-   **Use strong passwords** in production
-   **Consider using environment variables** for sensitive data
-   **Review and update** the configuration before deploying to production

## Troubleshooting

### Duplicate Email Addresses

The seeder uses `updateOrCreate` to handle existing records. If users with the same email already exist, their information will be updated.

### Organization Domain Conflicts

If an organization with the same domain already exists, it will be updated with the new configuration.
