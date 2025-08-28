#!/usr/bin/env node

/**
 * Test Project Import Script
 *
 * Generates and imports realistic test projects with random metadata
 * Run with: node scripts/import-test-projects.js [count]
 *
 * Default: 30 projects
 * Example: node scripts/import-test-projects.js 50
 */

import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables:");
  console.error("   - SUPABASE_URL or PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Boston area cities and neighborhoods for realistic addresses
const BOSTON_AREAS = [
  "Boston",
  "Cambridge",
  "Somerville",
  "Brookline",
  "Newton",
  "Waltham",
  "Medford",
  "Malden",
  "Quincy",
  "Braintree",
  "Watertown",
  "Belmont",
  "Arlington",
  "Lexington",
  "Woburn",
  "Burlington",
  "Bedford",
  "Concord",
  "Lincoln",
  "Wellesley",
  "Needham",
  "Dedham",
  "Milton",
  "Randolph",
  "Weymouth",
  "Hingham",
  "Cohasset",
  "Scituate",
  "Hull",
  "Revere",
  "Chelsea",
  "Everett",
  "Melrose",
  "Wakefield",
  "Stoneham",
  "Reading",
];

const NEIGHBORHOODS = [
  "Back Bay",
  "North End",
  "South End",
  "Beacon Hill",
  "Financial District",
  "Fenway",
  "Jamaica Plain",
  "Cambridge Port",
  "Harvard Square",
  "Porter Square",
  "Davis Square",
  "Union Square",
  "Coolidge Corner",
  "Newton Centre",
  "Chestnut Hill",
];

// Building types for fire protection systems
const BUILDING_TYPES = [
  "Office Building",
  "Residential Complex",
  "Retail Plaza",
  "Industrial Warehouse",
  "Medical Facility",
  "Educational Building",
  "Hotel",
  "Restaurant",
  "Manufacturing Plant",
  "Data Center",
  "Shopping Mall",
  "Apartment Building",
  "Condominium",
  "Mixed-Use Development",
  "Hospital",
  "School",
  "University Building",
  "Government Building",
  "Library",
  "Recreation Center",
  "Parking Garage",
  "Storage Facility",
  "Laboratory",
];

// Fire protection services
const FIRE_SERVICES = [
  "Sprinkler System Installation",
  "Fire Alarm System",
  "Emergency Lighting",
  "Fire Suppression System",
  "Smoke Detection",
  "Fire Extinguisher Service",
  "Exit Sign Installation",
  "Fire Safety Inspection",
  "Suppression Maintenance",
  "Alarm Monitoring Setup",
  "Fire Door Installation",
  "Emergency Communication",
];

// Project statuses (common ones)
const PROJECT_STATUSES = [
  10, // Quote Requested
  20, // Quote Sent
  30, // Project Awarded
  40, // Site Survey Scheduled
  50, // Design in Progress
  60, // Permits Submitted
  70, // Permits Approved
  80, // Installation Started
  90, // Installation in Progress
  100, // Installation Complete
  110, // Testing Phase
  120, // Final Inspection
  130, // Documentation
  140, // Training Scheduled
  150, // Training Complete
  160, // Warranty Period
  170, // Project Review
  180, // Client Feedback
  190, // Final Invoice
  200, // Payment Received
  210, // Closeout Documentation
  220, // Project Complete
];

// Document types commonly requested
const DOCUMENT_TYPES = [
  "Fire Safety Plan",
  "As-Built Drawings",
  "Equipment Specifications",
  "Inspection Certificates",
  "Maintenance Manual",
  "Warranty Documents",
  "Test Reports",
  "Training Materials",
  "Code Compliance Reports",
  "Installation Photos",
  "System Schematics",
  "Operating Instructions",
];

/**
 * Generate random realistic project data
 */
function generateProjectData(authors, staff) {
  const isNewConstruction = faker.datatype.boolean(0.3); // 30% new construction
  const city = faker.helpers.arrayElement(BOSTON_AREAS);
  const hasNeighborhood = faker.datatype.boolean(0.4);
  const neighborhood = hasNeighborhood ? faker.helpers.arrayElement(NEIGHBORHOODS) : null;

  // Generate realistic address
  const streetNumber = faker.number.int({ min: 1, max: 9999 });
  const streetName = faker.location.street();
  const fullAddress = neighborhood
    ? `${streetNumber} ${streetName}, ${neighborhood}, ${city}, MA`
    : `${streetNumber} ${streetName}, ${city}, MA`;

  // Generate building details
  const buildingType = faker.helpers.arrayElement(BUILDING_TYPES);
  const sqFt = faker.number.int({ min: 1000, max: 500000 });
  const floors = faker.number.int({ min: 1, max: 40 });
  const units = isNewConstruction ? faker.number.int({ min: 1, max: 200 }) : null;

  // Generate service details
  const serviceCount = faker.number.int({ min: 1, max: 4 });
  const services = faker.helpers.arrayElements(FIRE_SERVICES, serviceCount);

  // Generate document requests
  const docCount = faker.number.int({ min: 2, max: 6 });
  const requestedDocs = faker.helpers.arrayElements(DOCUMENT_TYPES, docCount);

  // Select random author and assigned staff
  const author = faker.helpers.arrayElement(authors);
  const assignedStaff = faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(staff) : null;

  // Select realistic status based on project age
  const projectAge = faker.number.int({ min: 0, max: 365 }); // Days ago
  let status;
  if (projectAge < 7) {
    status = faker.helpers.arrayElement([10, 20, 30]); // New projects
  } else if (projectAge < 30) {
    status = faker.helpers.arrayElement([30, 40, 50, 60, 70]); // Recent projects
  } else if (projectAge < 90) {
    status = faker.helpers.arrayElement([70, 80, 90, 100, 110, 120]); // In progress
  } else if (projectAge < 180) {
    status = faker.helpers.arrayElement([120, 130, 140, 150, 160]); // Completing
  } else {
    status = faker.helpers.arrayElement([170, 180, 190, 200, 210, 220]); // Finished
  }

  // Note: Database handles created_at/updated_at automatically

  // Generate project title
  const titleOptions = [
    `${buildingType} - ${fullAddress}`,
    `Fire Protection System - ${streetNumber} ${streetName}`,
    `${buildingType} Fire Safety Upgrade`,
    `New ${buildingType} Fire Protection`,
    `${buildingType} Sprinkler Installation`,
  ];
  const title = faker.helpers.arrayElement(titleOptions);

  // Generate description
  const description = `${isNewConstruction ? "New construction" : "Existing building"} fire protection system project for ${buildingType.toLowerCase()}. ${services.join(", ")}. Building size: ${sqFt.toLocaleString()} sq ft${floors > 1 ? `, ${floors} floors` : ""}.`;

  return {
    author_id: author.id,
    assigned_to_id: assignedStaff?.id || null,
    title,
    description,
    address: fullAddress,
    status,
    sq_ft: sqFt,
    new_construction: isNewConstruction,
    building: {
      type: buildingType,
      floors,
      units: units,
      yearBuilt: isNewConstruction
        ? new Date().getFullYear()
        : faker.number.int({ min: 1950, max: 2020 }),
      occupancy: faker.helpers.arrayElement([
        "Commercial",
        "Residential",
        "Industrial",
        "Mixed-Use",
        "Institutional",
      ]),
    },
    project: {
      priority: faker.helpers.arrayElement(["Standard", "High", "Emergency", "Low"]),
      complexity: faker.helpers.arrayElement(["Simple", "Standard", "Complex", "High-Risk"]),
      timeline: faker.helpers.arrayElement(["2-4 weeks", "1-2 months", "3-6 months", "6+ months"]),
      budget_range: faker.helpers.arrayElement([
        "$10k-25k",
        "$25k-50k",
        "$50k-100k",
        "$100k-250k",
        "$250k+",
      ]),
    },
    service: {
      primary_services: services,
      coverage_area: faker.helpers.arrayElement([
        "Full Building",
        "Partial",
        "Specific Areas",
        "Critical Areas Only",
      ]),
      code_requirements: faker.helpers.arrayElement([
        "NFPA 13",
        "NFPA 14",
        "NFPA 20",
        "Local Fire Code",
        "Custom Requirements",
      ]),
      inspection_required: faker.datatype.boolean(0.8),
    },
    requested_docs: requestedDocs,
  };
}

/**
 * Import test projects to database
 */
async function importTestProjects(count = 30) {
  console.log(`🏗️  Starting import of ${count} test projects...`);

  try {
    // First, get existing users to assign as authors
    console.log("👥 Fetching existing users...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, role");

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      throw new Error("No user profiles found. Please create some users first.");
    }

    console.log(`   Found ${profiles.length} users`);

    // Separate clients and staff
    const clients = profiles.filter((p) => p.role === "Client");
    const staff = profiles.filter((p) => ["Admin", "Staff"].includes(p.role));

    console.log(`   - ${clients.length} clients, ${staff.length} staff members`);

    if (clients.length === 0) {
      console.warn("⚠️  No clients found. Projects will be created for all users.");
    }

    const authors = clients.length > 0 ? clients : profiles;

    // Generate project data
    console.log("🎲 Generating random project data...");
    const projectsData = [];

    for (let i = 0; i < count; i++) {
      projectsData.push(generateProjectData(authors, staff));
    }

    // Insert projects in batches
    console.log("💾 Inserting projects into database...");
    const batchSize = 10;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < projectsData.length; i += batchSize) {
      const batch = projectsData.slice(i, i + batchSize);

      try {
        const { data, error } = await supabase
          .from("projects")
          .insert(batch)
          .select("id, title, address");

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
          failed += batch.length;
        } else {
          console.log(
            `✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} projects inserted`
          );
          successful += batch.length;

          // Show sample of inserted projects
          if (data && data.length > 0) {
            data.slice(0, 2).forEach((project) => {
              console.log(`   📝 ${project.id}: ${project.title}`);
            });
          }
        }
      } catch (batchError) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, batchError.message);
        failed += batch.length;
      }
    }

    // Summary
    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Successful: ${successful} projects`);
    console.log(`   ❌ Failed: ${failed} projects`);
    console.log(`   📈 Success Rate: ${((successful / count) * 100).toFixed(1)}%`);

    if (successful > 0) {
      // Fetch some stats
      const { data: stats } = await supabase
        .from("projects")
        .select("status, new_construction")
        .order("id", { ascending: false })
        .limit(successful); // Get the recently inserted projects

      if (stats) {
        const newConstruction = stats.filter((p) => p.new_construction).length;
        const statusCounts = stats.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});

        console.log("\n📈 Project Breakdown:");
        console.log(`   🏗️  New Construction: ${newConstruction}`);
        console.log(`   📋 Status Distribution:`);
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`      Status ${status}: ${count} projects`);
        });
      }
    }

    return { successful, failed };
  } catch (error) {
    console.error("💥 Import failed:", error.message);
    return { successful: 0, failed: count };
  }
}

// Main execution
async function main() {
  const count = parseInt(process.argv[2]) || 30;

  if (count < 1 || count > 1000) {
    console.error("❌ Count must be between 1 and 1000");
    process.exit(1);
  }

  console.log("🚀 CAPCo Test Project Import Script");
  console.log("=====================================\n");

  const result = await importTestProjects(count);

  if (result.successful > 0) {
    console.log("\n🎉 Import completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   - Check the dashboard to see new projects");
    console.log("   - Visit /projects to see any featured completed projects");
    console.log("   - Projects are distributed across various statuses and assignments");
  } else {
    console.log("\n💥 Import failed completely. Check the errors above.");
    process.exit(1);
  }
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("💥 Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateProjectData, importTestProjects };
