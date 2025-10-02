# Flowbite Components Documentation

This document provides comprehensive documentation for all Flowbite components created for the CAPCo Fire Protection Systems project.

## 🎯 Overview

These components are built using Flowbite design patterns and are specifically designed to work with Safari 18+ viewport changes. They provide a modern, responsive dashboard interface that solves the persistent WebKit positioning bugs.

## 📦 Available Components

### 1. FlowbiteNavbar

**File**: `src/components/common/FlowbiteNavbar.astro`

A responsive navigation bar with mobile menu support.

**Props**:

- `isAuth: boolean` - Authentication status
- `currentUser: any` - Current user object
- `currentRole: string` - User role (Admin/Client)
- `session: any` - Session data
- `desktopNavigationHTML: string` - Desktop navigation HTML
- `id?: string` - Optional page ID for back button

**Usage**:

```astro
<FlowbiteNavbar
  isAuth={isAuth}
  currentUser={currentUser}
  currentRole={currentRole}
  session={session}
  desktopNavigationHTML={desktopNavigationHTML}
  id={id}
/>
```

### 2. FlowbiteSidebar

**File**: `src/components/common/FlowbiteSidebar.astro`

A collapsible sidebar navigation for dashboard layouts.

**Props**:

- `isAuth: boolean` - Authentication status
- `currentUser: any` - Current user object
- `currentRole: string` - User role
- `session: any` - Session data

**Features**:

- Role-based navigation (Admin vs Client)
- Mobile responsive with overlay
- Smooth animations
- Dark mode support

### 3. FlowbiteStatsCard

**File**: `src/components/common/FlowbiteStatsCard.astro`

A card component for displaying statistics and metrics.

**Props**:

- `title: string` - Card title
- `value: string | number` - Main value to display
- `change?: { value: string, type: 'increase' | 'decrease' }` - Change indicator
- `icon?: string` - BoxIcon icon name
- `color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'` - Color theme

**Usage**:

```astro
<FlowbiteStatsCard
  title="Total Projects"
  value="24"
  change={{ value: "12%", type: "increase" }}
  icon="folder"
  color="blue"
/>
```

### 4. FlowbiteStatsGrid

**File**: `src/components/common/FlowbiteStatsGrid.astro`

A grid layout for multiple stats cards.

**Props**:

- `stats: Array<StatsCardProps>` - Array of stats card data
- `columns?: 1 | 2 | 3 | 4` - Number of columns (default: 4)

**Usage**:

```astro
<FlowbiteStatsGrid stats={statsData} columns={4} />
```

### 5. FlowbiteChart

**File**: `src/components/common/FlowbiteChart.astro`

A chart component for data visualization.

**Props**:

- `title?: string` - Chart title
- `type?: 'line' | 'bar' | 'pie' | 'area'` - Chart type
- `data?: any` - Chart data
- `height?: string` - Chart height (default: "400px")
- `showLegend?: boolean` - Show legend (default: true)
- `showTooltip?: boolean` - Show tooltips (default: true)

**Usage**:

```astro
<FlowbiteChart title="Project Progress" type="line" height="300px" />
```

### 6. FlowbiteTable

**File**: `src/components/common/FlowbiteTable.astro`

A responsive data table with pagination and actions.

**Props**:

- `title?: string` - Table title
- `headers: string[]` - Column headers
- `data: any[]` - Table data
- `showActions?: boolean` - Show action buttons (default: true)
- `showPagination?: boolean` - Show pagination (default: true)
- `itemsPerPage?: number` - Items per page (default: 10)

**Usage**:

```astro
<FlowbiteTable
  title="Recent Projects"
  headers={["Project", "Status", "Progress"]}
  data={projectData}
  showActions={true}
/>
```

### 7. FlowbiteDrawer

**File**: `src/components/common/FlowbiteDrawer.astro`

A slide-out drawer for mobile navigation and quick actions.

**Props**:

- `id: string` - Unique drawer ID
- `title?: string` - Drawer title
- `position?: 'left' | 'right'` - Drawer position (default: "right")
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Drawer size (default: "md")
- `showCloseButton?: boolean` - Show close button (default: true)

**Usage**:

```astro
<FlowbiteDrawer id="mobile-actions" title="Quick Actions" position="right" size="md">
  <!-- Drawer content -->
</FlowbiteDrawer>
```

### 8. FlowbiteDashboardLayout

**File**: `src/components/common/FlowbiteDashboardLayout.astro`

Main layout component for dashboard pages.

**Props**:

- `isAuth: boolean` - Authentication status
- `currentUser: any` - Current user object
- `currentRole: string` - User role
- `session: any` - Session data
- `desktopNavigationHTML: string` - Desktop navigation HTML
- `id?: string` - Optional page ID
- `pageTitle?: string` - Page title (default: "Dashboard")
- `showSidebar?: boolean` - Show sidebar (default: true)

**Usage**:

```astro
<FlowbiteDashboardLayout
  isAuth={isAuth}
  currentUser={currentUser}
  currentRole={currentRole}
  session={session}
  desktopNavigationHTML={desktopNavigationHTML}
  pageTitle="My Dashboard"
>
  <!-- Page content -->
</FlowbiteDashboardLayout>
```

## 🚀 Example Implementation

See `src/pages/flowbite-dashboard.astro` for a complete example showing how to use all components together.

## 🎨 Styling

All components use Tailwind CSS classes and are designed to work with:

- Dark mode support
- Responsive design
- Safari 18+ viewport fixes
- BoxIcons for icons
- Custom color schemes

## 🔧 Integration

To integrate these components into existing pages:

1. **Replace Header**: Update `src/components/common/Header.astro` to use `FlowbiteNavbar`
2. **Add Sidebar**: Use `FlowbiteSidebar` in dashboard layouts
3. **Update Layout**: Replace existing layouts with `FlowbiteDashboardLayout`
4. **Add Components**: Use individual components as needed

## 🐛 Safari 18+ Compatibility

These components are specifically designed to work around Safari 18+ viewport bugs:

- Fixed positioning works correctly
- Sticky headers stay in place
- Mobile navigation functions properly
- No random viewport jumping

## 📱 Mobile Support

All components are fully responsive and include:

- Mobile-first design
- Touch-friendly interactions
- Collapsible navigation
- Drawer-based mobile menus

## 🎯 Next Steps

1. **Integration**: Replace existing components with Flowbite versions
2. **Customization**: Adjust colors and styling to match brand
3. **Testing**: Test across different devices and browsers
4. **Documentation**: Update component documentation as needed

## 📚 Resources

- [Flowbite Documentation](https://flowbite.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [BoxIcons](https://boxicons.com/)
- [Safari 18 Viewport Issues](https://webkit.org/blog/13878/new-webkit-features-in-safari-15/)
