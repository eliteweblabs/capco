# Line Items Catalog System

## 🎯 **Overview**

The Line Items Catalog System provides a reusable catalog of line items for invoices and proposals. Users can:

- **Search and select** from existing catalog items
- **Create new items** that become available for everyone
- **Maintain consistency** across invoices and proposals
- **Speed up** invoice/proposal creation

## 🏗 **System Architecture**

### **Database Structure**

#### **New Table: `line_items_catalog`**

```sql
CREATE TABLE line_items_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,              -- Item name
  description TEXT NOT NULL,               -- Detailed description
  unit_price DECIMAL(10,2) NOT NULL,      -- Default unit price
  category VARCHAR(100),                   -- Optional category
  is_active BOOLEAN DEFAULT true,         -- Active/inactive flag
  created_at TIMESTAMP WITH TIME ZONE,    -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE,    -- Last update
  created_by UUID REFERENCES auth.users(id) -- Creator
);
```

#### **Enhanced Table: `invoice_line_items`**

```sql
ALTER TABLE invoice_line_items
ADD COLUMN catalog_item_id INTEGER REFERENCES line_items_catalog(id);
```

### **Database Functions**

#### **1. Search Catalog Items**

```sql
search_catalog_items(p_search_term, p_category, p_limit)
```

- Full-text search across name and description
- Category filtering
- Usage count ordering

#### **2. Create Line Item from Catalog**

```sql
create_line_item_from_catalog(p_invoice_id, p_catalog_item_id, p_quantity, p_custom_description)
```

- Automatically creates invoice line item from catalog
- Handles quantity and custom descriptions
- Maintains catalog reference

#### **3. Popular Items View**

```sql
CREATE VIEW popular_catalog_items AS ...
```

- Shows most frequently used items
- Includes usage statistics

## 🛠 **Implementation Components**

### **1. API Endpoints**

#### **`/api/line-items-catalog`**

- **GET**: Search catalog items with filters
- **POST**: Create new catalog item
- **PUT**: Update existing item (Admin only)

#### **`/api/add-catalog-item-to-invoice`**

- **POST**: Add catalog item to specific invoice
- Handles quantity and custom descriptions
- Validates user permissions

### **2. UI Components**

#### **`LineItemSelector.astro`**

- **Search Interface**: Real-time search with category filters
- **Create New Item**: Form to add items to catalog
- **Item Selection**: Modal for quantity/description customization
- **Responsive Design**: Works on all screen sizes

### **3. Integration Points**

#### **Invoice Page** (`/invoice/[id]`)

- **"Add from Catalog"** button shows selector
- **"Add Blank Item"** creates empty line item
- **Real-time totals** update automatically

#### **Proposal Manager** (`ProposalManager.astro`)

- **"Add Line Items"** button shows selector
- **Catalog integration** for consistent proposals

## 🚀 **Key Features**

### **1. Smart Search**

- **Real-time search** as you type
- **Category filtering** for organization
- **Usage-based ranking** shows popular items first
- **Cached results** for performance

### **2. Flexible Item Creation**

- **Quick add** during invoice creation
- **Detailed descriptions** with categories
- **Automatic pricing** with override capability
- **Immediate availability** for all users

### **3. Usage Tracking**

- **Popular items** displayed first
- **Usage statistics** for analytics
- **Performance optimization** based on patterns

### **4. Permission System**

- **All users** can view active catalog items
- **All users** can create new items
- **Admins/Staff** can edit/deactivate items
- **RLS policies** ensure data security

## 📋 **Default Catalog Items**

The system comes pre-populated with common fire protection services:

| Category         | Item                      | Default Price |
| ---------------- | ------------------------- | ------------- |
| Design Services  | Fire Alarm System Design  | $2,500.00     |
| Design Services  | Sprinkler System Design   | $3,500.00     |
| Design Services  | Fire Pump Design          | $1,500.00     |
| Consulting       | Code Compliance Review    | $800.00       |
| Consulting       | Plan Review Services      | $600.00       |
| Inspection       | Site Inspection           | $400.00       |
| Testing          | System Testing            | $750.00       |
| Design Services  | Emergency Lighting Design | $900.00       |
| Safety Equipment | Fire Extinguisher Plan    | $300.00       |
| Safety Equipment | Knox Box Installation     | $200.00       |

## 🔧 **Setup Instructions**

### **1. Database Setup**

```sql
-- Run in Supabase SQL Editor:
-- Copy and execute: setup-line-items-catalog.sql
```

### **2. Deploy Code**

The following files implement the catalog system:

- `src/components/form/LineItemSelector.astro` - Main selector component
- `src/pages/api/line-items-catalog.ts` - Catalog management API
- `src/pages/api/add-catalog-item-to-invoice.ts` - Invoice integration API
- Updated invoice and proposal pages with integration

### **3. Test the System**

1. **Create/Edit Invoice**: Use "Add from Catalog" button
2. **Search Items**: Try searching for "fire alarm" or "design"
3. **Add New Item**: Create a custom line item
4. **Verify Integration**: Check that items appear in invoices

## 💡 **Usage Examples**

### **Adding Catalog Item to Invoice**

1. Open any invoice in edit mode
2. Click **"Add from Catalog"**
3. Search for desired item (e.g., "fire alarm")
4. Click **"Add"** next to the item
5. Adjust quantity/description if needed
6. Click **"Add to Invoice"**

### **Creating New Catalog Item**

1. In the line item selector, click **"+ Create New Item"**
2. Fill in:
   - **Name**: "Custom Fire Safety Inspection"
   - **Price**: $350.00
   - **Category**: "Inspection"
   - **Description**: "Detailed description..."
3. Click **"Save to Catalog"**
4. Item is now available for all users

### **Bulk Invoice Creation**

1. Create invoice template with common items
2. Use catalog to quickly add standard services
3. Customize quantities and descriptions as needed
4. Save time on repetitive invoice creation

## 🎨 **User Experience**

### **Search Experience**

- **Instant results** as you type
- **Visual categories** with color coding
- **Usage indicators** show popular items
- **Smart suggestions** based on project type

### **Mobile Friendly**

- **Responsive design** works on all devices
- **Touch-friendly** buttons and inputs
- **Optimized performance** for mobile networks

### **Accessibility**

- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** mode support
- **Clear focus indicators**

## 🔍 **Performance Optimizations**

### **Caching Strategy**

- **API responses** cached for 5-10 minutes
- **Profile data** cached separately
- **Search results** cached by query
- **Automatic cleanup** prevents memory leaks

### **Database Optimization**

- **Indexes** on frequently queried columns
- **Materialized views** for popular items
- **Efficient RLS policies** avoid recursion
- **Connection pooling** ready

### **Frontend Optimization**

- **Lazy loading** of search results
- **Debounced search** reduces API calls
- **Progressive enhancement** works without JS
- **Minimal bundle size** impact

## 🔐 **Security Considerations**

### **Row Level Security**

- **Authenticated access** required for catalog
- **Admin controls** for item management
- **User isolation** for invoice access
- **Audit trail** for all changes

### **Input Validation**

- **Server-side validation** for all inputs
- **SQL injection prevention** with parameterized queries
- **XSS protection** with proper escaping
- **Rate limiting** on API endpoints

### **Data Privacy**

- **No sensitive data** in catalog items
- **User consent** for data usage
- **GDPR compliance** considerations
- **Regular security audits**

## 📊 **Analytics & Reporting**

### **Usage Metrics**

- **Most popular items** tracking
- **Category distribution** analysis
- **User adoption** rates
- **Performance benchmarks**

### **Business Intelligence**

- **Revenue by category** reporting
- **Service popularity** trends
- **Pricing optimization** insights
- **Customer preferences** analysis

## 🚀 **Future Enhancements**

### **Phase 2 Features**

- **Bulk import/export** of catalog items
- **Template libraries** for different project types
- **Advanced pricing rules** (volume discounts, etc.)
- **Integration with external** pricing databases

### **Advanced Features**

- **AI-powered suggestions** based on project details
- **Automated categorization** of new items
- **Multi-language support** for descriptions
- **Custom fields** for specialized data

---

**Implementation Status**: ✅ **Complete and Ready to Use**
**Performance Impact**: **Positive** - Faster invoice creation, better consistency
**User Training**: **Minimal** - Intuitive interface with built-in help
