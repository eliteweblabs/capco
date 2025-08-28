# CAPCo Database Scripts

This directory contains utility scripts for database management and testing.

## Import Test Projects Script

**File:** `import-test-projects.js`

Generates and imports realistic test projects with random metadata for development and testing purposes.

### Usage

```bash
# Import 30 test projects (default)
npm run import-test-projects

# Import specific number of projects
npm run import-test-projects 50

# Quick database seeding (50 projects)
npm run seed-db

# Direct node execution
node scripts/import-test-projects.js [count]
```

### Features

- **Realistic Data**: Uses Faker.js to generate believable project data
- **Boston Area Focus**: Addresses in greater Boston area cities and neighborhoods
- **Fire Protection Context**: Building types, services, and documents relevant to CAPCo's business
- **Varied Project Stages**: Projects distributed across different status codes and timelines
- **User Assignment**: Randomly assigns projects to existing clients and staff
- **Batch Processing**: Inserts data in batches for better performance
- **Comprehensive Logging**: Detailed progress and error reporting

### Generated Data Includes

#### Project Details
- **Addresses**: Realistic Boston-area locations with neighborhoods
- **Building Types**: Office buildings, residential complexes, industrial facilities, etc.
- **Square Footage**: 1,000 to 500,000 sq ft
- **Construction Type**: 30% new construction, 70% existing buildings

#### Fire Protection Services
- Sprinkler system installation
- Fire alarm systems
- Emergency lighting
- Smoke detection
- Fire suppression systems
- And more...

#### Project Metadata
- **Status Codes**: Distributed across project lifecycle (10-220)
- **Timeline**: Projects aged 0-365 days
- **Assignments**: Randomly assigned to staff members
- **Documentation**: Requested documents like fire safety plans, as-built drawings
- **Building Details**: Floors, units, occupancy type, year built
- **Service Details**: Priority, complexity, timeline, budget range

#### Featured Projects
- 40% of completed projects (status 220) are marked as featured
- Featured projects appear on the public `/projects` page

### Prerequisites

1. **Environment Variables**: Must have Supabase credentials configured
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Existing Users**: The script requires existing user profiles in the database
   - Creates projects for existing clients
   - Assigns projects to existing staff members
   - If no clients exist, uses all users as potential authors

3. **Database Schema**: Requires the standard CAPCo projects table structure

### Output

The script provides detailed logging:
- User statistics (clients vs staff)
- Batch insertion progress
- Sample project titles and IDs
- Success/failure summary
- Project breakdown by type and status

### Error Handling

- Validates environment variables
- Checks for existing users
- Handles batch insertion failures gracefully
- Provides detailed error messages
- Continues processing even if some batches fail

### Examples

```bash
# Import 25 test projects
npm run import-test-projects 25

# Large dataset for stress testing
npm run import-test-projects 100
```

### Development Notes

- Uses ES modules (import/export)
- Leverages Supabase service role key for admin access
- Respects RLS policies by using proper user assignments
- Generates data appropriate for CAPCo's fire protection business context
- Batch size: 10 projects per database transaction
