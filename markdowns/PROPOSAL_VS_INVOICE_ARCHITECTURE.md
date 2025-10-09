# Proposal vs Invoice Architecture

## 🏗 **System Architecture Overview**

This document clarifies how proposals and invoices work in the system and where data is stored.

## 📋 **Data Storage Architecture**

### **Proposals**

- **Subject Storage**: `invoices.subject` column (in "proposal" status invoices)
- **Line Items**: Generated dynamically from project data OR selected from `line_items_catalog`
- **Relationship**: 1 Project → 1 Proposal Invoice (status="proposal")
- **Purpose**: Pre-sales estimates and service proposals

### **Invoices**

- **Invoice Data**: `invoices` table
- **Line Items**: `invoice_line_items` table
- **Catalog Reference**: `invoice_line_items.catalog_item_id` → `line_items_catalog.id`
- **Relationship**: 1 Project → Many Invoices
- **Purpose**: Actual billing and payment processing

### **Line Items Catalog**

- **Catalog Items**: `line_items_catalog` table
- **Usage Tracking**: Referenced by both proposals and invoices
- **Purpose**: Reusable service items with standard pricing

## 🎯 **Current Implementation Status**

### **✅ Completed Features**

#### **Line Items Catalog System**

- ✅ `line_items_catalog` table with reusable service items
- ✅ Search and filter functionality
- ✅ Create new catalog items
- ✅ Usage tracking and popular items
- ✅ Integration with invoice system

#### **Invoice System**

- ✅ `invoices` table for invoice data
- ✅ `invoice_line_items` table for line items
- ✅ Catalog integration via `catalog_item_id` foreign key
- ✅ Add items from catalog to invoices
- ✅ Custom line items (not from catalog)

#### **Proposal Subject Feature**

- ✅ UI components for editable subject
- ✅ API endpoint for saving subjects
- ✅ Database migration script
- ⚠️ **REQUIRES**: Running `add-proposal-subject-column.sql`

### **🔄 Current Issue**

The error you're seeing is because the `proposal_subject` column doesn't exist in the `projects` table yet. You need to run the database migration.

## 🛠 **Database Schema**

### **Projects Table** (Proposals)

```sql
-- Current structure
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id),
  title TEXT,
  description TEXT,
  address TEXT,
  status INTEGER,
  -- ... other existing columns

  -- No subject column needed here - proposals use invoices table
);
```

### **Invoices Table**

```sql
-- Already exists
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  invoice_number TEXT,
  status TEXT, -- Can be "proposal", "draft", "sent", "paid", etc.
  total_amount DECIMAL(10,2),
  created_by UUID REFERENCES auth.users(id),

  -- PROPOSAL SUBJECT COLUMN (should already exist)
  subject TEXT DEFAULT NULL, -- ← Stores proposal subjects!

  -- ... other invoice fields
);
```

### **Invoice Line Items Table**

```sql
-- Already exists
CREATE TABLE invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id),
  description TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  sortOrder INTEGER,

  -- NEW COLUMN (already added by line items catalog system)
  catalog_item_id INTEGER REFERENCES line_items_catalog(id)
);
```

### **Line Items Catalog Table**

```sql
-- Already exists (from line items catalog system)
CREATE TABLE line_items_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

## 🔧 **How to Fix the Current Error**

### **Step 1: Verify Column Exists**

Since you already created the `subject` column in the invoices table, you can verify it exists:

```sql
-- Check if the subject column exists in invoices table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'subject';
```

If the column doesn't exist, create it:

```sql
ALTER TABLE invoices
ADD COLUMN subject TEXT DEFAULT NULL;
```

### **Step 2: Verify Migration**

You can test if the column exists by calling:

```
GET /api/check-proposal-subject-column
```

### **Step 3: Test the Feature**

1. Generate or view a proposal
2. Click the edit icon next to the subject
3. Change the subject and save
4. Verify it persists after page refresh

## 📊 **Data Flow Diagrams**

### **Proposal Flow**

```
Project → ProposalManager → Generate Proposal
   ↓
Project.proposal_subject ← Save Subject
   ↓
Line Items Catalog → Select Items → Display in Proposal
```

### **Invoice Flow**

```
Project → Create Invoice → invoices table
   ↓
Line Items Catalog → Select Items → invoice_line_items table
   ↓                                      ↓
catalog_item_id reference              Invoice Display
```

## 🎨 **User Experience**

### **Proposals**

- **Generate**: Click "Build Proposal" on project page
- **Edit Subject**: Click edit icon next to proposal subject
- **Add Line Items**: Use catalog selector (planned)
- **Convert**: Convert proposal to invoice (copies data)

### **Invoices**

- **Create**: Generate from project or proposal
- **Add Items**: Use catalog selector (working)
- **Edit**: Modify quantities, prices, descriptions
- **Send**: Email invoice to client

## 🔍 **Troubleshooting**

### **Error: "Failed to update proposal subject"**

**Cause**: `subject` column doesn't exist in `invoices` table
**Solution**: Ensure the `subject` column exists in your invoices table

### **Error: "Column 'subject' not found"**

**Cause**: Subject column missing from invoices table
**Solution**: Verify the `subject` column exists in the invoices table

### **Error: "Migration required"**

**Cause**: API detected missing column
**Solution**: The enhanced error handling will show this message - run the migration

## 🚀 **Next Steps**

### **Immediate (Fix Current Error)**

1. ✅ Verify `subject` column exists in invoices table
2. ✅ Test proposal subject editing
3. ✅ Verify data persistence

### **Future Enhancements**

1. **Proposal Line Items**: Integrate catalog selector with proposals
2. **Proposal Storage**: Optional separate proposals table
3. **Template System**: Proposal templates by service type
4. **Version History**: Track proposal changes over time

## 📋 **Summary**

| Feature                 | Storage Location             | Status     |
| ----------------------- | ---------------------------- | ---------- |
| **Proposal Subject**    | `invoices.subject`           | ✅ Ready   |
| **Proposal Line Items** | Generated dynamically        | ✅ Working |
| **Invoice Data**        | `invoices` table             | ✅ Working |
| **Invoice Line Items**  | `invoice_line_items` table   | ✅ Working |
| **Catalog Items**       | `line_items_catalog` table   | ✅ Working |
| **Catalog Integration** | `catalog_item_id` references | ✅ Working |

**Status**: Ready to use! The system now uses the existing `subject` column in the invoices table to store proposal subjects.

---

**The system is designed correctly** - proposals save to projects table, invoices save to invoices table, and both can use the shared line items catalog. The current error is simply because the database column hasn't been created yet.
