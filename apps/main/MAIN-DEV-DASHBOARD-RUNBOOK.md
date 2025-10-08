# 🚀 Main Master Dashboard - Module Launcher

**Location**: `C:\AI-BOS\aibos-erpBOS\apps\main`  
**Port**: `3001`  
**Purpose**: Master module selector and launcher dashboard  
**Status**: ✅ **Production Ready** | **Enhanced with aibos-ui**

---

## 📋 Overview

The Main Master Dashboard is a beautiful module launcher that allows users to select and navigate to available ERP modules. It provides:

- **Module Cards**: Beautiful cards for each available module (M01, M02, M03...)
- **One-Click Launch**: Click M01 card → Navigate to real M01 Core Ledger interface
- **Tenant Selection**: Choose data environment before launching modules
- **Scalable Design**: Easy to add new module cards as they become available

---

## 🏗️ Architecture

```
Main Master Dashboard (3001) → Module Launcher
├── Beautiful Module Cards → aibos-ui Components
├── M01 Card → Redirects to Real M01 Core Ledger (3001)
├── M02 Card → Coming Soon (Future)
├── M03 Card → Coming Soon (Future)
└── Tenant Selector → Choose Data Environment
```

## 🎨 UI/UX with aibos-ui

The master dashboard leverages enterprise-grade aibos-ui components for:

- **Module Cards**: Beautiful, interactive cards for each module
- **Launch Buttons**: Premium buttons for module navigation
- **Dark Theme First**: WCAG 2.2 AAA accessibility compliance
- **Responsive Grid**: Clean layout for module selection

---

## 🚀 Getting Started

### 1. Start the Dashboard

```bash
# Start Main Dev Dashboard
pnpm --filter @aibos/main dev

# Dashboard will be available at:
# http://localhost:3001
```

### 2. Start Required Services

```bash
# Terminal 1: Start BFF (Backend)
pnpm --filter @aibos/bff dev

# Terminal 2: Start Web App (M01 UI)
pnpm --filter @aibos/web dev -- -p 3001

# Terminal 3: Start Supabase (Database)
supabase start
```

---

## 🎯 Dashboard Features

### Module Cards

Each module is presented as a beautiful card showing:

- **Module Icon**: Visual identifier (📊 for M01, 📝 for M02, etc.)
- **Status**: ✅ Ready, 🚧 Beta, ⏳ Coming Soon
- **Description**: Clear explanation of module capabilities
- **Stats**: API endpoints, UI components, last updated date
- **Launch Button**: One-click navigation to the real module interface

### Tenant Environment Selection

Choose your testing environment:

- **🏪 Sandbox**: Sample data with accounts (Cash, AR, Inventory, etc.)
- **📋 Empty**: Clean slate for testing
- **📊 Seed Heavy**: Large dataset for performance testing

### Module Navigation Flow

1. **Select Environment**: Choose tenant in left panel
2. **Click Module Card**: Click M01 card to launch Core Ledger
3. **Navigate to Real Module**: Opens actual M01 interface with selected tenant
4. **Test & Explore**: Full access to M01 Core Ledger features

---

## 🔧 Configuration

### Environment Variables

```bash
# apps/main/.env.local
NEXT_PUBLIC_BFF_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WEB_SANDBOX_BASE_URL=http://localhost:3001
```

### Module Configuration

Modules are configured in `packages/config/src/feature-flags.ts`:

```typescript
export const MODULE_REGISTRY: Record<FeatureKey, ModuleStatus> = {
  M01: {
    id: "M01",
    name: "Core Ledger",
    status: "on", // ✅ Production Ready
    endpoints: [...],
    uiComponents: [...]
  },
  M02: {
    id: "M02",
    name: "Journal Entries",
    status: "off", // ⏳ Coming Next
    endpoints: [],
    uiComponents: []
  }
  // ... M03, M04, etc.
};
```

---

## 📱 Usage Guide

### 1. Launch M01 Core Ledger

1. Open Master Dashboard: `http://localhost:3001`
2. Select your preferred environment (Sandbox, Empty, or Seed Heavy)
3. Click the M01 Core Ledger card
4. Opens real M01 interface: `http://localhost:3001/core-ledger?tenant=sandbox`

### 2. Test Different Environments

1. Select environment in left panel:
   - **🏪 Sandbox**: Sample accounts (Cash, AR, Inventory, etc.)
   - **📋 Empty**: Clean database for fresh testing
   - **📊 Seed Heavy**: Large dataset for performance testing
2. Click M01 card to launch with selected environment
3. Test M01 features with your chosen data scenario

### 3. Explore Module Features

- **M01 Card**: Shows "✅ Ready" status with launch button
- **Module Stats**: Displays API endpoints and UI components count
- **Coming Soon**: M02 and M03 cards show "⏳ Coming Soon" status

---

## 🔄 Development Workflow

### Adding New Modules (M02, M03, etc.)

1. **Update Module Registry**:

   ```typescript
   // packages/config/src/feature-flags.ts
   M02: {
     id: "M02",
     name: "Journal Entries",
     status: "on", // Enable when ready
     endpoints: [...],
     uiComponents: [...]
   }
   ```

2. **Add Web App Routes**:

   ```bash
   # apps/web/app/(dashboard)/
   mkdir journal-entries
   # Add page.tsx, components, etc.
   ```

3. **Update BFF APIs**:

   ```bash
   # apps/bff/app/api/
   mkdir journal-entries
   # Add route handlers
   ```

4. **Test via Dashboard**:
   - Module appears in dashboard
   - Status shows "✅ Ready"
   - Navigation works to new module

---

## 🛠️ Troubleshooting

### Common Issues

1. **Module Not Loading**:
   - Check BFF is running (port 3000)
   - Check Web App is running (port 3001)
   - Check Supabase is running

2. **Navigation Not Working**:
   - Verify ports in SandboxLauncher component
   - Check environment variables
   - Ensure API rewrite is configured

3. **Feature Flags Not Updating**:
   - Check module registry configuration
   - Verify flag panel state management
   - Check browser console for errors

### Port Configuration

- **Main Dashboard**: 3001
- **BFF (Backend)**: 3000
- **Web App (M01 UI)**: 3001
- **Supabase**: 54321 (API), 54322 (DB), 54323 (Studio)

---

## 📚 Future Enhancements

### Planned Features

1. **API Testing Panel**: Direct endpoint testing
2. **Performance Monitoring**: Module performance metrics
3. **Database Management**: Direct database operations
4. **User Management**: Multi-user development support
5. **Deployment Controls**: Staging/production deployment

### Module Roadmap

- **M01**: Core Ledger ✅ Complete
- **M02**: Journal Entries ⏳ Next
- **M03**: Trial Balance ⏳ Next
- **M04-M40**: Following UI Runbook plan

---

## ✅ Success Criteria

The Main Dev Dashboard is successful when:

1. **Navigation Works**: All modules accessible via dashboard
2. **Feature Flags Work**: Modules can be toggled on/off
3. **Tenant Switching Works**: Different data scenarios available
4. **Production Ready**: Stable, reliable, documented
5. **Scalable**: Easy to add M02, M03... M1XX modules

---

**Last Updated**: 2025-01-08  
**Owner**: Development Team  
**Status**: ✅ Production Ready
