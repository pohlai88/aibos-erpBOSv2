"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'aibos-ui';

interface TenantSwitcherProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
}

export function TenantSwitcher({ selectedTenant, onTenantChange }: TenantSwitcherProps): React.JSX.Element {
  const tenants = [
    {
      id: 'sandbox',
      name: 'Sandbox',
      description: 'Sample data with accounts',
      icon: '🏪'
    },
    {
      id: 'empty',
      name: 'Empty',
      description: 'Clean slate for testing',
      icon: '📋'
    },
    {
      id: 'seed-heavy',
      name: 'Seed Heavy',
      description: 'Large dataset for performance',
      icon: '📊'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="text-lg"
          style={{
            color: 'hsl(var(--aibos-semantic-foreground))',
            fontSize: 'var(--aibos-font-size-lg)',
            fontWeight: 'var(--aibos-font-weight-semibold)'
          }}
        >
          Data Environment
        </CardTitle>
        <CardDescription
          className="text-sm"
          style={{
            color: 'hsl(var(--aibos-semantic-muted-foreground))',
            fontSize: 'var(--aibos-font-size-sm)'
          }}
        >
          Choose your testing environment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {tenants.map(tenant => (
          <button
            key={tenant.id}
            onClick={() => onTenantChange(tenant.id)}
            className="w-full rounded-lg border p-4 text-left transition-all duration-300 hover:scale-105"
            style={{
              borderColor: selectedTenant === tenant.id
                ? 'hsl(var(--aibos-semantic-primary))'
                : 'hsl(var(--aibos-semantic-border))',
              background: selectedTenant === tenant.id
                ? 'hsl(var(--aibos-semantic-primary) / 0.1)'
                : 'transparent',
              borderRadius: 'calc(var(--aibos-spacing-unit) * 1)'
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{tenant.icon}</span>
              <div className="flex-1">
                <div
                  className="font-semibold text-base mb-1"
                  style={{
                    color: 'hsl(var(--aibos-semantic-foreground))',
                    fontSize: 'var(--aibos-font-size-base)',
                    fontWeight: 'var(--aibos-font-weight-semibold)'
                  }}
                >
                  {tenant.name}
                </div>
                <div
                  className="text-sm"
                  style={{
                    color: 'hsl(var(--aibos-semantic-muted-foreground))',
                    fontSize: 'var(--aibos-font-size-sm)'
                  }}
                >
                  {tenant.description}
                </div>
              </div>
              {selectedTenant === tenant.id && (
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'hsl(var(--aibos-success) / 0.15)',
                    color: 'hsl(var(--aibos-success))',
                    border: '1px solid hsl(var(--aibos-success) / 0.3)',
                    fontSize: 'var(--aibos-font-size-xs)',
                    fontWeight: 'var(--aibos-font-weight-medium)'
                  }}
                >
                  Selected
                </span>
              )}
            </div>
          </button>
        ))}

        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: 'hsl(var(--aibos-semantic-primary) / 0.1)',
            border: '1px solid hsl(var(--aibos-semantic-primary) / 0.3)',
            borderRadius: 'calc(var(--aibos-spacing-unit) * 1)'
          }}
        >
          <div
            className="text-sm"
            style={{
              color: 'hsl(var(--aibos-semantic-primary))',
              fontSize: 'var(--aibos-font-size-sm)'
            }}
          >
            <div
              className="font-semibold mb-1"
              style={{ fontWeight: 'var(--aibos-font-weight-semibold)' }}
            >
              Selected: {selectedTenant}
            </div>
            <div className="opacity-80">This will be used when launching modules</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}